/**
 * PostgreSQL Database Manager
 * Handles Render PostgreSQL connection, schema management, and data operations
 * Replaces MongoDB with PostgreSQL for full Render hosting solution
 */

import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';

// Load environment variables
config();

export class PostgreSQLManager {
    constructor(logger, metricsCollector, errorTracker) {
        this.logger = logger;
        this.metrics = metricsCollector;
        this.errorTracker = errorTracker;

        this.pool = null;
        this.isConnected = false;

        // Database configuration
        this.config = {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 10, // Maximum number of clients in the pool
            idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
            connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
        };

        // Table names
        this.tables = {
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

    // Connect to PostgreSQL
    async connect() {
        try {
            if (!this.config.connectionString) {
                throw new Error('Database URL not configured. Please set DATABASE_URL environment variable.');
            }

            this.logger.info('🔌 Connecting to Render PostgreSQL...');

            this.pool = new Pool(this.config);

            // Test the connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            this.isConnected = true;

            this.logger.info('✅ Connected to Render PostgreSQL database');

            // Initialize tables and indexes
            await this.initializeTables();

            // Record connection metrics
            this.metrics.recordEvent('database_connection', 'success', 'postgresql');

            return true;
        } catch (error) {
            this.logger.error('❌ PostgreSQL connection failed:', error.message);
            this.errorTracker.trackError(error, { component: 'postgresql', operation: 'connect' });
            this.metrics.recordError('database_connection', 'high', 'postgresql');
            throw error;
        }
    }

    // Initialize tables and create indexes
    async initializeTables() {
        try {
            this.logger.info('🏗️ Initializing PostgreSQL tables and indexes...');

            // Create tables
            await this.createTables();

            // Create indexes for optimal performance
            await this.createIndexes();

            this.logger.info('📊 Database tables initialized successfully');

            return true;
        } catch (error) {
            this.logger.error('❌ Failed to initialize tables:', error.message);
            throw error;
        }
    }

    // Create database tables
    async createTables() {
        const tableCreationQueries = [
            // Rebels table
            `CREATE TABLE IF NOT EXISTS ${this.tables.rebels} (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(20) UNIQUE NOT NULL,
                username VARCHAR(100) NOT NULL,
                guild_id VARCHAR(20) NOT NULL,
                class VARCHAR(50) NOT NULL DEFAULT 'hacker',
                level INTEGER DEFAULT 1,
                experience INTEGER DEFAULT 0,
                energy INTEGER DEFAULT 100,
                max_energy INTEGER DEFAULT 100,
                loyalty_score INTEGER DEFAULT 0,
                total_damage INTEGER DEFAULT 0,
                credits INTEGER DEFAULT 100,
                last_daily_mission DATE,
                last_energy_regen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Items table
            `CREATE TABLE IF NOT EXISTS ${this.tables.items} (
                id SERIAL PRIMARY KEY,
                item_id VARCHAR(100) UNIQUE NOT NULL,
                owner_id VARCHAR(20) NOT NULL,
                name VARCHAR(200) NOT NULL,
                type VARCHAR(50) NOT NULL,
                rarity VARCHAR(20) NOT NULL,
                value INTEGER DEFAULT 0,
                acquired_from VARCHAR(100),
                acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                activated_at TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES ${this.tables.rebels}(user_id) ON DELETE CASCADE
            )`,

            // Guilds table
            `CREATE TABLE IF NOT EXISTS ${this.tables.guilds} (
                id SERIAL PRIMARY KEY,
                guild_id VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                total_members INTEGER DEFAULT 0,
                total_damage INTEGER DEFAULT 0,
                total_raids INTEGER DEFAULT 0,
                settings JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Achievements table
            `CREATE TABLE IF NOT EXISTS ${this.tables.achievements} (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(20) NOT NULL,
                achievement_id VARCHAR(100) NOT NULL,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES ${this.tables.rebels}(user_id) ON DELETE CASCADE,
                UNIQUE(user_id, achievement_id)
            )`,

            // Trades table
            `CREATE TABLE IF NOT EXISTS ${this.tables.trades} (
                id SERIAL PRIMARY KEY,
                trade_id VARCHAR(100) UNIQUE NOT NULL,
                seller_id VARCHAR(20) NOT NULL,
                buyer_id VARCHAR(20),
                item_id VARCHAR(100) NOT NULL,
                price INTEGER NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                trade_type VARCHAR(20) DEFAULT 'direct',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                FOREIGN KEY (seller_id) REFERENCES ${this.tables.rebels}(user_id) ON DELETE CASCADE,
                FOREIGN KEY (buyer_id) REFERENCES ${this.tables.rebels}(user_id) ON DELETE SET NULL
            )`,

            // Analytics table
            `CREATE TABLE IF NOT EXISTS ${this.tables.analytics} (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                user_id VARCHAR(20),
                guild_id VARCHAR(20),
                data JSONB DEFAULT '{}',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const query of tableCreationQueries) {
            try {
                await this.pool.query(query);
            } catch (error) {
                this.logger.error(`Failed to create table: ${error.message}`);
                throw error;
            }
        }

        this.logger.info('✅ All database tables created successfully');
    }

    // Create database indexes for performance
    async createIndexes() {
        const indexQueries = [
            // Rebels table indexes
            `CREATE INDEX IF NOT EXISTS idx_rebels_guild_id ON ${this.tables.rebels}(guild_id)`,
            `CREATE INDEX IF NOT EXISTS idx_rebels_level ON ${this.tables.rebels}(level DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_rebels_loyalty_score ON ${this.tables.rebels}(loyalty_score DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_rebels_last_active ON ${this.tables.rebels}(last_active DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_rebels_user_guild ON ${this.tables.rebels}(user_id, guild_id)`,

            // Guilds table indexes
            `CREATE INDEX IF NOT EXISTS idx_guilds_total_members ON ${this.tables.guilds}(total_members DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_guilds_total_damage ON ${this.tables.guilds}(total_damage DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_guilds_created_at ON ${this.tables.guilds}(created_at DESC)`,

            // Items table indexes
            `CREATE INDEX IF NOT EXISTS idx_items_owner_id ON ${this.tables.items}(owner_id)`,
            `CREATE INDEX IF NOT EXISTS idx_items_type ON ${this.tables.items}(type)`,
            `CREATE INDEX IF NOT EXISTS idx_items_rarity ON ${this.tables.items}(rarity)`,
            `CREATE INDEX IF NOT EXISTS idx_items_owner_type ON ${this.tables.items}(owner_id, type)`,

            // Achievements table indexes
            `CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON ${this.tables.achievements}(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_achievements_achievement_id ON ${this.tables.achievements}(achievement_id)`,
            `CREATE INDEX IF NOT EXISTS idx_achievements_unlocked_at ON ${this.tables.achievements}(unlocked_at DESC)`,

            // Trades table indexes
            `CREATE INDEX IF NOT EXISTS idx_trades_seller_id ON ${this.tables.trades}(seller_id)`,
            `CREATE INDEX IF NOT EXISTS idx_trades_buyer_id ON ${this.tables.trades}(buyer_id)`,
            `CREATE INDEX IF NOT EXISTS idx_trades_status ON ${this.tables.trades}(status)`,
            `CREATE INDEX IF NOT EXISTS idx_trades_created_at ON ${this.tables.trades}(created_at DESC)`,

            // Analytics table indexes
            `CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON ${this.tables.analytics}(event_type)`,
            `CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON ${this.tables.analytics}(timestamp DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_analytics_guild_id ON ${this.tables.analytics}(guild_id)`,
            `CREATE INDEX IF NOT EXISTS idx_analytics_event_timestamp ON ${this.tables.analytics}(event_type, timestamp DESC)`
        ];

        try {
            for (const query of indexQueries) {
                try {
                    await this.pool.query(query);
                } catch (error) {
                    // Index might already exist, log but don't fail
                    this.logger.warn(`Index creation warning:`, error.message);
                }
            }

            this.logger.info('✅ Database indexes created successfully');
        } catch (error) {
            this.logger.error('❌ Failed to create indexes:', error.message);
            throw error;
        }
    }

    // Get database connection status
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            database: 'dobbyx_rebellion',
            tables: Object.keys(this.tables).length,
            connectionString: this.config.connectionString ? 'configured' : 'not_configured'
        };
    }

    // Health check for database
    async healthCheck() {
        try {
            if (!this.isConnected || !this.pool) {
                return { status: 'disconnected', error: 'No active connection' };
            }

            // Test the database connection
            const startTime = Date.now();
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW() as current_time');
            client.release();
            const responseTime = Date.now() - startTime;

            // Get database stats
            const statsClient = await this.pool.connect();
            const statsResult = await statsClient.query(`
                SELECT
                    pg_database_size(current_database()) as database_size,
                    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count
            `);
            statsClient.release();

            return {
                status: 'healthy',
                responseTime: `${responseTime}ms`,
                database: 'dobbyx_rebellion',
                tables: statsResult.rows[0].table_count,
                databaseSize: this.formatBytes(parseInt(statsResult.rows[0].database_size)),
                currentTime: result.rows[0].current_time
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

    // Disconnect from PostgreSQL
    async disconnect() {
        try {
            if (this.pool && this.isConnected) {
                await this.pool.end();
                this.isConnected = false;
                this.pool = null;
                this.logger.info('🔌 Disconnected from PostgreSQL');
            }
        } catch (error) {
            this.logger.error('❌ Error disconnecting from PostgreSQL:', error.message);
            throw error;
        }
    }

    // Graceful shutdown
    async gracefulShutdown() {
        if (this.pool) {
            this.logger.info('🔌 Closing PostgreSQL connection...');
            await this.pool.end();
            this.isConnected = false;
            this.logger.info('✅ PostgreSQL connection closed');
        }
    }

    // Get database client for queries
    async getClient() {
        if (!this.isConnected || !this.pool) {
            throw new Error('Database not connected');
        }

        return await this.pool.connect();
    }

    // Execute query with automatic client management
    async query(text, params = []) {
        if (!this.isConnected || !this.pool) {
            throw new Error('Database not connected');
        }

        const client = await this.pool.connect();
        try {
            const result = await client.query(text, params);
            return result;
        } finally {
            client.release();
        }
    }

    // Database operation wrapper with error handling
    async executeOperation(operation, tableName, operationName) {
        try {
            const startTime = Date.now();
            const result = await operation();
            const duration = Date.now() - startTime;

            this.metrics.recordEvent('database_operation', 'success', 'postgresql', {
                table: tableName,
                operation: operationName,
                duration
            });

            return result;
        } catch (error) {
            this.logger.error(`❌ Database operation failed [${operationName}]:`, error.message);
            this.errorTracker.trackError(error, {
                component: 'postgresql',
                operation: operationName,
                table: tableName
            });
            this.metrics.recordError('database_operation', 'medium', 'postgresql');
            throw error;
        }
    }

    // Setup connection event handlers
    setupConnectionHandlers() {
        if (this.pool) {
            this.pool.on('connect', () => {
                this.logger.info('🔗 New PostgreSQL client connected');
            });

            this.pool.on('error', (err) => {
                this.logger.error('❌ PostgreSQL pool error:', err.message);
                this.errorTracker.trackError(err, { component: 'postgresql', operation: 'pool_error' });
            });

            this.pool.on('remove', () => {
                this.logger.info('🔌 PostgreSQL client removed from pool');
            });
        }
    }
}

export default PostgreSQLManager;
