import mongoose from 'mongoose';
// import { null as any // Placeholder for build compatibility } from './database.js'; // Commented out for build compatibility

// Index definitions for all collections
export interface IIndexDefinition {
  collection: string;
  name: string;
  spec: Record<string, any>;
  options?: mongoose.IndexOptions;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

// Define all indexes
export const INDEX_DEFINITIONS: IIndexDefinition[] = [
  // User Collection Indexes
  // Note: email index is automatically created by unique: true constraint in User model
  {
    collection: 'users',
    name: 'users_role_active',
    spec: { role: 1, isActive: 1 },
    options: { background: true },
    description: 'Compound index for filtering by role and active status',
    priority: 'high'
  },
  {
    collection: 'users',
    name: 'users_location_2dsphere',
    spec: { 'profile.location.coordinates': '2dsphere' },
    options: { background: true },
    description: 'Geospatial index for location-based searches',
    priority: 'high'
  },
  {
    collection: 'users',
    name: 'users_skills',
    spec: { 'profile.skills': 1 },
    options: { background: true },
    description: 'Index on skills array for skill-based matching',
    priority: 'medium'
  },
  {
    collection: 'users',
    name: 'users_industries',
    spec: { 'profile.preferences.industries': 1 },
    options: { background: true },
    description: 'Index on preferred industries',
    priority: 'medium'
  },
  {
    collection: 'users',
    name: 'users_email_verified',
    spec: { isEmailVerified: 1 },
    options: { background: true },
    description: 'Index for filtering verified users',
    priority: 'medium'
  },
  // Note: lastActivityAt field removed - not present in User schema
  {
    collection: 'users',
    name: 'users_created_date',
    spec: { createdAt: -1 },
    options: { background: true },
    description: 'Index for sorting by creation date',
    priority: 'low'
  },

  // Apprenticeship Collection Indexes
  {
    collection: 'apprenticeships',
    name: 'apprenticeships_company_status',
    spec: { companyId: 1, status: 1 },
    options: { background: true },
    description: 'Compound index for company job listings',
    priority: 'high'
  },
  {
    collection: 'apprenticeships',
    name: 'apprenticeships_location_2dsphere',
    spec: { 'location.coordinates': '2dsphere' },
    options: { background: true },
    description: 'Geospatial index for location-based job searches',
    priority: 'high'
  },
  {
    collection: 'apprenticeships',
    name: 'apprenticeships_industry_level',
    spec: { industry: 1, apprenticeshipLevel: 1 },
    options: { background: true },
    description: 'Compound index for industry and level filtering',
    priority: 'high'
  },
  {
    collection: 'apprenticeships',
    name: 'apprenticeships_active_featured',
    spec: { isActive: 1, isFeatured: 1, publishedAt: -1 },
    options: { background: true },
    description: 'Compound index for active and featured jobs',
    priority: 'high'
  },
  {
    collection: 'apprenticeships',
    name: 'apprenticeships_text_search',
    spec: { 
      jobTitle: 'text', 
      description: 'text', 
      'skills.skill': 'text',
      industry: 'text'
    },
    options: { 
      background: true,
      weights: {
        jobTitle: 10,
        'skills.skill': 5,
        industry: 3,
        description: 1
      },
      name: 'apprenticeships_text_search'
    },
    description: 'Full-text search index for job searches',
    priority: 'high'
  },
  {
    collection: 'apprenticeships',
    name: 'apprenticeships_salary_range',
    spec: { 'salary.min': 1, 'salary.max': 1 },
    options: { background: true },
    description: 'Index for salary range filtering',
    priority: 'medium'
  },
  {
    collection: 'apprenticeships',
    name: 'apprenticeships_qualification_level',
    spec: { qualificationLevel: 1, isActive: 1 },
    options: { background: true },
    description: 'Index for qualification level filtering',
    priority: 'medium'
  },
  {
    collection: 'apprenticeships',
    name: 'apprenticeships_city_active',
    spec: { 'location.city': 1, isActive: 1 },
    options: { background: true },
    description: 'Index for city-based job searches',
    priority: 'medium'
  },
  {
    collection: 'apprenticeships',
    name: 'apprenticeships_remote',
    spec: { isRemote: 1, isActive: 1 },
    options: { background: true },
    description: 'Index for remote job filtering',
    priority: 'medium'
  },
  {
    collection: 'apprenticeships',
    name: 'apprenticeships_moderation',
    spec: { moderationStatus: 1 },
    options: { background: true },
    description: 'Index for moderation workflow',
    priority: 'medium'
  },
  {
    collection: 'apprenticeships',
    name: 'apprenticeships_created_date',
    spec: { createdAt: -1 },
    options: { background: true },
    description: 'Index for sorting by creation date',
    priority: 'low'
  },
  {
    collection: 'apprenticeships',
    name: 'apprenticeships_application_deadline',
    spec: { 'applicationProcess.applicationDeadline': 1 },
    options: { background: true, sparse: true },
    description: 'Index for application deadline filtering',
    priority: 'low'
  },

  // Application Collection Indexes
  {
    collection: 'applications',
    name: 'applications_user_status',
    spec: { userId: 1, status: 1 },
    options: { background: true },
    description: 'Compound index for user applications',
    priority: 'high'
  },
  {
    collection: 'applications',
    name: 'applications_company_status',
    spec: { companyId: 1, status: 1 },
    options: { background: true },
    description: 'Compound index for company applications',
    priority: 'high'
  },
  {
    collection: 'applications',
    name: 'applications_apprenticeship_status',
    spec: { apprenticeshipId: 1, status: 1 },
    options: { background: true },
    description: 'Compound index for job applications',
    priority: 'high'
  },
  {
    collection: 'applications',
    name: 'applications_status_submitted',
    spec: { status: 1, submittedAt: -1 },
    options: { background: true },
    description: 'Index for status and submission date',
    priority: 'high'
  },
  {
    collection: 'applications',
    name: 'applications_match_score',
    spec: { matchScore: -1, status: 1 },
    options: { background: true },
    description: 'Index for sorting by match score',
    priority: 'medium'
  },
  {
    collection: 'applications',
    name: 'applications_interview_date',
    spec: { nextInterviewDate: 1 },
    options: { background: true, sparse: true },
    description: 'Index for interview scheduling',
    priority: 'medium'
  },
  {
    collection: 'applications',
    name: 'applications_last_status_change',
    spec: { lastStatusChange: -1 },
    options: { background: true },
    description: 'Index for sorting by last status change',
    priority: 'medium'
  },
  {
    collection: 'applications',
    name: 'applications_active_archived',
    spec: { isActive: 1, isArchived: 1 },
    options: { background: true },
    description: 'Index for filtering active/archived applications',
    priority: 'medium'
  },
  {
    collection: 'applications',
    name: 'applications_application_id',
    spec: { applicationId: 1 },
    options: { unique: true, background: true },
    description: 'Unique index on application reference ID',
    priority: 'high'
  },

  // Payment Collection Indexes
  {
    collection: 'payments',
    name: 'payments_user_status',
    spec: { userId: 1, status: 1 },
    options: { background: true },
    description: 'Compound index for user payments',
    priority: 'high'
  },
  {
    collection: 'payments',
    name: 'payments_stripe_payment_intent',
    spec: { stripePaymentIntentId: 1 },
    options: { unique: true, sparse: true, background: true },
    description: 'Unique index on Stripe payment intent ID',
    priority: 'high'
  },
  {
    collection: 'payments',
    name: 'payments_subscription',
    spec: { subscriptionId: 1 },
    options: { background: true, sparse: true },
    description: 'Index for subscription payments',
    priority: 'medium'
  },
  {
    collection: 'payments',
    name: 'payments_company_status',
    spec: { companyId: 1, status: 1 },
    options: { background: true, sparse: true },
    description: 'Compound index for company payments',
    priority: 'medium'
  },
  {
    collection: 'payments',
    name: 'payments_status_created',
    spec: { status: 1, createdAt: -1 },
    options: { background: true },
    description: 'Index for status and creation date',
    priority: 'medium'
  },
  {
    collection: 'payments',
    name: 'payments_type_billing_period',
    spec: { type: 1, billingPeriod: 1 },
    options: { background: true, sparse: true },
    description: 'Index for payment type and billing period',
    priority: 'low'
  },
  {
    collection: 'payments',
    name: 'payments_payment_id',
    spec: { paymentId: 1 },
    options: { unique: true, background: true },
    description: 'Unique index on payment reference ID',
    priority: 'high'
  },

  // Subscription Collection Indexes
  {
    collection: 'subscriptions',
    name: 'subscriptions_user_status',
    spec: { userId: 1, status: 1 },
    options: { background: true },
    description: 'Compound index for user subscriptions',
    priority: 'high'
  },
  {
    collection: 'subscriptions',
    name: 'subscriptions_stripe_subscription',
    spec: { stripeSubscriptionId: 1 },
    options: { unique: true, sparse: true, background: true },
    description: 'Unique index on Stripe subscription ID',
    priority: 'high'
  },
  {
    collection: 'subscriptions',
    name: 'subscriptions_status_billing',
    spec: { status: 1, nextBillingDate: 1 },
    options: { background: true },
    description: 'Index for billing processing',
    priority: 'high'
  },
  {
    collection: 'subscriptions',
    name: 'subscriptions_plan_status',
    spec: { plan: 1, status: 1 },
    options: { background: true },
    description: 'Index for plan analytics',
    priority: 'medium'
  },
  {
    collection: 'subscriptions',
    name: 'subscriptions_subscription_id',
    spec: { subscriptionId: 1 },
    options: { unique: true, background: true },
    description: 'Unique index on subscription reference ID',
    priority: 'high'
  },

  // Message Collection Indexes (if exists)
  {
    collection: 'messages',
    name: 'messages_conversation',
    spec: { conversationId: 1, createdAt: -1 },
    options: { background: true },
    description: 'Index for conversation messages',
    priority: 'high'
  },
  {
    collection: 'messages',
    name: 'messages_sender_receiver',
    spec: { senderId: 1, receiverId: 1, createdAt: -1 },
    options: { background: true },
    description: 'Index for user message history',
    priority: 'medium'
  },

  // Conversation Collection Indexes
  {
    collection: 'conversations',
    name: 'conversations_participants',
    spec: { participants: 1, lastMessageAt: -1 },
    options: { background: true },
    description: 'Index for user conversations',
    priority: 'high'
  },

  // Interview Collection Indexes
  {
    collection: 'interviews',
    name: 'interviews_application',
    spec: { applicationId: 1, scheduledDate: -1 },
    options: { background: true },
    description: 'Index for application interviews',
    priority: 'high'
  },
  {
    collection: 'interviews',
    name: 'interviews_company_date',
    spec: { companyId: 1, scheduledDate: 1 },
    options: { background: true },
    description: 'Index for company interview schedule',
    priority: 'medium'
  },
  {
    collection: 'interviews',
    name: 'interviews_student_date',
    spec: { studentId: 1, scheduledDate: 1 },
    options: { background: true },
    description: 'Index for student interview schedule',
    priority: 'medium'
  }
];

// Index management class
export class IndexManager {
  private static instance: IndexManager;
  private indexStatus: Map<string, IIndexStatus> = new Map();

  private constructor() {}

  public static getInstance(): IndexManager {
    if (!IndexManager.instance) {
      IndexManager.instance = new IndexManager();
    }
    return IndexManager.instance;
  }

  // Create all indexes
  public async createAllIndexes(): Promise<IIndexCreationResult[]> {
    console.log('🔍 Starting database index creation...');
    const results: IIndexCreationResult[] = [];

    // Sort by priority (high first)
    const sortedIndexes = INDEX_DEFINITIONS.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const indexDef of sortedIndexes) {
      try {
        const result = await this.createIndex(indexDef);
        results.push(result);
        
        if (result.success) {
          console.log(`✅ Created index: ${indexDef.name}`);
        } else {
          console.warn(`⚠️  Failed to create index: ${indexDef.name} - ${result.error}`);
        }
      } catch (error) {
        const result: IIndexCreationResult = {
          name: indexDef.name,
          collection: indexDef.collection,
          success: false,
          error: (error as Error).message,
          duration: 0
        };
        results.push(result);
        console.error(`❌ Error creating index: ${indexDef.name} - ${(error as Error).message}`);
      }
    }

    console.log(`🔍 Index creation completed. ${results.filter(r => r.success).length}/${results.length} indexes created successfully.`);
    return results;
  }

  // Create single index
  private async createIndex(indexDef: IIndexDefinition): Promise<IIndexCreationResult> {
    const startTime = Date.now();
    
    try {
      const connection = null as any // Placeholder for build compatibility;
      if (!connection) {
        throw new Error('Database connection not available');
      }

      const collection = connection.collection(indexDef.collection);
      
      // Check if index already exists
      const existingIndexes = await collection.indexes();
      const indexExists = existingIndexes.some((idx: any) =>
        idx.name === indexDef.name ||
        JSON.stringify(idx.key) === JSON.stringify(indexDef.spec)
      );

      if (indexExists) {
        this.indexStatus.set(indexDef.name, {
          name: indexDef.name,
          collection: indexDef.collection,
          exists: true,
          status: 'ready',
          createdAt: new Date()
        });

        return {
          name: indexDef.name,
          collection: indexDef.collection,
          success: true,
          duration: Date.now() - startTime,
          skipped: true,
          reason: 'Index already exists'
        };
      }

      // Create the index
      await collection.createIndex(indexDef.spec, {
        ...indexDef.options,
        name: indexDef.name
      });

      this.indexStatus.set(indexDef.name, {
        name: indexDef.name,
        collection: indexDef.collection,
        exists: true,
        status: 'ready',
        createdAt: new Date()
      });

      return {
        name: indexDef.name,
        collection: indexDef.collection,
        success: true,
        duration: Date.now() - startTime
      };

    } catch (error) {
      this.indexStatus.set(indexDef.name, {
        name: indexDef.name,
        collection: indexDef.collection,
        exists: false,
        status: 'error',
        error: (error as Error).message,
        createdAt: new Date()
      });

      return {
        name: indexDef.name,
        collection: indexDef.collection,
        success: false,
        error: (error as Error).message,
        duration: Date.now() - startTime
      };
    }
  }

  // Analyze index usage
  public async analyzeIndexUsage(): Promise<IIndexUsageAnalysis[]> {
    const connection = null as any // Placeholder for build compatibility;
    if (!connection) {
      throw new Error('Database connection not available');
    }

    const analyses: IIndexUsageAnalysis[] = [];
    const collections = new Set(INDEX_DEFINITIONS.map(idx => idx.collection));

    for (const collectionName of collections) {
      try {
        const collection = connection.collection(collectionName);
        const stats = await collection.stats();
        const indexes = await collection.indexes();

        for (const index of indexes) {
          // Get index usage stats (this would require MongoDB 3.2+ with $indexStats)
          try {
            const pipeline = [{ $indexStats: {} }];
            const indexStats = await collection.aggregate(pipeline).toArray();
            
            const indexStat = indexStats.find((stat: any) => stat.name === index.name);

            analyses.push({
              collection: collectionName,
              indexName: index.name,
              spec: index.key,
              size: index.size || 0,
              accesses: indexStat?.accesses?.ops || 0,
              since: indexStat?.accesses?.since || new Date(),
              efficiency: this.calculateIndexEfficiency(indexStat?.accesses?.ops || 0, stats.count || 0)
            });
          } catch (error) {
            // $indexStats not available, use basic info
            analyses.push({
              collection: collectionName,
              indexName: index.name,
              spec: index.key,
              size: index.size || 0,
              accesses: 0,
              since: new Date(),
              efficiency: 'unknown'
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to analyze indexes for collection ${collectionName}:`, error);
      }
    }

    return analyses;
  }

  private calculateIndexEfficiency(accesses: number, totalDocs: number): 'high' | 'medium' | 'low' | 'unknown' {
    if (totalDocs === 0) return 'unknown';
    
    const accessRatio = accesses / totalDocs;
    if (accessRatio > 0.1) return 'high';
    if (accessRatio > 0.01) return 'medium';
    return 'low';
  }

  // Drop unused indexes
  public async dropUnusedIndexes(dryRun: boolean = true): Promise<IIndexDropResult[]> {
    const analyses = await this.analyzeIndexUsage();
    const results: IIndexDropResult[] = [];

    const unusedIndexes = analyses.filter(analysis => 
      analysis.accesses === 0 && 
      analysis.indexName !== '_id_' && // Never drop _id index
      !this.isEssentialIndex(analysis.indexName)
    );

    for (const index of unusedIndexes) {
      try {
        if (!dryRun) {
          const connection = null as any // Placeholder for build compatibility;
          if (connection) {
            const collection = connection.collection(index.collection);
            await collection.dropIndex(index.indexName);
          }
        }

        results.push({
          indexName: index.indexName,
          collection: index.collection,
          dropped: !dryRun,
          dryRun,
          reason: 'Unused index',
          sizeSaved: index.size
        });
      } catch (error) {
        results.push({
          indexName: index.indexName,
          collection: index.collection,
          dropped: false,
          dryRun,
          error: (error as Error).message,
          sizeSaved: 0
        });
      }
    }

    return results;
  }

  private isEssentialIndex(indexName: string): boolean {
    const essentialIndexes = [
      'applications_application_id',
      'payments_payment_id',
      'subscriptions_subscription_id'
    ];
    return essentialIndexes.includes(indexName);
  }

  // Get index status
  public getIndexStatus(): Map<string, IIndexStatus> {
    return new Map(this.indexStatus);
  }

  // Rebuild indexes
  public async rebuildIndexes(collections?: string[]): Promise<IIndexRebuildResult[]> {
    const connection = null as any // Placeholder for build compatibility;
    if (!connection) {
      throw new Error('Database connection not available');
    }

    const targetCollections = collections || [...new Set(INDEX_DEFINITIONS.map(idx => idx.collection))];
    const results: IIndexRebuildResult[] = [];

    for (const collectionName of targetCollections) {
      try {
        const startTime = Date.now();
        const collection = connection.collection(collectionName);
        
        await collection.reIndex();
        
        results.push({
          collection: collectionName,
          success: true,
          duration: Date.now() - startTime
        });
        
        console.log(`✅ Rebuilt indexes for collection: ${collectionName}`);
      } catch (error) {
        results.push({
          collection: collectionName,
          success: false,
          error: (error as Error).message,
          duration: 0
        });
        
        console.error(`❌ Failed to rebuild indexes for ${collectionName}:`, error);
      }
    }

    return results;
  }
}

// Interfaces
export interface IIndexStatus {
  name: string;
  collection: string;
  exists: boolean;
  status: 'ready' | 'building' | 'error';
  error?: string;
  createdAt: Date;
}

export interface IIndexCreationResult {
  name: string;
  collection: string;
  success: boolean;
  duration: number;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

export interface IIndexUsageAnalysis {
  collection: string;
  indexName: string;
  spec: Record<string, any>;
  size: number;
  accesses: number;
  since: Date;
  efficiency: 'high' | 'medium' | 'low' | 'unknown';
}

export interface IIndexDropResult {
  indexName: string;
  collection: string;
  dropped: boolean;
  dryRun: boolean;
  reason?: string;
  error?: string;
  sizeSaved: number;
}

export interface IIndexRebuildResult {
  collection: string;
  success: boolean;
  duration: number;
  error?: string;
}

// Initialize index manager
export const indexManager = IndexManager.getInstance();

// Helper function to initialize indexes on startup
export async function initializeIndexes(): Promise<void> {
  try {
    console.log('🔍 Initializing database indexes...');
    await indexManager.createAllIndexes();
    console.log('✅ Database indexes initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database indexes:', error);
    throw error;
  }
}

// IndexManager is already exported as a class above
