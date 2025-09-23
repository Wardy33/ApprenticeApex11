import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { aiModerationService } from "../services/aiModerationService";

const router = Router();

// Enhanced message sending with AI monitoring
router.post(
  "/conversations/:id/messages",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id: conversationId } = req.params;
      const { content, messageType = "text" } = req.body;
      const senderId = req.user!.userId;

      console.log(
        `📨 New message in conversation ${conversationId} from user ${senderId}`,
      );

      // Validate input
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          error: "Message content is required",
        });
      }

      // Check if conversation is blocked (in production, would check database)
      const conversationBlocked = false; // Would query database
      if (conversationBlocked) {
        return res.status(403).json({
          error: "This conversation has been blocked",
          reason: "Previous violation detected",
        });
      }

      // AI analysis for contact information
      console.log(`🤖 Analyzing message content for violations...`);
      const aiAnalysis = await aiModerationService.analyzeMessage(
        content,
        senderId,
        conversationId,
      );

      if (aiAnalysis.shouldBlock) {
        console.log(
          `🚨 MESSAGE BLOCKED - AI detected violations:`,
          aiAnalysis.flags.map((f) => f.type),
        );

        // Create blocked message record (in production, would save to database)
        const blockedMessageId = String(Date.now());

        // Block conversation and notify admin
        await aiModerationService.blockAndReport(
          blockedMessageId,
          conversationId,
          aiAnalysis.flags,
          senderId,
        );

        // Return error to sender
        return res.status(403).json({
          error: "Message blocked: Contact information sharing is not allowed",
          message:
            "To protect our candidates, sharing phone numbers, emails, or requesting contact outside this platform is prohibited. This incident has been reported to administrators.",
          blocked: true,
          violations: aiAnalysis.flags.map((f) => f.type),
          confidence: aiAnalysis.confidence,
        });
      }

      // If message passes AI check, save normally (in production, would save to database)
      const newMessage = {
        id: String(Date.now()),
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        flagged_by_ai: false,
        ai_confidence_score: aiAnalysis.confidence || 0,
        created_at: new Date().toISOString(),
      };

      console.log(`✅ Message approved and saved: ${newMessage.id}`);

      // Update conversation last message time (in production, would update database)
      console.log(
        `📝 Updated conversation ${conversationId} last message time`,
      );

      return res.status(201).json({
        message: newMessage,
        aiChecked: true,
        safe: true,
        confidence: aiAnalysis.confidence || 0,
      });
    } catch (error) {
      console.error("❌ Error sending message:", error);
      const msg = error instanceof Error ? error.message : String(error);
      return res.status(500).json({
        error: "Failed to send message",
        details: msg,
      });
    }
  },
);

// Get conversation messages
router.get(
  "/conversations/:id/messages",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id: conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const userId = req.user!.userId;

      console.log(
        `📖 Loading messages for conversation ${conversationId}, user ${userId}`,
      );

      // In production, would query database with pagination
      const mockMessages = [
        {
          id: "1",
          conversation_id: conversationId,
          sender_id: userId,
          content:
            "Hi! I'm interested in this apprenticeship opportunity. Could you tell me more about the role?",
          message_type: "text",
          flagged_by_ai: false,
          blocked_by_ai: false,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        },
        {
          id: "2",
          conversation_id: conversationId,
          sender_id: "other-user",
          content:
            "Thank you for your interest! This is a great opportunity in software development. What's your background in programming?",
          message_type: "text",
          flagged_by_ai: false,
          blocked_by_ai: false,
          created_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), // 23 hours ago
        },
        {
          id: "3",
          conversation_id: conversationId,
          sender_id: userId,
          content:
            "I have experience with JavaScript and Python. I'm really excited about this opportunity!",
          message_type: "text",
          flagged_by_ai: false,
          blocked_by_ai: false,
          created_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // 22 hours ago
        },
      ];

      return res.json({
        messages: mockMessages,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: mockMessages.length,
          hasMore: false,
        },
        aiProtection: {
          enabled: true,
          blockedMessages: 0,
          lastScan: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ Error loading messages:", error);
      return res.status(500).json({ error: "Failed to load messages" });
    }
  },
);

// Get user's conversations
router.get(
  "/conversations",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.userId;

      console.log(`📋 Loading conversations for user ${userId}`);

      // In production, would query database
      const mockConversations = [
        {
          id: "1",
          candidate_id: userId,
          company_id: "company-1002",
          job_id: 1,
          subject: "Software Developer Apprenticeship Application",
          last_message_at: new Date().toISOString(),
          unread_count: 2,
          archived: false,
          blocked: false,
          ai_monitoring_active: true,
          flagged_for_review: false,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          candidate_id: userId,
          company_id: "company-1004",
          job_id: 2,
          subject: "Marketing Apprenticeship Inquiry",
          last_message_at: new Date(
            Date.now() - 48 * 60 * 60 * 1000,
          ).toISOString(),
          unread_count: 0,
          archived: false,
          blocked: false,
          ai_monitoring_active: true,
          flagged_for_review: false,
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        },
      ];

      return res.json({
        conversations: mockConversations,
        aiProtection: {
          enabled: true,
          totalBlocked: 5,
          activeMonitoring: true,
          lastUpdate: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ Error loading conversations:", error);
      return res.status(500).json({ error: "Failed to load conversations" });
    }
  },
);

// Test AI moderation endpoint (development only)
router.post(
  "/test/ai-moderation",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { message } = req.body;

      if (!message) {
        return res
          .status(400)
          .json({ error: "Message content required for testing" });
      }

      console.log(`🧪 Testing AI moderation on message: "${message}"`);

      const result = await aiModerationService.analyzeMessage(
        message,
        req.user!.userId,
        "999",
      );

      return res.json({
        message: message,
        analysis: result,
        wouldBlock: result.shouldBlock,
        confidence: result.confidence,
        flags: result.flags,
        testResult: result.shouldBlock ? "BLOCKED" : "ALLOWED",
      });
    } catch (error) {
      console.error("❌ Error testing AI moderation:", error);
      return res.status(500).json({ error: "Failed to test AI moderation" });
    }
  },
);

export default router;
