import { AccessControlService } from "../services/accessControlService";
import { EmployerAccess } from "../models/EmployerAccess";
import { User } from "../models/User";

import express, { Request, Response } from "express";

const router = express.Router();

/**
 * Get staged student profile based on employer's access level
 */
router.get(
  "/student/:studentId/profile",
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const employerId = req.user?.userId;

      if (!employerId) {
        res.status(401).json({ error: "Employer authentication required" });
        return;
      }

      // Get full student profile
      const student = await User.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Get staged profile based on access level
      const stagedProfile = await AccessControlService.getStagedProfile(
        employerId,
        studentId,
        student,
      );

      res.json(stagedProfile);
    } catch (error) {
      console.error("Error getting staged profile:", error);
      res.status(500).json({ error: "Failed to retrieve profile" });
    }
  },
);

/**
 * Check employer's current access level for a student
 */
router.get(
  "/student/:studentId/access-level",
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const employerId = req.user?.userId;

      const accessLevel = await (EmployerAccess as any).getAccessLevel(
        employerId,
        studentId,
      );
      const canUpgrade = await AccessControlService.canUpgradeAccess(
        employerId,
        studentId,
        accessLevel + 1,
      );

      res.json({
        currentLevel: accessLevel,
        canUpgrade,
        nextLevel: accessLevel + 1,
        maxLevel: 4,
      });
    } catch (error) {
      console.error("Error checking access level:", error);
      res.status(500).json({ error: "Failed to check access level" });
    }
  },
);

/**
 * Request access level upgrade
 */
router.post(
  "/student/:studentId/request-upgrade",
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { targetLevel, commitmentType, agreementAccepted } = req.body;
      const employerId = req.user?.userId;

      if (!employerId) {
        res.status(401).json({ error: "Employer authentication required" });
        return;
      }

      // Validate target level
      if (targetLevel < 1 || targetLevel > 4) {
        res.status(400).json({ error: "Invalid target level" });
        return;
      }

      // Check if upgrade is possible
      const canUpgrade = await AccessControlService.canUpgradeAccess(
        employerId,
        studentId,
        targetLevel,
      );
      if (!canUpgrade) {
        res.status(403).json({
          error: "Access upgrade requirements not met",
          requirements: await getUpgradeRequirements(
            employerId,
            studentId,
            targetLevel,
          ),
        });
        return;
      }

      // For Level 2+, require agreement acceptance
      if (targetLevel >= 2 && !agreementAccepted) {
        res.status(400).json({ error: "Employer agreement must be accepted" });
        return;
      }

      // Update agreement status if accepting
      if (agreementAccepted) {
        await EmployerAccess.findOneAndUpdate(
          { employerId, studentId },
          {
            agreementSigned: true,
            agreementSignedAt: new Date(),
          },
          { upsert: true },
        );
      }

      // Process upgrade based on level
      if (targetLevel <= 2) {
        // Levels 1-2: Free with agreement
        await AccessControlService.upgradeAccess(
          employerId,
          studentId,
          targetLevel,
          commitmentType,
        );
        res.json({ success: true, accessLevel: targetLevel });
      } else if (targetLevel === 3) {
        // Level 3: Requires payment or subscription
        res.json({
          requiresPayment: true,
          paymentOptions: [
            {
              type: "interview_fee",
              amount: 50,
              currency: "GBP",
              description: "One-time interview access",
            },
            {
              type: "monthly_subscription",
              amount: 200,
              currency: "GBP",
              description: "Monthly platform access",
            },
          ],
        });
      } else if (targetLevel === 4) {
        // Level 4: Requires full commitment (success fee agreement)
        res.json({
          requiresCommitment: true,
          commitmentOptions: [
            {
              type: "success_fee",
              rate: 15,
              unit: "percent",
              description: "15% of first-year salary upon successful hire",
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error requesting access upgrade:", error);
      res.status(500).json({ error: "Failed to process upgrade request" });
    }
  },
);

/**
 * Process payment for access upgrade
 */
router.post(
  "/student/:studentId/process-payment",
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const {
        targetLevel,
        paymentMethod: _paymentMethod,
        stripePaymentIntentId,
      } = req.body;
      const employerId = req.user?.userId;

      // TODO: Verify payment with Stripe
      // const paymentVerified = await verifyStripePayment(stripePaymentIntentId);

      // For now, simulate successful payment
      const paymentVerified = true;

      if (paymentVerified) {
        // Update payment status
        await EmployerAccess.findOneAndUpdate(
          { employerId, studentId },
          {
            paymentStatus: "paid",
            commitmentType: "interview_fee",
          },
          { upsert: true },
        );

        // Upgrade access
        await AccessControlService.upgradeAccess(
          employerId,
          studentId,
          targetLevel,
          "interview_fee",
          stripePaymentIntentId,
        );

        res.json({ success: true, accessLevel: targetLevel });
      } else {
        res.status(400).json({ error: "Payment verification failed" });
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  },
);

/**
 * Accept success fee commitment for Level 4 access
 */
router.post(
  "/student/:studentId/accept-commitment",
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { commitmentType, agreementSigned } = req.body;
      const employerId = req.user?.userId;

      if (!agreementSigned) {
        res.status(400).json({ error: "Success fee agreement must be signed" });
        return;
      }

      // Update commitment status
      await EmployerAccess.findOneAndUpdate(
        { employerId, studentId },
        {
          commitmentType: "success_fee",
          paymentStatus: "pending", // Will be paid upon hire
          agreementSigned: true,
          agreementSignedAt: new Date(),
        },
        { upsert: true },
      );

      // Upgrade to Level 4
      await AccessControlService.upgradeAccess(
        employerId,
        studentId,
        4,
        "success_fee",
      );

      res.json({ success: true, accessLevel: 4 });
    } catch (error) {
      console.error("Error accepting commitment:", error);
      res.status(500).json({ error: "Failed to process commitment" });
    }
  },
);

/**
 * Track employer interaction with student
 */
router.post(
  "/student/:studentId/track-interaction",
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { interactionType, metadata } = req.body;
      const employerId = req.user?.userId;

      await AccessControlService.trackInteraction(
        employerId,
        studentId,
        interactionType,
        {
          ...metadata,
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        },
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking interaction:", error);
      res.status(500).json({ error: "Failed to track interaction" });
    }
  },
);

/**
 * Report suspicious activity
 */
router.post("/student/:studentId/report-suspicious", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reason, evidence } = req.body;
    const reporterId = req.user?.userId;

    await AccessControlService.flagSuspiciousActivity(
      reporterId, // Could be the employer being reported
      studentId,
      reason,
      evidence,
    );

    res.json({ success: true, message: "Report submitted for review" });
  } catch (error) {
    console.error("Error reporting suspicious activity:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

/**
 * Get access requirements for upgrade
 */
async function getUpgradeRequirements(
  employerId: string,
  studentId: string,
  targetLevel: number,
) {
  const access = await EmployerAccess.findOne({ employerId, studentId });
  const requirements = [];

  if (targetLevel >= 2 && (!access || !access.agreementSigned)) {
    requirements.push("employer_agreement_signature");
  }

  if (targetLevel >= 3 && (!access || access.paymentStatus === "none")) {
    requirements.push("payment_or_subscription");
  }

  if (targetLevel >= 4 && (!access || access.commitmentType === "none")) {
    requirements.push("success_fee_commitment");
  }

  return requirements;
}

export default router;
