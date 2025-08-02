/**
 * Rebel Data Access Layer
 * Handles all database operations for rebel (player) data
 * Includes CRUD operations, queries, and business logic
 */

import { DefaultValues, Validators } from '../models.js';

export class RebelDAL {
    constructor(postgresManager, logger, metricsCollector) {
        this.postgres = postgresManager;
        this.logger = logger;
        this.metrics = metricsCollector;
        this.table = 'rebels';
    }

    // Create a new rebel
    async createRebel(userId, username, guildId, className = 'hacker') {
        return await this.postgres.executeOperation(async () => {
            // Validate inputs
            if (!Validators.isValidUserId(userId)) {
                throw new Error('Invalid user ID format');
            }
            if (!Validators.isValidGuildId(guildId)) {
                throw new Error('Invalid guild ID format');
            }
            if (!Validators.isValidClass(className)) {
                throw new Error('Invalid rebel class');
            }

            // Check if rebel already exists
            const existing = await this.getRebel(userId);
            if (existing) {
                throw new Error('Rebel already exists');
            }

            // Create new rebel record
            const query = `
                INSERT INTO ${this.table} (
                    user_id, username, guild_id, class, level, experience,
                    energy, max_energy, loyalty_score, total_damage, credits,
                    created_at, last_active, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *
            `;

            const values = [
                userId,
                username,
                guildId,
                className,
                DefaultValues.rebel.level || 1,
                DefaultValues.rebel.experience || 0,
                DefaultValues.rebel.energy || 100,
                DefaultValues.rebel.maxEnergy || 100,
                DefaultValues.rebel.loyaltyScore || 0,
                DefaultValues.rebel.totalDamage || 0,
                DefaultValues.rebel.credits || 100,
                new Date(),
                new Date(),
                new Date()
            ];

            const result = await this.postgres.query(query, values);

            if (result.rows && result.rows.length > 0) {
                const newRebel = result.rows[0];
                this.logger.info(`✅ Created new rebel: ${username} (${userId}) - Class: ${className}`);
                this.metrics.recordEvent('rebel_created', 'success', 'database');
                return newRebel;
            } else {
                throw new Error('Failed to create rebel');
            }
        }, this.table, 'createRebel');
    }

    // Get rebel by user ID
    async getRebel(userId) {
        return await this.postgres.executeOperation(async () => {
            if (!Validators.isValidUserId(userId)) {
                throw new Error('Invalid user ID format');
            }

            const query = `SELECT * FROM ${this.table} WHERE user_id = $1`;
            const result = await this.postgres.query(query, [userId]);
            const rebel = result.rows.length > 0 ? result.rows[0] : null;
            
            if (rebel) {
                // Update last active timestamp
                await this.updateLastActive(userId);
            }
            
            return rebel;
        }, this.table, 'getRebel');
    }

    // Update rebel data
    async updateRebel(userId, updateData) {
        return await this.postgres.executeOperation(async () => {
            if (!Validators.isValidUserId(userId)) {
                throw new Error('Invalid user ID format');
            }

            // Build dynamic update query
            const fields = Object.keys(updateData);
            const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
            const values = [userId, ...Object.values(updateData), new Date()];

            const query = `
                UPDATE ${this.table}
                SET ${setClause}, updated_at = $${values.length}
                WHERE user_id = $1
                RETURNING *
            `;

            const result = await this.postgres.query(query, values);

            if (result.rows.length === 0) {
                throw new Error('Rebel not found');
            }

            this.logger.info(`✅ Updated rebel: ${userId}`);
            return result.rows[0];
        }, this.table, 'updateRebel');
    }

    // Add experience and handle level ups
    async addExperience(userId, experience) {
        return await this.mongo.executeOperation(async () => {
            const rebel = await this.getRebel(userId);
            if (!rebel) {
                throw new Error('Rebel not found');
            }

            const newExperience = rebel.experience + experience;
            const newLevel = this.calculateLevel(newExperience);
            const leveledUp = newLevel > rebel.level;

            const updateData = {
                experience: newExperience,
                level: newLevel,
                updatedAt: new Date()
            };

            // If leveled up, increase max energy
            if (leveledUp) {
                updateData.maxEnergy = Math.min(200, rebel.maxEnergy + 5);
                updateData.energy = updateData.maxEnergy; // Full energy on level up
                this.logger.info(`🎉 Rebel ${userId} leveled up to level ${newLevel}!`);
                this.metrics.recordEvent('rebel_levelup', 'success', 'game');
            }

            await this.updateRebel(userId, updateData);
            
            return {
                leveledUp,
                oldLevel: rebel.level,
                newLevel,
                experienceGained: experience,
                totalExperience: newExperience
            };
        }, this.collection, 'addExperience');
    }

    // Calculate level from experience
    calculateLevel(experience) {
        // Level formula: level = floor(sqrt(experience / 100)) + 1
        return Math.min(100, Math.floor(Math.sqrt(experience / 100)) + 1);
    }

    // Update energy
    async updateEnergy(userId, energyChange) {
        return await this.mongo.executeOperation(async () => {
            const rebel = await this.getRebel(userId);
            if (!rebel) {
                throw new Error('Rebel not found');
            }

            const newEnergy = Math.max(0, Math.min(rebel.maxEnergy, rebel.energy + energyChange));
            
            await this.updateRebel(userId, { 
                energy: newEnergy,
                lastEnergyRegen: new Date()
            });

            return {
                oldEnergy: rebel.energy,
                newEnergy,
                maxEnergy: rebel.maxEnergy
            };
        }, this.collection, 'updateEnergy');
    }

    // Add item to inventory
    async addItemToInventory(userId, itemId, quantity = 1) {
        return await this.mongo.executeOperation(async () => {
            const rebel = await this.getRebel(userId);
            if (!rebel) {
                throw new Error('Rebel not found');
            }

            // Check inventory space
            if (rebel.inventory.items.length >= rebel.inventory.maxSlots) {
                throw new Error('Inventory is full');
            }

            // Check if item already exists in inventory
            const existingItemIndex = rebel.inventory.items.findIndex(item => item.itemId === itemId);
            
            if (existingItemIndex >= 0) {
                // Update existing item quantity
                rebel.inventory.items[existingItemIndex].quantity += quantity;
            } else {
                // Add new item
                rebel.inventory.items.push({
                    itemId,
                    quantity,
                    acquiredAt: new Date()
                });
            }

            await this.updateRebel(userId, { inventory: rebel.inventory });
            
            this.logger.info(`📦 Added ${quantity}x ${itemId} to ${userId}'s inventory`);
            return true;
        }, this.collection, 'addItemToInventory');
    }

    // Remove item from inventory
    async removeItemFromInventory(userId, itemId, quantity = 1) {
        return await this.mongo.executeOperation(async () => {
            const rebel = await this.getRebel(userId);
            if (!rebel) {
                throw new Error('Rebel not found');
            }

            const itemIndex = rebel.inventory.items.findIndex(item => item.itemId === itemId);
            if (itemIndex === -1) {
                throw new Error('Item not found in inventory');
            }

            const item = rebel.inventory.items[itemIndex];
            if (item.quantity < quantity) {
                throw new Error('Insufficient item quantity');
            }

            if (item.quantity === quantity) {
                // Remove item completely
                rebel.inventory.items.splice(itemIndex, 1);
            } else {
                // Reduce quantity
                rebel.inventory.items[itemIndex].quantity -= quantity;
            }

            await this.updateRebel(userId, { inventory: rebel.inventory });
            
            this.logger.info(`📦 Removed ${quantity}x ${itemId} from ${userId}'s inventory`);
            return true;
        }, this.collection, 'removeItemFromInventory');
    }

    // Update last active timestamp
    async updateLastActive(userId) {
        return await this.mongo.executeOperation(async () => {
            const collection = this.mongo.getCollection(this.collection);
            await collection.updateOne(
                { userId },
                { $set: { lastActive: new Date() } }
            );
        }, this.collection, 'updateLastActive');
    }

    // Get rebels by guild
    async getRebelsByGuild(guildId, limit = 50, skip = 0) {
        return await this.mongo.executeOperation(async () => {
            if (!Validators.isValidGuildId(guildId)) {
                throw new Error('Invalid guild ID format');
            }

            const collection = this.mongo.getCollection(this.collection);
            const rebels = await collection
                .find({ guildId })
                .sort({ level: -1, loyaltyScore: -1 })
                .limit(limit)
                .skip(skip)
                .toArray();

            return rebels;
        }, this.collection, 'getRebelsByGuild');
    }

    // Get top rebels (leaderboard)
    async getTopRebels(guildId = null, sortBy = 'level', limit = 10) {
        return await this.mongo.executeOperation(async () => {
            const query = guildId ? { guildId } : {};
            const sortOptions = {};
            
            // Define sort options
            switch (sortBy) {
                case 'level':
                    sortOptions.level = -1;
                    sortOptions.experience = -1;
                    break;
                case 'loyalty':
                    sortOptions.loyaltyScore = -1;
                    break;
                case 'damage':
                    sortOptions.corporateDamage = -1;
                    break;
                default:
                    sortOptions.level = -1;
            }

            const collection = this.mongo.getCollection(this.collection);
            const rebels = await collection
                .find(query)
                .sort(sortOptions)
                .limit(limit)
                .toArray();

            return rebels;
        }, this.collection, 'getTopRebels');
    }

    // Get rebel statistics
    async getRebelStats(userId) {
        return await this.mongo.executeOperation(async () => {
            const rebel = await this.getRebel(userId);
            if (!rebel) {
                throw new Error('Rebel not found');
            }

            // Calculate additional stats
            const totalStats = rebel.stats.strength + rebel.stats.intelligence + 
                             rebel.stats.charisma + rebel.stats.stealth;
            
            const inventoryUsed = rebel.inventory.items.length;
            const inventorySpace = rebel.inventory.maxSlots - inventoryUsed;
            
            return {
                basic: {
                    level: rebel.level,
                    experience: rebel.experience,
                    experienceToNext: this.getExperienceToNextLevel(rebel.level, rebel.experience),
                    energy: rebel.energy,
                    maxEnergy: rebel.maxEnergy
                },
                combat: {
                    totalStats,
                    corporateDamage: rebel.corporateDamage,
                    loyaltyScore: rebel.loyaltyScore
                },
                inventory: {
                    used: inventoryUsed,
                    available: inventorySpace,
                    total: rebel.inventory.maxSlots
                },
                progression: {
                    class: rebel.class,
                    currentZone: rebel.currentZone,
                    reputation: rebel.reputation
                }
            };
        }, this.collection, 'getRebelStats');
    }

    // Calculate experience needed for next level
    getExperienceToNextLevel(currentLevel, currentExperience) {
        if (currentLevel >= 100) return 0;
        
        const nextLevelExperience = Math.pow(currentLevel, 2) * 100;
        return Math.max(0, nextLevelExperience - currentExperience);
    }

    // Delete rebel (for admin purposes)
    async deleteRebel(userId) {
        return await this.mongo.executeOperation(async () => {
            if (!Validators.isValidUserId(userId)) {
                throw new Error('Invalid user ID format');
            }

            const collection = this.mongo.getCollection(this.collection);
            const result = await collection.deleteOne({ userId });

            if (result.deletedCount > 0) {
                this.logger.info(`🗑️ Deleted rebel: ${userId}`);
                this.metrics.recordEvent('rebel_deleted', 'success', 'database');
                return true;
            } else {
                throw new Error('Rebel not found');
            }
        }, this.collection, 'deleteRebel');
    }
}

export default RebelDAL;
