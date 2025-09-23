import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";

const router = express.Router();

// Mock email sending function - in production, integrate with email service
const sendEmail = async (formData: any) => {
  // This would integrate with services like SendGrid, Mailgun, or AWS SES
  console.log("📧 Contact form submission:", {
    from: formData.email,
    name: formData.name,
    subject: formData.subject,
    message: formData.message,
    userType: formData.userType,
    recipient: formData.recipient,
    timestamp: new Date().toISOString(),
  });

  // For now, we'll just log the email details
  // In production, you would implement actual email sending here
  return true;
};

/**
 * Handle contact form submissions
 */
router.post(
  "/",
  [
    body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("subject")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Subject is required"),
    body("message")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Message must be at least 10 characters"),
    body("userType")
      .isIn(["student", "employer", "other"])
      .withMessage("Valid user type is required"),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { name, email, subject, message, userType } = req.body;

      // Format email content
      const emailData = {
        recipient: "hello@apprenticeapex.co.uk",
        name,
        email,
        subject: `Contact Form: ${subject}`,
        message: `
Contact Form Submission

Name: ${name}
Email: ${email}
User Type: ${userType}
Subject: ${subject}

Message:
${message}

---
Submitted at: ${new Date().toISOString()}
      `,
        userType,
      };

      // Send email
      await sendEmail(emailData);

      res.json({
        success: true,
        message:
          "Your message has been sent successfully. We'll get back to you within 24 hours.",
      });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send message. Please try again later.",
      });
    }
  },
);

/**
 * Get contact information
 */
router.get("/info", (_req: Request, res: Response) => {
  res.json({
    success: true,
    contact: {
      email: "hello@apprenticeapex.co.uk",
      supportHours: "Monday - Friday, 9:00 AM - 6:00 PM GMT",
      responseTime: "Within 24 hours",
      address: "United Kingdom",
    },
  });
});

export default router;
