// 🚀 SCALABILITY CONFIGURATION FOR DOBBYX
// Optimized for 500K+ Discord servers with 10K+ active users

export const ScalabilityConfig = {
    // Memory Management Settings
    memory: {
        // Clean up inactive users every 30 minutes
        cleanupInterval: 30 * 60 * 1000, // 30 minutes
        
        // Archive users inactive for more than 1 week
        userInactivityThreshold: 7 * 24 * 60 * 60 * 1000, // 1 week
        
        // Clean cooldowns older than 1 day
        cooldownCleanupThreshold: 24 * 60 * 60 * 1000, // 1 day
        
        // Clean trades older than 24 hours
        tradeCleanupThreshold: 24 * 60 * 60 * 1000, // 24 hours
        
        // Maximum archived users to keep in memory
        maxArchivedUsers: 1000,
        
        // Memory usage alert threshold (MB)
        memoryAlertThreshold: 1024, // 1GB
        
        // User count alert threshold
        userCountAlertThreshold: 5000
    },

    // Performance Monitoring Settings
    monitoring: {
        // Performance metrics logging interval
        metricsInterval: 5 * 60 * 1000, // 5 minutes
        
        // Enable detailed performance logging
        enableDetailedLogging: true,
        
        // Log slow operations (ms)
        slowOperationThreshold: 1000 // 1 second
    },

    // Rate Limiting Settings
    rateLimiting: {
        // General actions (commands, interactions)
        general: {
            max: 30, // 30 actions per minute
            window: 60 * 1000 // 1 minute window
        },
        
        // Raid commands (more restrictive)
        raid: {
            max: 10, // 10 raids per minute
            window: 60 * 1000 // 1 minute window
        },
        
        // Trading commands
        trade: {
            max: 5, // 5 trades per minute
            window: 60 * 1000 // 1 minute window
        },
        
        // Button interactions
        button: {
            max: 60, // 60 button clicks per minute
            window: 60 * 1000 // 1 minute window
        }
    },

    // Batch Processing Settings
    batchProcessing: {
        // Energy regeneration batch size
        energyRegenBatchSize: 100,
        
        // Maximum processing time per batch (ms)
        maxBatchProcessingTime: 100,
        
        // Use setImmediate for non-blocking processing
        useAsyncProcessing: true
    },

    // Backup System Settings
    backup: {
        // Backup interval
        interval: 30 * 60 * 1000, // 30 minutes
        
        // Maximum number of backups to keep
        maxBackups: 10,
        
        // Use async backup processing
        useAsyncBackup: true,
        
        // Compress backups (future enhancement)
        enableCompression: false
    },

    // Real-time System Settings
    realTimeSystems: {
        // Energy regeneration interval
        energyRegenInterval: 60 * 1000, // 1 minute
        
        // Corporate health regeneration interval
        corpHealthRegenInterval: 5 * 60 * 1000, // 5 minutes
        
        // Market updates interval
        marketUpdateInterval: 2 * 60 * 1000, // 2 minutes
        
        // Daily reset check interval
        dailyResetInterval: 60 * 60 * 1000, // 1 hour
        
        // Only process recently active users (minutes)
        activeUserThreshold: 5 // 5 minutes
    },

    // Discord API Optimization
    discord: {
        // Use ephemeral replies for rate limit messages
        useEphemeralRateLimit: true,
        
        // Defer replies immediately to prevent timeouts
        deferRepliesImmediately: true,
        
        // Maximum concurrent interactions
        maxConcurrentInteractions: 100
    },

    // Feature Flags for Large Scale
    features: {
        // Enable memory management system
        enableMemoryManagement: true,
        
        // Enable performance monitoring
        enablePerformanceMonitoring: true,
        
        // Enable rate limiting
        enableRateLimiting: true,
        
        // Enable batch processing
        enableBatchProcessing: true,
        
        // Enable async interaction handling
        enableAsyncInteractions: true,
        
        // Enable user activity tracking
        enableActivityTracking: true
    },

    // Scaling Thresholds
    scaling: {
        // When to start aggressive memory cleanup
        aggressiveCleanupUserCount: 3000,
        
        // When to reduce backup frequency
        reduceBackupFrequencyUserCount: 5000,
        
        // When to enable emergency mode
        emergencyModeUserCount: 8000,
        
        // Emergency mode settings
        emergencyMode: {
            // Reduce energy regen frequency
            energyRegenInterval: 2 * 60 * 1000, // 2 minutes
            
            // Reduce backup frequency
            backupInterval: 60 * 60 * 1000, // 1 hour
            
            // More aggressive rate limiting
            rateLimitMultiplier: 0.5, // 50% of normal limits
            
            // Disable non-essential features
            disableNonEssentialFeatures: true
        }
    }
};

// Helper function to get current configuration based on user count
export function getScaledConfig(userCount) {
    const config = { ...ScalabilityConfig };
    
    if (userCount > config.scaling.emergencyModeUserCount) {
        // Emergency mode
        config.realTimeSystems.energyRegenInterval = config.scaling.emergencyMode.energyRegenInterval;
        config.backup.interval = config.scaling.emergencyMode.backupInterval;
        
        // Apply rate limit multiplier
        Object.keys(config.rateLimiting).forEach(key => {
            config.rateLimiting[key].max = Math.floor(
                config.rateLimiting[key].max * config.scaling.emergencyMode.rateLimitMultiplier
            );
        });
        
    } else if (userCount > config.scaling.reduceBackupFrequencyUserCount) {
        // Reduce backup frequency
        config.backup.interval = 60 * 60 * 1000; // 1 hour
        
    } else if (userCount > config.scaling.aggressiveCleanupUserCount) {
        // More aggressive cleanup
        config.memory.cleanupInterval = 15 * 60 * 1000; // 15 minutes
        config.memory.userInactivityThreshold = 3 * 24 * 60 * 60 * 1000; // 3 days
    }
    
    return config;
}

export default ScalabilityConfig;
