import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../index";
import { Message, Conversation } from "../models/Message";
import { v4 as uuidv4 } from "uuid";

export interface AuthenticatedSocket extends Socket {
  userId: string;
  role: "student" | "company";
}

// Mock data for development
let mockConversations: any[] = [
  {
    _id: "conv_1",
    participants: ["student1", "company1"],
    lastMessage: "Thank you for considering my application.",
    lastMessageAt: new Date(),
    isActive: true,
    metadata: {
      applicationId: "app_1",
      jobTitle: "Software Developer Apprentice",
    },
  },
];

let mockMessages: any[] = [
  {
    _id: "msg_1",
    conversationId: "conv_1",
    senderId: "student1",
    receiverId: "company1",
    content: "Thank you for considering my application.",
    type: "text",
    createdAt: new Date(),
    readAt: null,
  },
];

export function initializeSocket(server: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Authentication middleware
  io.use((socket: any, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.userId = decoded.userId;
      socket.role = decoded.role;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} (${socket.role}) connected`);

    // Join user-specific room for notifications
    socket.join(`user_${socket.userId}`);

    // Join all user's conversation rooms
    const userConversations = mockConversations.filter((conv) =>
      conv.participants.includes(socket.userId),
    );

    userConversations.forEach((conv) => {
      socket.join(`conversation_${conv._id}`);
    });

    // Handle joining a conversation
    socket.on("join_conversation", ({ conversationId }) => {
      const conversation = mockConversations.find(
        (conv) => conv._id === conversationId,
      );

      if (conversation && conversation.participants.includes(socket.userId)) {
        socket.join(`conversation_${conversationId}`);
        socket.emit("joined_conversation", { conversationId });
      } else {
        socket.emit("error", {
          message: "Conversation not found or access denied",
        });
      }
    });

    // Handle leaving a conversation
    socket.on("leave_conversation", ({ conversationId }) => {
      socket.leave(`conversation_${conversationId}`);
      socket.emit("left_conversation", { conversationId });
    });

    // Handle sending a message
    socket.on("send_message", async (data) => {
      const { conversationId, content, type = "text" } = data;

      try {
        // Find conversation
        const conversation = mockConversations.find(
          (conv) => conv._id === conversationId,
        );

        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        // Check if user is participant
        if (!conversation.participants.includes(socket.userId)) {
          socket.emit("error", { message: "Access denied" });
          return;
        }

        // Get receiver ID
        const receiverId = conversation.participants.find(
          (id) => id !== socket.userId,
        );

        // Create message
        const message = {
          _id: "msg_" + uuidv4(),
          conversationId,
          senderId: socket.userId,
          receiverId,
          content,
          type,
          readAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Save message (in production, save to database)
        mockMessages.push(message);

        // Update conversation
        conversation.lastMessage = content;
        conversation.lastMessageAt = new Date();

        // Emit message to conversation room
        io.to(`conversation_${conversationId}`).emit("new_message", message);

        // Send notification to receiver if they're not in the conversation room
        const receiverSockets = Array.from(io.sockets.sockets.values()).filter(
          (s: any) => s.userId === receiverId,
        );

        const receiverInConversation = receiverSockets.some((s: any) =>
          s.rooms.has(`conversation_${conversationId}`),
        );

        if (!receiverInConversation) {
          io.to(`user_${receiverId}`).emit("message_notification", {
            conversationId,
            message,
            senderInfo: {
              userId: socket.userId,
              role: socket.role,
            },
          });
        }

        // Acknowledge message sent
        socket.emit("message_sent", { messageId: message._id });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle message read receipts
    socket.on("mark_messages_read", ({ conversationId, messageIds }) => {
      try {
        // Update read status for messages
        messageIds.forEach((messageId: string) => {
          const message = mockMessages.find((msg) => msg._id === messageId);
          if (
            message &&
            message.receiverId === socket.userId &&
            !message.readAt
          ) {
            message.readAt = new Date();

            // Notify sender that message was read
            io.to(`user_${message.senderId}`).emit("message_read", {
              messageId,
              readAt: message.readAt,
              conversationId,
            });
          }
        });

        socket.emit("messages_marked_read", { conversationId, messageIds });
      } catch (error) {
        console.error("Error marking messages as read:", error);
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });

    // Handle typing indicators
    socket.on("typing_start", ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit("user_typing", {
        userId: socket.userId,
        conversationId,
      });
    });

    socket.on("typing_stop", ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit("user_stopped_typing", {
        userId: socket.userId,
        conversationId,
      });
    });

    // Handle getting conversation messages
    socket.on("get_messages", ({ conversationId, page = 1, limit = 50 }) => {
      try {
        const conversation = mockConversations.find(
          (conv) => conv._id === conversationId,
        );

        if (
          !conversation ||
          !conversation.participants.includes(socket.userId)
        ) {
          socket.emit("error", {
            message: "Conversation not found or access denied",
          });
          return;
        }

        // Get messages for this conversation
        const conversationMessages = mockMessages
          .filter((msg) => msg.conversationId === conversationId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice((page - 1) * limit, page * limit);

        socket.emit("messages_loaded", {
          conversationId,
          messages: conversationMessages.reverse(), // Reverse to show oldest first
          pagination: {
            currentPage: page,
            hasMore:
              mockMessages.filter(
                (msg) => msg.conversationId === conversationId,
              ).length >
              page * limit,
          },
        });
      } catch (error) {
        console.error("Error getting messages:", error);
        socket.emit("error", { message: "Failed to load messages" });
      }
    });

    // Handle creating a new conversation
    socket.on("create_conversation", ({ participantId, metadata }) => {
      try {
        // Check if conversation already exists
        const existingConversation = mockConversations.find(
          (conv) =>
            conv.participants.includes(socket.userId) &&
            conv.participants.includes(participantId),
        );

        if (existingConversation) {
          socket.emit("conversation_exists", {
            conversation: existingConversation,
          });
          return;
        }

        // Create new conversation
        const conversation = {
          _id: "conv_" + uuidv4(),
          participants: [socket.userId, participantId],
          lastMessage: null,
          lastMessageAt: null,
          isActive: true,
          metadata: metadata || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockConversations.push(conversation);

        // Join both users to the conversation room
        socket.join(`conversation_${conversation._id}`);
        io.to(`user_${participantId}`).emit("new_conversation", {
          conversation,
        });

        socket.emit("conversation_created", { conversation });
      } catch (error) {
        console.error("Error creating conversation:", error);
        socket.emit("error", { message: "Failed to create conversation" });
      }
    });

    // Handle getting user's conversations
    socket.on("get_conversations", () => {
      try {
        const userConversations = mockConversations
          .filter((conv) => conv.participants.includes(socket.userId))
          .sort((a, b) => {
            if (!a.lastMessageAt) return 1;
            if (!b.lastMessageAt) return -1;
            return (
              new Date(b.lastMessageAt).getTime() -
              new Date(a.lastMessageAt).getTime()
            );
          });

        socket.emit("conversations_loaded", {
          conversations: userConversations,
        });
      } catch (error) {
        console.error("Error getting conversations:", error);
        socket.emit("error", { message: "Failed to load conversations" });
      }
    });

    // Handle user status updates
    socket.on("update_status", ({ status }) => {
      // Broadcast status update to all user's conversations
      const userConversations = mockConversations.filter((conv) =>
        conv.participants.includes(socket.userId),
      );

      userConversations.forEach((conv) => {
        socket.to(`conversation_${conv._id}`).emit("user_status_changed", {
          userId: socket.userId,
          status,
          timestamp: new Date(),
        });
      });
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log(`User ${socket.userId} disconnected: ${reason}`);

      // Broadcast offline status to all user's conversations
      const userConversations = mockConversations.filter((conv) =>
        conv.participants.includes(socket.userId),
      );

      userConversations.forEach((conv) => {
        socket.to(`conversation_${conv._id}`).emit("user_status_changed", {
          userId: socket.userId,
          status: "offline",
          timestamp: new Date(),
        });
      });
    });
  });

  return io;
}

// Helper functions for HTTP routes to interact with Socket.IO
export function sendNotification(
  io: SocketIOServer,
  userId: string,
  notification: any,
) {
  io.to(`user_${userId}`).emit("notification", notification);
}

export function sendSystemMessage(
  io: SocketIOServer,
  conversationId: string,
  content: string,
) {
  const message = {
    _id: "msg_" + uuidv4(),
    conversationId,
    senderId: "system",
    receiverId: "all",
    content,
    type: "system",
    createdAt: new Date(),
    readAt: new Date(),
  };

  mockMessages.push(message);
  io.to(`conversation_${conversationId}`).emit("new_message", message);
}
