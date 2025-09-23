import express, { Response } from "express";
import { body, query, validationResult } from "express-validator";
import { AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler, CustomError } from "../middleware/errorHandler";
const aiModeration = require("../middleware/aiModeration");

const router = express.Router();

// Types for mock data and responses
type Conversation = {
  _id: string;
  participants: string[];
  applicationId?: string;
  lastMessage?: { content: string; sentAt: Date; senderId: string };
  unreadCount: Record<string, number>;
  isActive: boolean;
  createdAt: Date;
  blocked?: boolean;
  blockedReason?: string;
  blockedAt?: Date;
  flaggedForReview?: boolean;
};

type Message = {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  messageType: "text" | "file" | "image" | "blocked";
  content: string;
  isRead: boolean;
  sentAt: Date;
  fileUrl?: string;
  fileName?: string;
  flaggedByAI?: boolean;
  aiConfidenceScore?: number;
  containsContactInfo?: boolean;
  blockedByAI?: boolean;
  originalContent?: string;
};

// Mock conversations and messages
const mockConversations: Conversation[] = [
  {
    _id: "conv_1",
    participants: ["student1", "company1"],
    applicationId: "app_1",
    lastMessage: {
      content:
        "Thank you for your application. We'd like to schedule an interview.",
      sentAt: new Date("2024-01-16T10:30:00Z"),
      senderId: "company1",
    },
    unreadCount: { student1: 1, company1: 0 },
    isActive: true,
    createdAt: new Date("2024-01-15T12:00:00Z"),
  },
];

const mockMessages: Message[] = [
  {
    _id: "msg_1",
    conversationId: "conv_1",
    senderId: "student1",
    receiverId: "company1",
    messageType: "text",
    content: "Hello, I'm very interested in this apprenticeship opportunity.",
    isRead: true,
    sentAt: new Date("2024-01-15T12:00:00Z"),
  },
  {
    _id: "msg_2",
    conversationId: "conv_1",
    senderId: "company1",
    receiverId: "student1",
    messageType: "text",
    content:
      "Thank you for your application. We'd like to schedule an interview.",
    isRead: false,
    sentAt: new Date("2024-01-16T10:30:00Z"),
  },
];

// Get user's conversations
router.get(
  "/conversations",
  [
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
    query("offset").optional().isInt({ min: 0 }).toInt(),
  ],
  asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const userId = req.user!.userId;
      const { limit = 20, offset = 0 } = req.query;

      const conversations = mockConversations
        .filter((conv) => conv.participants.includes(userId))
        .map((conv) => {
          const otherParticipantId = conv.participants.find(
            (p) => p !== userId,
          );
          const unreadCount = (conv.unreadCount as any)[userId] || 0;

          return {
            ...conv,
            otherParticipant: {
              id: otherParticipantId,
              name: otherParticipantId?.startsWith("student")
                ? "Sarah Johnson"
                : "TechCorp Ltd",
              role: otherParticipantId?.startsWith("student")
                ? "student"
                : "company",
            },
            unreadCount,
            formattedLastMessage: conv.lastMessage
              ? {
                  ...conv.lastMessage,
                  timeAgo: getTimeAgo(conv.lastMessage.sentAt),
                }
              : null,
          };
        })
        .sort((a, b) => {
          const aTime = a.lastMessage?.sentAt.getTime() || 0;
          const bTime = b.lastMessage?.sentAt.getTime() || 0;
          return bTime - aTime;
        });

      const total = conversations.length;
      const paginatedResults = conversations.slice(
        Number(offset),
        Number(offset) + Number(limit),
      );

      res.json({
        conversations: paginatedResults,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total,
        },
        totalUnread: conversations.reduce(
          (sum, conv) => sum + conv.unreadCount,
          0,
        ),
      });
    },
  ),
);

// Get messages in a conversation
router.get(
  "/conversations/:conversationId/messages",
  [
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("before").optional().isISO8601().toDate(),
  ],
  asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { conversationId } = req.params;
      const { limit = 50, before } = req.query;
      const userId = req.user!.userId;

      // Check if user is participant in conversation
      const conversation = mockConversations.find(
        (conv) =>
          conv._id === conversationId && conv.participants.includes(userId),
      );

      if (!conversation) {
        throw new CustomError("Conversation not found or unauthorized", 404);
      }

      let messages = mockMessages.filter(
        (msg) => msg.conversationId === conversationId,
      );

      if (before) {
        messages = messages.filter(
          (msg) => msg.sentAt < new Date(before as string),
        );
      }

      // Sort by date (newest first)
      messages.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());

      const paginatedMessages = messages.slice(0, Number(limit));

      // Mark messages as read if current user is receiver
      const messagesToMarkRead = paginatedMessages
        .filter((msg) => msg.receiverId === userId && !msg.isRead)
        .map((msg) => msg._id);

      if (messagesToMarkRead.length > 0) {
        // In real app, update database
        console.log(`Marking ${messagesToMarkRead.length} messages as read`);
      }

      const enrichedMessages = paginatedMessages.map((msg) => ({
        ...msg,
        isOwn: msg.senderId === userId,
        formattedTime: msg.sentAt.toLocaleTimeString(),
        formattedDate: msg.sentAt.toLocaleDateString(),
      }));

      res.json({
        messages: enrichedMessages,
        conversation: {
          id: conversation._id,
          participants: conversation.participants,
          applicationId: conversation.applicationId,
        },
        hasMore: messages.length > Number(limit),
      });
    },
  ),
);

// Send a message
router.post(
  "/conversations/:conversationId/messages",
  [
    body("content").trim().isLength({ min: 1, max: 2000 }),
    body("messageType").optional().isIn(["text", "file", "image"]),
    body("fileUrl").optional().isURL(),
    body("fileName").optional().trim().isLength({ min: 1, max: 255 }),
  ],
  asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { conversationId } = req.params;
      const { content, messageType = "text", fileUrl, fileName } = req.body;
      const userId = req.user!.userId;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new CustomError("Validation failed", 400);
      }

      // Check if user is participant in conversation
      const conversation = mockConversations.find(
        (conv) =>
          conv._id === conversationId && conv.participants.includes(userId),
      );

      if (!conversation) {
        throw new CustomError("Conversation not found or unauthorized", 404);
      }

      // Check if conversation is already blocked
      const isBlocked = conversation.blocked;
      if (isBlocked) {
        res.status(403).json({
          error: "This conversation has been blocked by our protection system",
          reason:
            "Contact information sharing is prohibited to protect candidates",
          blocked: true,
          supportContact: "admin@apprenticeapex.com",
        });
      }

      // AI analysis of message content for candidate protection
      console.log(
        "🛡️ AI Protection: Analyzing message for contact information...",
      );
      const aiAnalysis = await aiModeration.analyzeMessage(
        content,
        userId,
        conversationId,
      );

      if (aiAnalysis.shouldBlock) {
        console.log(
          `🚨 AI Protection: Message blocked with confidence ${aiAnalysis.confidence}`,
        );

        // Create blocked message record
        const blockedMessageId = `msg_${Date.now()}_blocked`;

        // Block conversation and alert admin
        await aiModeration.blockAndReport(
          blockedMessageId,
          conversationId,
          aiAnalysis.flags,
          userId,
        );

        // Mark conversation as blocked in mock data
        const conversationIndex = mockConversations.findIndex(
          (conv) => conv._id === conversationId,
        );
        if (conversationIndex !== -1) {
          mockConversations[conversationIndex].blocked = true;
          mockConversations[conversationIndex].blockedReason =
            "AI detected contact information sharing attempt";
          mockConversations[conversationIndex].blockedAt = new Date();
          mockConversations[conversationIndex].flaggedForReview = true;
        }

        res.status(403).json({
          error: "Message blocked: Contact information sharing detected",
          message: `Our AI protection system detected an attempt to share contact information. This is prohibited to protect our candidates. Your account may be suspended.`,
          blocked: true,
          confidence: aiAnalysis.confidence,
          riskLevel: aiAnalysis.riskLevel,
          adminNotified: true,
          supportContact: "admin@apprenticeapex.com",
        });
      }

      const receiverId = conversation.participants.find((p) => p !== userId)!;

      // If message passes AI check, create normally
      const newMessage = {
        _id: `msg_${Date.now()}`,
        conversationId,
        senderId: userId,
        receiverId,
        messageType,
        content,
        fileUrl,
        fileName,
        flaggedByAI: false,
        aiConfidenceScore: aiAnalysis.confidence,
        isRead: false,
        sentAt: new Date(),
      };

      console.log(
        `✅ AI Protection: Message approved with safety score ${(1 - aiAnalysis.confidence).toFixed(2)}`,
      );

      mockMessages.push(newMessage);

      // Update conversation last message
      const conversationIndex = mockConversations.findIndex(
        (conv) => conv._id === conversationId,
      );
      if (conversationIndex !== -1) {
        mockConversations[conversationIndex].lastMessage = {
          content,
          sentAt: newMessage.sentAt,
          senderId: userId,
        };

        // Increment unread count for receiver
        const unreadCount = mockConversations[conversationIndex]
          .unreadCount as any;
        unreadCount[receiverId] = (unreadCount[receiverId] || 0) + 1;
      }

      // In real app:
      // 1. Save to database
      // 2. Send via Sendbird
      // 3. Send push notification
      // 4. Update conversation timestamp

      res.status(201).json({
        message: "Message sent successfully",
        messageData: {
          ...newMessage,
          isOwn: true,
          formattedTime: newMessage.sentAt.toLocaleTimeString(),
        },
        aiProtected: true,
        safetyScore: Number((1 - aiAnalysis.confidence).toFixed(2)),
        status: "delivered",
      });
    },
  ),
);

// Create conversation (when student applies)
router.post(
  "/conversations",
  [
    body("participantId").isString().isLength({ min: 1 }),
    body("applicationId").optional().isString(),
    body("initialMessage").optional().trim().isLength({ min: 1, max: 2000 }),
  ],
  asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { participantId, applicationId, initialMessage } = req.body;
      const userId = req.user!.userId;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new CustomError("Validation failed", 400);
      }

      // Check if conversation already exists
      const existingConversation = mockConversations.find(
        (conv) =>
          conv.participants.includes(userId) &&
          conv.participants.includes(participantId),
      );

      if (existingConversation) {
        res.json({
          message: "Conversation already exists",
          conversation: existingConversation,
        });
      }

      // Create new conversation
      const newConversation: Conversation = {
        _id: `conv_${Date.now()}`,
        participants: [userId, participantId].sort(),
        applicationId,
        lastMessage: undefined,
        unreadCount: {} as Record<string, number>,
        isActive: true,
        createdAt: new Date(),
      };

      // Initialize unread counts
      (newConversation.unreadCount as any)[userId] = 0;
      (newConversation.unreadCount as any)[participantId] = 0;

      (mockConversations as any[]).push(newConversation);

      // Send initial message if provided
      if (initialMessage) {
        const newMessage = {
          _id: `msg_${Date.now()}`,
          conversationId: newConversation._id,
          senderId: userId,
          receiverId: participantId,
          messageType: "text" as const,
          content: initialMessage,
          isRead: false,
          sentAt: new Date(),
        };

        mockMessages.push(newMessage);

        newConversation.lastMessage = {
          content: initialMessage,
          sentAt: newMessage.sentAt,
          senderId: userId,
        };

        (newConversation.unreadCount as any)[participantId] = 1;
      }

      res.status(201).json({
        message: "Conversation created successfully",
        conversation: newConversation,
      });
    },
  ),
);

// Mark conversation as read
router.patch(
  "/conversations/:conversationId/read",
  asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { conversationId } = req.params;
      const userId = req.user!.userId;

      const conversationIndex = mockConversations.findIndex(
        (conv) =>
          conv._id === conversationId && conv.participants.includes(userId),
      );

      if (conversationIndex === -1) {
        throw new CustomError("Conversation not found or unauthorized", 404);
      }

      // Reset unread count for current user
      (mockConversations[conversationIndex].unreadCount as any)[userId] = 0;

      // Mark all unread messages as read
      mockMessages
        .filter(
          (msg) =>
            msg.conversationId === conversationId &&
            msg.receiverId === userId &&
            !msg.isRead,
        )
        .forEach((msg) => {
          msg.isRead = true;
          (msg as any).readAt = new Date();
        });

      res.json({
        message: "Conversation marked as read",
      });
    },
  ),
);

// Helper function to get time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return diffInMinutes > 0 ? `${diffInMinutes}m ago` : "Just now";
  }
}

export default router;
