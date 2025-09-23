import { neon_run_sql } from "../config/neon";

interface AIFlag {
  type: string;
  detected: string[];
  confidence: number;
  originalMatch: string;
}

interface AIAnalysisResult {
  flags: AIFlag[];
  confidence: number;
  shouldBlock: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
}

interface ConversationDetails {
  id: string;
  candidate_id: string;
  company_id: string;
  company_name: string;
  company_email: string;
  candidate_name: string;
  job_title?: string;
}

// Enhanced AI Moderation Service for Candidate Protection
export class AIModerationService {
  private contactPatterns = {
    ukPhoneNumbers: [
      /(\+44\s?7\d{3}[\s\-\.]?\d{3}[\s\-\.]?\d{3})/gi, // +44 7xxx xxx xxx
      /(\b07\d{3}[\s\-\.]?\d{3}[\s\-\.]?\d{3})/gi, // 07xxx xxx xxx
      /(\b\d{11}\b)/gi, // 11 digit numbers
      /(phone|mobile|number|call|text)[\s\:]+[\d\s\-\+\(\)]{8,}/gi,
    ],
    emails: [
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      /(email\s*[\:\-]\s*[^\s]+)/gi,
      /(contact\s*me\s*at\s*[^\s]+)/gi,
      /(send\s*cv\s*to\s*[^\s]+)/gi,
    ],
    externalPlatforms: [
      /(whatsapp|telegram|signal|discord|snapchat)/gi,
      /(instagram|facebook|linkedin|twitter)/gi,
      /(outside\s*of\s*this\s*platform)/gi,
      /(contact\s*me\s*directly)/gi,
      /(give\s*me\s*your\s*(number|email))/gi,
      /(send\s*me\s*your\s*(cv|resume))/gi,
    ],
    meetingRequests: [
      /(meet\s*in\s*person)/gi,
      /(come\s*to\s*our\s*office)/gi,
      /(informal\s*chat)/gi,
      /(coffee\s*meeting)/gi,
    ],
  };

  private baseConfidence = {
    ukPhoneNumbers: 0.95,
    emails: 0.9,
    externalPlatforms: 0.85,
    meetingRequests: 0.7,
  };

  // Main analysis function
  async analyzeMessage(
    content: string,
    senderId: string,
    conversationId: string,
  ): Promise<AIAnalysisResult> {
    const flags: AIFlag[] = [];
    let maxConfidence = 0;
    let shouldBlock = false;

    // Check all pattern categories
    for (const [category, patterns] of Object.entries(this.contactPatterns)) {
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          const confidence = this.calculateConfidence(category, matches.length);
          flags.push({
            type: category,
            detected: matches.map((m) => this.maskSensitiveInfo(m)),
            confidence,
            originalMatch: matches[0], // For admin review
          });
          maxConfidence = Math.max(maxConfidence, confidence);

          // Auto-block high confidence violations
          if (confidence >= 0.8) {
            shouldBlock = true;
          }
        }
      }
    }

    // Additional context analysis
    const contextFlags = await this.analyzeContext(content, senderId);
    flags.push(...contextFlags);

    return {
      flags,
      confidence: maxConfidence,
      shouldBlock,
      riskLevel: this.calculateRiskLevel(maxConfidence, flags.length),
    };
  }

  private calculateConfidence(category: string, matchCount: number): number {
    const baseConf = this.baseConfidence[category] || 0.5;
    return Math.min(baseConf + matchCount * 0.05, 1.0);
  }

  private maskSensitiveInfo(text: string): string {
    return text.replace(/\d/g, "*").replace(/[a-zA-Z]/g, "*");
  }

  private calculateRiskLevel(
    confidence: number,
    flagCount: number,
  ): "low" | "medium" | "high" | "critical" {
    if (confidence >= 0.9 || flagCount >= 3) return "critical";
    if (confidence >= 0.8 || flagCount >= 2) return "high";
    if (confidence >= 0.6 || flagCount >= 1) return "medium";
    return "low";
  }

  private async analyzeContext(
    content: string,
    senderId: string,
  ): Promise<AIFlag[]> {
    const flags: AIFlag[] = [];

    // Check for urgent language that might indicate contact sharing attempts
    const urgentPatterns = [
      /(urgent|asap|immediately)/gi,
      /(call\s*me\s*now)/gi,
      /(don't\s*use\s*this\s*platform)/gi,
    ];

    for (const pattern of urgentPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        flags.push({
          type: "urgentContext",
          detected: matches.map((m) => this.maskSensitiveInfo(m)),
          confidence: 0.6,
          originalMatch: matches[0],
        });
      }
    }

    return flags;
  }

  // Block message and trigger admin alerts
  async blockAndReport(
    messageId: string,
    conversationId: string,
    flags: AIFlag[],
    senderId: string,
  ): Promise<boolean> {
    try {
      // Get conversation details
      const conversationQuery = `
        SELECT 
          conv.id,
          conv.candidate_id,
          conv.company_id,
          c.company_name,
          cu.email as company_email,
          canu.name as candidate_name,
          j.title as job_title
        FROM conversations conv
        JOIN companies c ON conv.company_id = c.id
        JOIN users cu ON c.user_id = cu.id
        JOIN candidates can ON conv.candidate_id = can.id
        JOIN users canu ON can.user_id = canu.id
        LEFT JOIN jobs j ON conv.job_id = j.id
        WHERE conv.id = $1
      `;

      const conversationData = await neon_run_sql({
        sql: conversationQuery,
        projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
        params: [conversationId],
      });

      if (!conversationData || conversationData.length === 0) {
        console.error(
          "❌ Conversation not found for AI moderation:",
          conversationId,
        );
        return false;
      }

      const conversation = conversationData[0];

      // Block the conversation immediately
      await neon_run_sql({
        sql: `
          UPDATE conversations 
          SET blocked = true, 
              blocked_reason = 'AI detected contact information sharing attempt',
              blocked_at = CURRENT_TIMESTAMP,
              flagged_for_review = true
          WHERE id = $1
        `,
        projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
        params: [conversationId],
      });

      // Flag the message
      await neon_run_sql({
        sql: `
          UPDATE messages 
          SET flagged_by_ai = true,
              blocked_by_ai = true,
              ai_confidence_score = $2,
              contains_contact_info = true
          WHERE id = $1
        `,
        projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
        params: [messageId, Math.max(...flags.map((f) => f.confidence))],
      });

      // Create detailed AI moderation flags
      for (const flag of flags) {
        await neon_run_sql({
          sql: `
            INSERT INTO ai_moderation_flags 
            (message_id, conversation_id, flag_type, confidence_score, 
             detected_content, action_taken, company_id, candidate_id)
            VALUES ($1, $2, $3, $4, $5, 'blocked', $6, $7)
          `,
          projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
          params: [
            messageId,
            conversationId,
            flag.type,
            flag.confidence,
            JSON.stringify(flag.detected),
            conversation.company_id,
            conversation.candidate_id,
          ],
        });
      }

      // Create urgent admin alert
      await neon_run_sql({
        sql: `
          INSERT INTO moderation_queue 
          (type, priority, title, description, data, status)
          VALUES ('contact_sharing', 'urgent', $1, $2, $3, 'pending')
        `,
        projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
        params: [
          `🚨 URGENT: ${conversation.company_name} attempting contact bypass`,
          `Company "${conversation.company_name}" attempted to share contact information with candidate "${conversation.candidate_name}" for position "${conversation.job_title || "Unknown Position"}". Conversation blocked automatically. IMMEDIATE REVIEW REQUIRED.`,
          JSON.stringify({
            messageId,
            conversationId,
            companyId: conversation.company_id,
            candidateId: conversation.candidate_id,
            companyName: conversation.company_name,
            candidateName: conversation.candidate_name,
            jobTitle: conversation.job_title,
            flagTypes: flags.map((f) => f.type),
            confidence: Math.max(...flags.map((f) => f.confidence)),
            detectedContent: flags.map((f) => f.originalMatch),
            timestamp: new Date().toISOString(),
          }),
        ],
      });

      // Notify master admin immediately
      await this.notifyMasterAdmin(conversation, flags);

      // Suspend company account if high confidence
      if (Math.max(...flags.map((f) => f.confidence)) >= 0.9) {
        await this.suspendCompanyAccount(conversation.company_id, flags);
      }

      console.log(
        `🛡️ AI Protection: Blocked conversation ${conversationId} from company ${conversation.company_name}`,
      );
      return true;
    } catch (error) {
      console.error("❌ Error in blockAndReport:", error);
      return false;
    }
  }

  // Suspend company account
  private async suspendCompanyAccount(
    companyId: string,
    flags: AIFlag[],
  ): Promise<void> {
    try {
      await neon_run_sql({
        sql: `
          UPDATE users 
          SET subscription_status = 'suspended',
              updated_at = CURRENT_TIMESTAMP
          FROM companies c
          WHERE users.id = c.user_id AND c.id = $1
        `,
        projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
        params: [companyId],
      });

      // Log the suspension
      const masterAdminQuery = await neon_run_sql({
        sql: `SELECT id FROM users WHERE is_master_admin = true LIMIT 1`,
        projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
      });

      if (masterAdminQuery && masterAdminQuery.length > 0) {
        await neon_run_sql({
          sql: `
            INSERT INTO admin_logs 
            (admin_id, action, target_type, target_id, details)
            VALUES ($1, 'AUTO_SUSPEND_COMPANY', 'company', $2, $3)
          `,
          projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
          params: [
            masterAdminQuery[0].id,
            companyId,
            JSON.stringify({
              reason: "AI detected contact information sharing",
              flags: flags.map((f) => f.type),
              automatic: true,
              timestamp: new Date().toISOString(),
            }),
          ],
        });
      }

      console.log(`🚨 Company account suspended automatically: ${companyId}`);
    } catch (error) {
      console.error("❌ Error suspending company account:", error);
    }
  }

  // Send immediate notification to master admin
  private async notifyMasterAdmin(
    conversation: ConversationDetails,
    flags: AIFlag[],
  ): Promise<void> {
    try {
      const adminQuery = await neon_run_sql({
        sql: `SELECT id FROM users WHERE is_master_admin = true LIMIT 1`,
        projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
      });

      if (adminQuery && adminQuery.length > 0) {
        await neon_run_sql({
          sql: `
            INSERT INTO notifications 
            (user_id, title, message, type, action_url, data)
            VALUES ($1, $2, $3, 'system', $4, $5)
          `,
          projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
          params: [
            adminQuery[0].id,
            "🚨 CRITICAL: Contact Sharing Blocked",
            `Company "${conversation.company_name}" blocked for sharing contact info with "${conversation.candidate_name}". Account suspended pending review.`,
            `/admin/moderation/conversation/${conversation.id}`,
            JSON.stringify({
              companyId: conversation.company_id,
              conversationId: conversation.id,
              severity: "critical",
              autoSuspended: true,
              timestamp: new Date().toISOString(),
            }),
          ],
        });
      }

      console.log(
        `📬 Master admin notified of critical violation from ${conversation.company_name}`,
      );
    } catch (error) {
      console.error("❌ Error notifying master admin:", error);
    }
  }

  // Get AI moderation statistics
  async getStats(): Promise<any> {
    try {
      const flagsToday = await neon_run_sql({
        sql: `
          SELECT COUNT(*) as count 
          FROM ai_moderation_flags 
          WHERE created_at >= CURRENT_DATE
        `,
        projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
      });

      const pendingReviews = await neon_run_sql({
        sql: `
          SELECT COUNT(*) as count 
          FROM moderation_queue 
          WHERE status = 'pending'
        `,
        projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
      });

      const blockedConversations = await neon_run_sql({
        sql: `
          SELECT COUNT(*) as count 
          FROM conversations 
          WHERE blocked = true AND blocked_reason LIKE '%AI detected%'
        `,
        projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
      });

      return {
        flags_today: flagsToday?.[0]?.count || 0,
        pending_reviews: pendingReviews?.[0]?.count || 0,
        blocked_conversations: blockedConversations?.[0]?.count || 0,
        companies_flagged: 0, // Will be calculated based on unique companies in flags
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Error getting AI moderation stats:", error);
      return {
        flags_today: 0,
        pending_reviews: 0,
        blocked_conversations: 0,
        companies_flagged: 0,
        last_updated: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export const aiModerationService = new AIModerationService();
export default aiModerationService;
