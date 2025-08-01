/**
 * MongoDB Database Manager
 * Handles MongoDB Atlas connection, schema management, and data operations
 * Designed for easy credential switching during team handover
 */

import { MongoClient, ServerApiVersion } from 'mongodb';
import { config } from 'dotenv';

// Load environment variables
config();

export class MongoDBManager {
    constructor(logger, metricsCollector, errorTracker) {
        this.logger = logger;
        this.metrics = metricsCollector;
        this.errorTracker = errorTracker;
        
        this.client = null;
        this.db = null;
        this.isConnected = false;
        
        // Database configuration
        this.config = {
            // Support multiple environment configurations
            uri: process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING,
            database: process.env.MONGODB_DATABASE || 'dobbyx_rebellion',
            options: {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                },
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4 // Use IPv4, skip trying IPv6
            }
        };
        
        // Collection names
        this.collections = {
            rebels: 'rebels',
            guilds: 'guilds',
            raids: 'raids',
            items: 'items',
            achievements: 'achievements',
            leaderboards: 'leaderboards',
            trades: 'trades',
            backups: 'backups',
            analytics: 'analytics'
        };
        
        this.setupConnectionHandlers();
    }

    // Setup connection event handlers
    setupConnectionHandlers() {
        process.on('SIGINT', () => this.gracefulShutdown());
        process.on('SIGTERM', () => this.gracefulShutdown());
    }

    // Connect to MongoDB Atlas
    async connect() {
        try {
            if (!this.config.uri) {
                throw new Error('MongoDB URI not configured. Please set MONGODB_URI environment variable.');
            }

            this.logger.info('🔌 Connecting to MongoDB Atlas...');
            
            this.client = new MongoClient(this.config.uri, this.config.options);
            await this.client.connect();
            
            // Test the connection
            await this.client.db('admin').command({ ping: 1 });
            
            this.db = this.client.db(this.config.database);
            this.isConnected = true;
            
            this.logger.info(`✅ Connected to MongoDB Atlas database: ${this.config.database}`);
            
            // Initialize collections and indexes
            await this.initializeCollections();
            
            // Record connection metrics
            this.metrics.recordEvent('database_connection', 'success', 'mongodb');
            
            return true;
        } catch (error) {
            this.logger.error('❌ MongoDB connection failed:', error.message);
            this.errorTracker.trackError(error, { component: 'mongodb', operation: 'connect' });
            this.metrics.recordError('database_connection', 'high', 'mongodb');
            throw error;
        }
    }

    // Initialize collections and create indexes
    async initializeCollections() {
        try {
            this.logger.info('🏗️ Initializing MongoDB collections and indexes...');
            
            // Create indexes for optimal performance
            await this.createIndexes();
            
            // Verify collections exist
            const collections = await this.db.listCollections().toArray();
            this.logger.info(`📊 Database collections available: ${collections.length}`);
            
            return true;
        } catch (error) {
            this.logger.error('❌ Failed to initialize collections:', error.message);
            throw error;
        }
    }

    // Create database indexes for performance
    async createIndexes() {
        const indexOperations = [
            // Rebels collection indexes
            {
                collection: this.collections.rebels,
                indexes: [
                    { key: { userId: 1 }, options: { unique: true } },
                    { key: { guildId: 1 } },
                    { key: { level: -1 } },
                    { key: { loyaltyScore: -1 } },
                    { key: { lastActive: -1 } },
                    { key: { 'userId': 1, 'guildId': 1 } }
                ]
            },
            
            // Guilds collection indexes
            {
                collection: this.collections.guilds,
                indexes: [
                    { key: { guildId: 1 }, options: { unique: true } },
                    { key: { totalMembers: -1 } },
                    { key: { totalDamage: -1 } },
                    { key: { createdAt: -1 } }
                ]
            },
            
            // Raids collection indexes
            {
                collection: this.collections.raids,
                indexes: [
                    { key: { raidId: 1 }, options: { unique: true } },
                    { key: { guildId: 1 } },
                    { key: { leaderId: 1 } },
                    { key: { status: 1 } },
                    { key: { createdAt: -1 } },
                    { key: { 'guildId': 1, 'status': 1 } }
                ]
            },
            
            // Items collection indexes
            {
                collection: this.collections.items,
                indexes: [
                    { key: { itemId: 1 }, options: { unique: true } },
                    { key: { ownerId: 1 } },
                    { key: { type: 1 } },
                    { key: { rarity: 1 } },
                    { key: { 'ownerId': 1, 'type': 1 } }
                ]
            },
            
            // Achievements collection indexes
            {
                collection: this.collections.achievements,
                indexes: [
                    { key: { userId: 1 } },
                    { key: { achievementId: 1 } },
                    { key: { unlockedAt: -1 } },
                    { key: { 'userId': 1, 'achievementId': 1 }, options: { unique: true } }
                ]
            },
            
            // Trades collection indexes
            {
                collection: this.collections.trades,
                indexes: [
                    { key: { tradeId: 1 }, options: { unique: true } },
                    { key: { sellerId: 1 } },
                    { key: { buyerId: 1 } },
                    { key: { status: 1 } },
                    { key: { createdAt: -1 } }
                ]
            },
            
            // Analytics collection indexes
            {
                collection: this.collections.analytics,
                indexes: [
                    { key: { eventType: 1 } },
                    { key: { timestamp: -1 } },
                    { key: { guildId: 1 } },
                    { key: { 'eventType': 1, 'timestamp': -1 } }
                ]
            }
        ];

        for (const { collection, indexes } of indexOperations) {
            try {
                for (const { key, options = {} } of indexes) {
                    await this.db.collection(collection).createIndex(key, options);
                }
                this.logger.info(`✅ Created indexes for ${collection} collection`);
            } catch (error) {
                if (error.code !== 85) { // Index already exists
                    this.logger.warn(`⚠️ Index creation warning for ${collection}:`, error.message);
                }
            }
        }
    }

    // Get database connection status
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            database: this.config.database,
            collections: Object.keys(this.collections).length,
            uri: this.config.uri ? 'configured' : 'not_configured'
        };
    }

    // Health check for database
    async healthCheck() {
        try {
            if (!this.isConnected || !this.client) {
                return { status: 'disconnected', error: 'No active connection' };
            }

            // Ping the database
            const startTime = Date.now();
            await this.client.db('admin').command({ ping: 1 });
            const responseTime = Date.now() - startTime;

            // Get database stats
            const stats = await this.db.stats();

            return {
                status: 'healthy',
                responseTime: `${responseTime}ms`,
                database: this.config.database,
                collections: stats.collections,
                dataSize: this.formatBytes(stats.dataSize),
                indexSize: this.formatBytes(stats.indexSize)
            };
        } catch (error) {
            this.logger.error('❌ Database health check failed:', error.message);
            return { status: 'unhealthy', error: error.message };
        }
    }

    // Format bytes for display
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Graceful shutdown
    async gracefulShutdown() {
        if (this.client) {
            this.logger.info('🔌 Closing MongoDB connection...');
            await this.client.close();
            this.isConnected = false;
            this.logger.info('✅ MongoDB connection closed');
        }
    }

    // Get collection reference
    getCollection(collectionName) {
        if (!this.isConnected || !this.db) {
            throw new Error('Database not connected');
        }
        
        if (!this.collections[collectionName]) {
            throw new Error(`Unknown collection: ${collectionName}`);
        }
        
        return this.db.collection(this.collections[collectionName]);
    }

    // Database operation wrapper with error handling
    async executeOperation(operation, collectionName, operationName) {
        try {
            const startTime = Date.now();
            const result = await operation();
            const duration = Date.now() - startTime;
            
            this.metrics.recordEvent('database_operation', 'success', 'mongodb', { 
                collection: collectionName, 
                operation: operationName,
                duration 
            });
            
            return result;
        } catch (error) {
            this.logger.error(`❌ Database operation failed [${operationName}]:`, error.message);
            this.errorTracker.trackError(error, { 
                component: 'mongodb', 
                operation: operationName, 
                collection: collectionName 
            });
            this.metrics.recordError('database_operation', 'medium', 'mongodb');
            throw error;
        }
    }
}

export default MongoDBManager;
