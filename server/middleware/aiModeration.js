const { neonQuery } = require("../config/database");

const aiModerationService = {
  // Enhanced detection patterns for UK market
  contactPatterns: {
    ukPhoneNumbers: [
      /(\+44\s?7\d{3}[\s\-\.]?\d{3}[\s\-\.]?\d{3})/gi, // +44 7xxx xxx xxx
      /(\b07\d{3}[\s\-\.]?\d{3}[\s\-\.]?\d{3})/gi, // 07xxx xxx xxx
      /(\b\d{11}\b)/gi, // 11 digit numbers
      /(phone|mobile|number|call|text)[\s\:]+[\d\s\-\+\(\)]{8,}/gi,
      /(call\s*me\s*on)/gi,
    ],
    emails: [
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      /(email\s*[\:\-]\s*[^\s]+)/gi,
      /(contact\s*me\s*at\s*[^\s]+)/gi,
      /(send\s*cv\s*to\s*[^\s]+)/gi,
      /(my\s*email\s*is)/gi,
    ],
    externalPlatforms: [
      /(whatsapp|telegram|signal|discord|snapchat)/gi,
      /(instagram|facebook|linkedin|twitter)/gi,
      /(outside\s*of\s*this\s*platform)/gi,
      /(contact\s*me\s*directly)/gi,
      /(give\s*me\s*your\s*(number|email))/gi,
      /(add\s*me\s*on)/gi,
    ],
    meetingRequests: [
      /(meet\s*in\s*person)/gi,
      /(come\s*to\s*our\s*office)/gi,
      /(informal\s*chat)/gi,
      /(coffee\s*meeting)/gi,
      /(face\s*to\s*face)/gi,
    ],
    urgentContext: [
      /(urgent|asap|immediately)/gi,
      /(call\s*me\s*now)/gi,
      /(don't\s*use\s*this\s*platform)/gi,
      /(bypass\s*the\s*system)/gi,
    ],
  },

  // Calculate confidence score based on detection type
  calculateConfidence: (category, matchCount) => {
    const baseConfidence = {
      ukPhoneNumbers: 0.95,
      emails: 0.9,
      externalPlatforms: 0.85,
      meetingRequests: 0.75,
      urgentContext: 0.65,
    };
    return Math.min(baseConfidence[category] + matchCount * 0.05, 1.0);
  },

  // Mask sensitive information for logging
  maskSensitiveInfo: (text) => {
    return text.replace(/\d/g, "*").replace(/[a-zA-Z]/g, "*");
  },

  // Main analysis function
  analyzeMessage: async (content, senderId, conversationId) => {
    const flags = [];
    let maxConfidence = 0;
    let shouldBlock = false;

    console.log(`🛡️ AI Protection: Analyzing message from user ${senderId}`);

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

    const result = {
      flags,
      confidence: maxConfidence,
      shouldBlock,
      riskLevel: this.calculateRiskLevel(maxConfidence, flags.length),
    };

    console.log(
      `🛡️ AI Analysis: Confidence ${maxConfidence.toFixed(2)}, Block: ${shouldBlock}, Flags: ${flags.length}`,
    );

    return result;
  },

  calculateRiskLevel: (confidence, flagCount) => {
    if (confidence >= 0.9 || flagCount >= 3) return "critical";
    if (confidence >= 0.8 || flagCount >= 2) return "high";
    if (confidence >= 0.6 || flagCount >= 1) return "medium";
    return "low";
  },

  // Block message and trigger admin alerts
  blockAndReport: async (messageId, conversationId, flags, senderId) => {
    try {
      console.log(
        `🚨 AI Protection: Blocking conversation ${conversationId} for contact sharing`,
      );

      // Get conversation details for notification
      const conversationData = await neonQuery(
        `
        SELECT 
          conv.id,
          conv.candidate_id,
          conv.company_id,
          c.company_name,
          cu.email as company_email,
          canu.name as candidate_name,
          j.title as job_title
        FROM conversations conv
        LEFT JOIN companies c ON conv.company_id = c.id
        LEFT JOIN users cu ON c.user_id = cu.id
        LEFT JOIN candidates can ON conv.candidate_id = can.id
        LEFT JOIN users canu ON can.user_id = canu.id
        LEFT JOIN jobs j ON conv.job_id = j.id
        WHERE conv.id = $1
      `,
        [conversationId],
      );

      const conversation = conversationData[0] || {};

      // Block the conversation immediately
      await neonQuery(
        `
        UPDATE conversations 
        SET blocked = true, 
            blocked_reason = 'AI detected contact information sharing attempt',
            blocked_at = CURRENT_TIMESTAMP,
            flagged_for_review = true
        WHERE id = $1
      `,
        [conversationId],
      );

      // Flag the message
      await neonQuery(
        `
        UPDATE messages 
        SET flagged_by_ai = true,
            blocked_by_ai = true,
            ai_confidence_score = $2,
            contains_contact_info = true
        WHERE id = $1
      `,
        [messageId, Math.max(...flags.map((f) => f.confidence))],
      );

      // Create detailed AI moderation flags
      for (const flag of flags) {
        await neonQuery(
          `
          INSERT INTO ai_moderation_flags 
          (message_id, conversation_id, flag_type, confidence_score, 
           detected_content, action_taken, company_id, candidate_id, created_at)
          VALUES ($1, $2, $3, $4, $5, 'blocked', $6, $7, CURRENT_TIMESTAMP)
        `,
          [
            messageId,
            conversationId,
            flag.type,
            flag.confidence,
            JSON.stringify(flag.detected),
            conversation.company_id,
            conversation.candidate_id,
          ],
        );
      }

      // Create urgent admin alert
      await neonQuery(
        `
        INSERT INTO moderation_queue 
        (type, priority, title, description, data, status, created_at)
        VALUES ('contact_sharing', 'urgent', $1, $2, $3, 'pending', CURRENT_TIMESTAMP)
      `,
        [
          `���� URGENT: ${conversation.company_name || "Company"} attempting contact bypass`,
          `Company "${conversation.company_name || "Unknown"}" attempted to share contact information with candidate "${conversation.candidate_name || "Unknown"}" for position "${conversation.job_title || "Unknown Position"}". Conversation blocked automatically. IMMEDIATE REVIEW REQUIRED.`,
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
      );

      // Notify master admin immediately
      const adminQuery = await neonQuery(`
        SELECT id FROM users WHERE is_master_admin = true OR role = 'master_admin' LIMIT 1
      `);

      if (adminQuery.length > 0) {
        await neonQuery(
          `
          INSERT INTO notifications 
          (user_id, title, message, type, action_url, data, created_at)
          VALUES ($1, $2, $3, 'system', $4, $5, CURRENT_TIMESTAMP)
        `,
          [
            adminQuery[0].id,
            "🚨 CRITICAL: Contact Sharing Blocked",
            `Company "${conversation.company_name || "Unknown"}" blocked for sharing contact info with "${conversation.candidate_name || "candidate"}". Account suspended pending review.`,
            `/admin/moderation/conversation/${conversationId}`,
            JSON.stringify({
              companyId: conversation.company_id,
              conversationId: conversationId,
              severity: "critical",
              autoBlocked: true,
              timestamp: new Date().toISOString(),
            }),
          ],
        );
      }

      // Suspend company account if high confidence
      if (Math.max(...flags.map((f) => f.confidence)) >= 0.9) {
        await this.suspendCompanyAccount(conversation.company_id, flags);
      }

      console.log(
        `✅ AI Protection: Successfully blocked and reported violation`,
      );
      return true;
    } catch (error) {
      console.error("❌ Error in blockAndReport:", error);
      return false;
    }
  },

  // Suspend company account for severe violations
  suspendCompanyAccount: async (companyId, flags) => {
    if (!companyId) return;

    try {
      await neonQuery(
        `
        UPDATE users 
        SET subscription_status = 'suspended',
            updated_at = CURRENT_TIMESTAMP
        FROM companies c
        WHERE users.id = c.user_id AND c.id = $1
      `,
        [companyId],
      );

      // Log the suspension
      const adminQuery = await neonQuery(`
        SELECT id FROM users WHERE is_master_admin = true OR role = 'master_admin' LIMIT 1
      `);

      if (adminQuery.length > 0) {
        await neonQuery(
          `
          INSERT INTO admin_logs 
          (admin_id, action, target_type, target_id, details, created_at)
          VALUES ($1, 'AUTO_SUSPEND_COMPANY', 'company', $2, $3, CURRENT_TIMESTAMP)
        `,
          [
            adminQuery[0].id,
            companyId,
            JSON.stringify({
              reason: "AI detected contact information sharing",
              flags: flags.map((f) => f.type),
              automatic: true,
              timestamp: new Date().toISOString(),
            }),
          ],
        );
      }

      console.log(`🚨 Company account automatically suspended: ${companyId}`);
    } catch (error) {
      console.error("❌ Error suspending company account:", error);
    }
  },
};

module.exports = aiModerationService;
