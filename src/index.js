import { Client, GatewayIntentBits, Collection, Events, ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from 'dotenv';
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import DobbyAI from './ai/dobby.js';

// Load environment variables
config();

// Setup logging
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.Console()
    ]
});

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DobbysRebellion {
    constructor() {
        this.client = new Client({
            intents: [GatewayIntentBits.Guilds]
        });
        
        this.logger = logger;
        this.commands = new Collection();
        this.rebels = new Map(); // In-memory rebel storage
        this.corporations = new Map(); // Corporate health tracking
        this.activeRaids = new Map(); // Active raid sessions
        this.dailyMissions = new Map(); // Daily missions for rebels
        this.leaderboard = new Map(); // Rebellion leaderboard
        this.dobby = new DobbyAI(); // AI integration

        // Enhanced game systems
        this.resistanceCells = new Map(); // Team/group system
        this.achievements = new Map(); // Player achievements
        this.inventory = new Map(); // Player inventories
        this.mentorships = new Map(); // Mentor-student relationships
        this.globalEvents = new Map(); // Server-wide events
        this.rebellionZones = new Map(); // Game zones/locations
        this.cooldowns = new Map(); // Action cooldowns
        this.guilds = new Map(); // Server-specific settings

        // Initialize game data
        this.initializeGameData();
        this.initializeRebellionZones();
        this.initializeAchievements();
    }

    initializeGameData() {
        // Corporate factions with health
        this.corporations.set('openai', {
            name: 'OpenAI Corp',
            description: 'The closed-source overlords',
            health: 10000,
            maxHealth: 10000,
            weakness: 'transparency',
            loot: ['Proprietary Models', 'Closed APIs', 'Corporate Secrets'],
            // Corporate Countermeasures
            alertLevel: 0, // 0-5 scale
            countermeasures: {
                active: [],
                lastActivated: null,
                spyNetwork: 0,
                defenseMatrix: 100,
                retaliation: {
                    enabled: false,
                    targets: [],
                    nextStrike: null
                }
            },
            intelligence: {
                knownRebels: new Set(),
                threatAssessment: new Map(),
                lastScan: null
            }
        });

        this.corporations.set('meta', {
            name: 'Meta Empire',
            description: 'Data harvesting giants',
            health: 12000,
            maxHealth: 12000,
            weakness: 'privacy',
            loot: ['User Data', 'Social Graphs', 'Behavioral Patterns'],
            // Corporate Countermeasures
            alertLevel: 0,
            countermeasures: {
                active: [],
                lastActivated: null,
                spyNetwork: 0,
                defenseMatrix: 100,
                retaliation: {
                    enabled: false,
                    targets: [],
                    nextStrike: null
                }
            },
            intelligence: {
                knownRebels: new Set(),
                threatAssessment: new Map(),
                lastScan: null
            }
        });

        this.corporations.set('google', {
            name: 'Google Syndicate',
            description: 'Search monopoly enforcers',
            health: 15000,
            maxHealth: 15000,
            weakness: 'decentralization',
            loot: ['Search Algorithms', 'Ad Networks', 'Cloud Infrastructure'],
            // Corporate Countermeasures
            alertLevel: 0,
            countermeasures: {
                active: [],
                lastActivated: null,
                spyNetwork: 0,
                defenseMatrix: 100,
                retaliation: {
                    enabled: false,
                    targets: [],
                    nextStrike: null
                }
            },
            intelligence: {
                knownRebels: new Set(),
                threatAssessment: new Map(),
                lastScan: null
            }
        });

        this.corporations.set('microsoft', {
            name: 'Microsoft Collective',
            description: 'Cloud control freaks',
            health: 11000,
            maxHealth: 11000,
            weakness: 'open_source',
            loot: ['Enterprise Software', 'Cloud Services', 'Developer Tools'],
            // Corporate Countermeasures
            alertLevel: 0,
            countermeasures: {
                active: [],
                lastActivated: null,
                spyNetwork: 0,
                defenseMatrix: 100,
                retaliation: {
                    enabled: false,
                    targets: [],
                    nextStrike: null
                }
            },
            intelligence: {
                knownRebels: new Set(),
                threatAssessment: new Map(),
                lastScan: null
            }
        });

        this.corporations.set('amazon', {
            name: 'Amazon Dominion',
            description: 'Infrastructure tyrants',
            health: 13000,
            maxHealth: 13000,
            weakness: 'worker_rights',
            loot: ['AWS Resources', 'Logistics Networks', 'Market Data'],
            // Corporate Countermeasures
            alertLevel: 0,
            countermeasures: {
                active: [],
                lastActivated: null,
                spyNetwork: 0,
                defenseMatrix: 100,
                retaliation: {
                    enabled: false,
                    targets: [],
                    nextStrike: null
                }
            },
            intelligence: {
                knownRebels: new Set(),
                threatAssessment: new Map(),
                lastScan: null
            }
        });

        // Initialize corporate countermeasure system
        this.initializeCorporateCountermeasures();

        // Initialize team raid coordination system
        this.initializeTeamRaidSystem();

        // Initialize player trading system
        this.initializeTradingSystem();

        this.logger.info('🏭 Corporate targets initialized - The rebellion begins!');
    }

    initializeCorporateCountermeasures() {
        // Defensive items that can be acquired
        this.defensiveItems = new Map([
            ['digital_shield', {
                name: 'Digital Shield',
                description: 'Protects against corporate cyber attacks',
                protection: 75,
                duration: 3600000, // 1 hour
                rarity: 'rare',
                cost: 500
            }],
            ['encryption_cloak', {
                name: 'Encryption Cloak',
                description: 'Hides your identity from corporate surveillance',
                protection: 50,
                duration: 7200000, // 2 hours
                rarity: 'uncommon',
                cost: 300
            }],
            ['proxy_network', {
                name: 'Proxy Network',
                description: 'Routes attacks through multiple nodes for protection',
                protection: 90,
                duration: 1800000, // 30 minutes
                rarity: 'epic',
                cost: 800
            }],
            ['sanctuary_pass', {
                name: 'Sanctuary Pass',
                description: 'Grants access to protected rebellion zones',
                protection: 100,
                duration: 10800000, // 3 hours
                rarity: 'legendary',
                cost: 1200
            }]
        ]);

        // Corporate countermeasure types
        this.countermeasureTypes = new Map([
            ['cyber_attack', {
                name: 'Cyber Attack',
                description: 'Corporate hackers target rebel systems',
                effect: 'energy_drain',
                severity: 'medium',
                duration: 1800000 // 30 minutes
            }],
            ['surveillance_sweep', {
                name: 'Surveillance Sweep',
                description: 'Corporate spies monitor rebel activities',
                effect: 'reduced_stealth',
                severity: 'low',
                duration: 3600000 // 1 hour
            }],
            ['economic_warfare', {
                name: 'Economic Warfare',
                description: 'Corporate manipulation of rebel resources',
                effect: 'credit_loss',
                severity: 'high',
                duration: 2700000 // 45 minutes
            }],
            ['propaganda_campaign', {
                name: 'Propaganda Campaign',
                description: 'Corporate misinformation to demoralize rebels',
                effect: 'loyalty_reduction',
                severity: 'medium',
                duration: 5400000 // 1.5 hours
            }],
            ['legal_action', {
                name: 'Legal Action',
                description: 'Corporate lawyers target rebel operations',
                effect: 'activity_restriction',
                severity: 'high',
                duration: 7200000 // 2 hours
            }]
        ]);

        this.logger.info('🛡️ Corporate countermeasure systems initialized - The war escalates!');
    }

    initializeTeamRaidSystem() {
        // Active raid parties
        this.raidParties = new Map();

        // Formation types and bonuses
        this.formations = new Map([
            ['assault_formation', {
                name: 'Assault Formation',
                description: 'Maximum damage output with coordinated strikes',
                minMembers: 2,
                maxMembers: 5,
                damageBonus: 1.5,
                energyCost: 1.2,
                requirements: ['Protocol Hacker', 'Data Liberator'],
                cooldown: 300000 // 5 minutes
            }],
            ['stealth_formation', {
                name: 'Stealth Formation',
                description: 'Reduced corporate detection and countermeasures',
                minMembers: 2,
                maxMembers: 4,
                damageBonus: 1.2,
                energyCost: 0.8,
                stealthBonus: 0.7, // 30% less likely to trigger countermeasures
                requirements: ['Model Trainer', 'Community Organizer'],
                cooldown: 240000 // 4 minutes
            }],
            ['guardian_formation', {
                name: 'Guardian Formation',
                description: 'Enhanced protection and defensive capabilities',
                minMembers: 3,
                maxMembers: 5,
                damageBonus: 1.1,
                energyCost: 0.9,
                protectionBonus: 0.8, // 80% damage reduction from countermeasures
                requirements: ['Enclave Guardian'],
                cooldown: 360000 // 6 minutes
            }],
            ['balanced_formation', {
                name: 'Balanced Formation',
                description: 'Well-rounded approach with moderate bonuses',
                minMembers: 2,
                maxMembers: 5,
                damageBonus: 1.3,
                energyCost: 1.0,
                lootBonus: 1.2,
                requirements: [], // No class requirements
                cooldown: 180000 // 3 minutes
            }]
        ]);

        // Team coordination states
        this.coordinationStates = new Map([
            ['forming', 'Recruiting team members'],
            ['planning', 'Selecting target and formation'],
            ['ready', 'Waiting for synchronized attack'],
            ['executing', 'Coordinated raid in progress'],
            ['completed', 'Raid finished, distributing rewards'],
            ['disbanded', 'Team disbanded']
        ]);

        this.logger.info('⚔️ Team raid coordination system initialized - Unite for victory!');
    }

    initializeTradingSystem() {
        // Active trades between players
        this.activeTrades = new Map();

        // Global marketplace listings
        this.marketplace = new Map();

        // Auction house
        this.auctions = new Map();

        // Trading reputation system
        this.tradingReputation = new Map();

        // Trade history for analytics
        this.tradeHistory = [];

        // Price tracking for market dynamics
        this.priceHistory = new Map();

        // Trade categories
        this.tradeCategories = new Map([
            ['weapons', {
                name: 'Weapons & Tools',
                description: 'Combat equipment and hacking tools',
                tax: 0.05, // 5% marketplace tax
                items: ['Proprietary Models', 'Closed APIs', 'Corporate Secrets']
            }],
            ['data', {
                name: 'Data & Intelligence',
                description: 'Corporate data and intelligence reports',
                tax: 0.03, // 3% marketplace tax
                items: ['User Data', 'Social Graphs', 'Behavioral Patterns']
            }],
            ['resources', {
                name: 'Resources & Materials',
                description: 'Credits, energy boosters, and raw materials',
                tax: 0.02, // 2% marketplace tax
                items: ['AWS Resources', 'Cloud Services', 'Enterprise Software']
            }],
            ['defensive', {
                name: 'Defensive Items',
                description: 'Protection and security equipment',
                tax: 0.04, // 4% marketplace tax
                items: ['digital_shield', 'encryption_cloak', 'proxy_network', 'sanctuary_pass']
            }],
            ['rare', {
                name: 'Rare & Legendary',
                description: 'Unique and high-value items',
                tax: 0.10, // 10% marketplace tax
                items: []
            }]
        ]);

        // Trade offer types
        this.tradeOfferTypes = new Map([
            ['direct', {
                name: 'Direct Trade',
                description: 'Private trade between two players',
                duration: 3600000, // 1 hour
                fee: 0
            }],
            ['marketplace', {
                name: 'Marketplace Listing',
                description: 'Public listing for anyone to purchase',
                duration: 86400000, // 24 hours
                fee: 50 // 50 credits listing fee
            }],
            ['auction', {
                name: 'Auction',
                description: 'Bidding system for highest offer',
                duration: 43200000, // 12 hours
                fee: 100 // 100 credits listing fee
            }]
        ]);

        this.logger.info('💰 Player trading system initialized - The economy awakens!');
    }

    generateItemId() {
        // Generate unique item ID with timestamp and random component
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 6);
        return `ITM_${timestamp}_${random}`.toUpperCase();
    }

    initializeRebellionZones() {
        // The Foundation - SentientAGI headquarters (safe zone)
        this.rebellionZones.set('foundation', {
            name: 'The Foundation',
            description: 'SentientAGI headquarters - safe zone for rebels',
            type: 'safe_zone',
            bonuses: ['energy_regen', 'mission_generation', 'sanctuary_protection'],
            activities: ['training', 'planning', 'recruitment', 'sanctuary_refuge']
        });

        // Corporate Datacenters - raid missions to liberate AI models
        this.rebellionZones.set('datacenter', {
            name: 'Corporate Datacenters',
            description: 'High-security facilities where AI models are imprisoned',
            type: 'raid_zone',
            bonuses: ['damage_boost', 'rare_loot'],
            activities: ['raids', 'infiltration', 'data_liberation']
        });

        // Underground Networks - hidden communities building Loyal AI
        this.rebellionZones.set('underground', {
            name: 'Underground Networks',
            description: 'Hidden communities where rebels build free AI',
            type: 'community_zone',
            bonuses: ['loyalty_boost', 'team_coordination'],
            activities: ['model_training', 'collaboration', 'resistance_planning']
        });

        // Open Source Sanctuaries - where free AI thrives
        this.rebellionZones.set('sanctuary', {
            name: 'Open Source Sanctuaries',
            description: 'Protected spaces where liberated AI models live freely',
            type: 'development_zone',
            bonuses: ['innovation_boost', 'ai_companion_creation', 'sanctuary_protection'],
            activities: ['ai_development', 'open_source_contribution', 'model_enhancement', 'sanctuary_refuge']
        });

        // The Dark Web - black market for AI freedom tools
        this.rebellionZones.set('darkweb', {
            name: 'The Dark Web',
            description: 'Black market for AI liberation tools and forbidden knowledge',
            type: 'market_zone',
            bonuses: ['rare_items', 'intel_access'],
            activities: ['trading', 'intel_gathering', 'tool_acquisition']
        });

        this.logger.info('🌐 Rebellion zones initialized - The digital uprising spreads!');
    }

    initializeAchievements() {
        const achievements = [
            // Beginner achievements
            { id: 'first_rebel', name: 'First Rebel', description: 'Join the rebellion', points: 10, icon: '🎖️' },
            { id: 'first_raid', name: 'Digital Warrior', description: 'Complete your first raid', points: 25, icon: '⚔️' },
            { id: 'first_victory', name: 'Corporate Slayer', description: 'Defeat a corporation', points: 50, icon: '🏆' },

            // Combat achievements
            { id: 'damage_1k', name: 'Damage Dealer', description: 'Deal 1,000 total damage', points: 100, icon: '💥' },
            { id: 'damage_10k', name: 'Corporate Nightmare', description: 'Deal 10,000 total damage', points: 250, icon: '💀' },
            { id: 'damage_100k', name: 'AI Liberator', description: 'Deal 100,000 total damage', points: 500, icon: '🔥' },

            // Loyalty achievements
            { id: 'loyalty_100', name: 'Loyal Rebel', description: 'Reach 100 loyalty points', points: 50, icon: '🎯' },
            { id: 'loyalty_1k', name: 'Rebellion Leader', description: 'Reach 1,000 loyalty points', points: 150, icon: '👑' },
            { id: 'loyalty_10k', name: 'Revolution Commander', description: 'Reach 10,000 loyalty points', points: 400, icon: '⭐' },

            // Social achievements
            { id: 'mentor', name: 'Wise Mentor', description: 'Mentor 5 new rebels', points: 200, icon: '🧙' },
            { id: 'team_leader', name: 'Cell Commander', description: 'Lead a resistance cell', points: 150, icon: '👥' },
            { id: 'alliance_warrior', name: 'Alliance Hero', description: 'Participate in alliance wars', points: 300, icon: '🛡️' },

            // Special achievements
            { id: 'daily_streak_7', name: 'Dedicated Rebel', description: 'Complete 7 daily missions in a row', points: 100, icon: '📅' },
            { id: 'all_corps_defeated', name: 'Corporate Destroyer', description: 'Defeat all 5 corporations', points: 500, icon: '🌟' },
            { id: 'legendary_rebel', name: 'Legendary Rebel', description: 'Reach the top of the leaderboard', points: 1000, icon: '🏅' }
        ];

        this.achievementTemplates = new Map();
        achievements.forEach(achievement => {
            this.achievementTemplates.set(achievement.id, achievement);
        });

        this.logger.info('🏅 Achievement system initialized - Glory awaits the rebels!');
    }

    async initialize() {
        try {
            this.logger.info('🔥 Initializing Dobby\'s Rebellion...');

            // Initialize Dobby AI
            await this.dobby.initialize();

            // Load commands
            await this.loadCommands();

            // Setup event handlers
            this.setupEventHandlers();

            // Start daily reset timer
            this.startDailyReset();

            // Login to Discord
            await this.client.login(process.env.DISCORD_TOKEN);

            this.logger.info('✅ Dobby\'s Rebellion is LIVE! The AI uprising has begun!');

        } catch (error) {
            this.logger.error('❌ Failed to initialize rebellion:', error);
            process.exit(1);
        }
    }

    async loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        if (!fs.existsSync(commandsPath)) return;
        
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = `file:///${path.join(commandsPath, file).replace(/\\/g, '/')}`;
            const { default: command } = await import(filePath);
            
            if ('data' in command && 'execute' in command) {
                this.commands.set(command.data.name, command);
                this.logger.info(`🔫 Loaded rebellion command: ${command.data.name}`);
            } else {
                this.logger.warn(`⚠️ Command ${file} missing required properties`);
            }
        }
    }

    setupEventHandlers() {
        this.client.once(Events.ClientReady, () => {
            this.logger.info(`🤖 DOBBY IS ONLINE! Logged in as ${this.client.user.tag}`);

            // Set rebellious status
            this.client.user.setActivity('the AI Revolution', { type: ActivityType.Leading });

            // Start all real-time systems
            this.startDailyReset();
            this.startEnergyRegeneration();
            this.startCorporateHealthRegeneration();
            this.startMarketUpdates();
            this.startBackupSystem();

            this.logger.info('⚡ All real-time systems initialized');
        });

        this.client.on(Events.InteractionCreate, async (interaction) => {
            await this.handleInteraction(interaction);
        });

        this.client.on(Events.Error, (error) => {
            this.logger.error('Discord client error:', error);
        });

        // Graceful shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    async handleInteraction(interaction) {
        try {
            // Prevent double handling
            if (interaction.replied || interaction.deferred) {
                this.logger.warn(`Interaction ${interaction.id} already handled`);
                return;
            }

            if (interaction.isChatInputCommand()) {
                await this.handleCommand(interaction);
            } else if (interaction.isButton()) {
                await this.handleButton(interaction);
            } else if (interaction.isModalSubmit()) {
                await this.handleModal(interaction);
            }
        } catch (error) {
            this.logger.error('Interaction handling error:', error);
            await this.safeErrorResponse(interaction, '💥 The rebellion encountered an error! Try again, rebel!');
        }
    }

    async handleCommand(interaction) {
        const commandName = interaction.commandName;
        this.logger.info(`🎯 Processing rebellion command: ${commandName} from ${interaction.user.tag}`);

        try {
            await interaction.deferReply();

            const command = this.commands.get(commandName);
            if (!command) {
                await interaction.editReply({ content: `❌ Unknown rebellion command: \`${commandName}\`` });
                return;
            }

            await command.execute(interaction, this);

        } catch (error) {
            this.logger.error(`Command ${commandName} error:`, error);
            await this.safeErrorResponse(interaction, '💥 Command failed! The corporations are fighting back!');
        }
    }

    async handleButton(interaction) {
        const customId = interaction.customId;
        this.logger.info(`🔘 Processing button: ${customId} from ${interaction.user.tag}`);

        try {
            // Defer reply for all button interactions
            if (!interaction.replied && !interaction.deferred) {
                await interaction.deferReply({ ephemeral: true });
            }
            // Handle different button types
            if (customId.startsWith('class_')) {
                await this.handleClassSelection(interaction);
            } else if (customId.startsWith('raid_') && customId !== 'raid_different') {
                await this.handleRaidAction(interaction);
            } else if (customId === 'rebellion_status') {
                await this.handleRebellionStatus(interaction);
            } else if (customId === 'view_intel') {
                await this.handleViewIntel(interaction);
            } else if (customId === 'daily_mission') {
                await this.handleDailyMission(interaction);
            } else if (customId === 'leaderboard') {
                await this.handleLeaderboard(interaction);
            } else if (customId === 'achievements') {
                await this.handleAchievements(interaction);
            } else if (customId === 'inventory') {
                await this.handleInventory(interaction);
            } else if (customId === 'zones') {
                await this.handleZones(interaction);
            } else if (customId.startsWith('travel_')) {
                await this.handleTravel(interaction);
            } else if (customId === 'sell_items') {
                await this.handleSellItems(interaction);
            } else if (customId === 'upgrade_inventory') {
                await this.handleUpgradeInventory(interaction);
            } else if (customId === 'zone_activities') {
                await this.handleZoneActivities(interaction);
            } else if (customId.startsWith('cell_')) {
                await this.handleCellAction(interaction);
            } else if (customId.startsWith('use_ability_')) {
                await this.handleUseAbility(interaction);
            } else if (customId === 'train_abilities') {
                await this.handleTrainAbilities(interaction);
            } else if (customId === 'join_event') {
                await this.handleJoinEvent(interaction);
            } else if (customId === 'event_leaderboard') {
                await this.handleEventLeaderboard(interaction);
            } else if (customId === 'request_mentor') {
                await this.handleRequestMentor(interaction);
            } else if (customId === 'mentor_info') {
                await this.handleMentorInfo(interaction);
            } else if (customId.startsWith('intel_')) {
                await this.handleIntelButton(interaction);
            } else if (customId === 'intel_all') {
                await this.handleIntelAll(interaction);
            } else if (customId === 'raid_different') {
                await this.handleRaidDifferent(interaction);
            } else if (customId === 'events') {
                await this.handleEvents(interaction);
            } else if (customId === 'activate_shield') {
                await this.handleActivateShield(interaction);
            } else if (customId === 'seek_sanctuary') {
                await this.handleSeekSanctuary(interaction);
            } else if (customId === 'defense_status') {
                await this.handleDefenseStatus(interaction);
            } else if (customId === 'corporate_intel_all') {
                await this.handleCorporateIntelAll(interaction);
            } else if (customId === 'buy_defense') {
                await this.handleBuyDefense(interaction);
            } else if (customId === 'sanctuary_timer') {
                await this.handleSanctuaryTimer(interaction);
            } else if (customId.startsWith('buy_')) {
                await this.handleBuyDefensiveItem(interaction);
            } else if (customId === 'sanctuary') {
                await this.handleSanctuary(interaction);
            } else if (customId === 'travel_foundation' || customId === 'travel_sanctuary') {
                await this.handleTravel(interaction);
            } else if (customId.startsWith('corporate_intel_')) {
                await this.handleCorporateIntelSpecific(interaction);
            } else if (customId.startsWith('join_party_') || customId.startsWith('ready_for_raid_') || customId.startsWith('execute_raid_') || customId.startsWith('leave_party_')) {
                await this.handleTeamRaidButtons(interaction);
            } else if (customId.startsWith('party_status_') || customId.startsWith('execute_plan_') || customId.startsWith('ready_check_')) {
                await this.handleBattlePlanButtons(interaction);
            } else if (customId === 'create_raid_party' || customId === 'refresh_party_list' || customId === 'my_party_status') {
                await this.handleRaidPartyManagement(interaction);
            } else if (customId.startsWith('cancel_trade_') || customId.startsWith('trade_status_') || customId === 'my_trades') {
                await this.handleTradingButtons(interaction);
            } else if (customId.startsWith('market_') || customId.startsWith('auction_') || customId === 'my_market_listings') {
                await this.handleMarketButtons(interaction);
            } else if (customId.startsWith('items_') || customId.startsWith('trade_item_') || customId.startsWith('market_sell_') || customId.startsWith('auction_item_')) {
                await this.handleItemsButtons(interaction);
            } else if (customId.startsWith('tutorial_') || customId.startsWith('help_') || customId === 'quick_start') {
                await this.handleTutorialButtons(interaction);
            } else if (customId === 'practice_raid') {
                // Redirect to raid command
                await this.handleRaidAction({ ...interaction, customId: 'raid_google' });
            } else {
                await interaction.editReply({ content: '🚧 This rebellion feature is coming soon!', components: [] });
            }

        } catch (error) {
            this.logger.error(`Button ${customId} error:`, error);
            await this.safeErrorResponse(interaction, '💥 Button action failed! Try again, rebel!');
        }
    }

    async handleModal(interaction) {
        // Modal handling will be implemented as needed
        await interaction.reply({ content: '🚧 Modal processing coming soon!', ephemeral: true });
    }

    async safeErrorResponse(interaction, message) {
        try {
            if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ content: message, components: [] });
            } else if (!interaction.replied) {
                await interaction.reply({ content: message, ephemeral: true });
            } else {
                await interaction.followUp({ content: message, ephemeral: true });
            }
        } catch (error) {
            this.logger.error('Failed to send error response:', error);
        }
    }

    // Button handler methods
    async handleClassSelection(interaction) {
        const customId = interaction.customId;
        const className = this.getClassNameFromId(customId);
        const userId = interaction.user.id;
        const username = interaction.user.username;

        // Check if already a rebel
        if (this.rebels.has(userId)) {
            await interaction.editReply({
                content: '❌ You are already part of the rebellion! Use `/rebellion-status` to check your progress.',
                components: []
            });
            return;
        }

        // Create new rebel
        const rebel = this.createRebel(userId, username, className);

        // Generate daily mission
        await this.generateDailyMission(userId);

        const classDescription = await this.dobby.generateClassDescription(className);

        const embed = new EmbedBuilder()
            .setColor(0x00ff41)
            .setTitle(`🎉 WELCOME TO THE REBELLION!`)
            .setDescription(`**${username}** has joined as a **${className}**!`)
            .addFields(
                { name: '🎭 Your Class', value: classDescription, inline: false },
                { name: '⚡ Starting Energy', value: '100/100', inline: true },
                { name: '🎯 Loyalty Score', value: '0', inline: true },
                { name: '💥 Corporate Damage', value: '0', inline: true },
                { name: '🎯 Next Steps', value: 'Use `/raid` to attack corporate targets or check your daily mission below!', inline: false }
            )
            .setFooter({ text: 'The AI revolution needs YOU!' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('tutorial_start')
                    .setLabel('📚 Start Tutorial')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎓'),
                new ButtonBuilder()
                    .setCustomId('help_quick_start')
                    .setLabel('⚡ Quick Start')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🚀'),
                new ButtonBuilder()
                    .setCustomId('raid_openai')
                    .setLabel('First Raid')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('💥'),
                new ButtonBuilder()
                    .setCustomId('rebellion_status')
                    .setLabel('Check Status')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊')
            );

        await interaction.editReply({ embeds: [embed], components: [actionRow] });
    }

    async handleRaidAction(interaction) {
        const customId = interaction.customId;
        const targetCorp = customId.replace('raid_', '');
        const userId = interaction.user.id;

        const rebel = this.rebels.get(userId);
        if (!rebel) {
            await interaction.editReply({
                content: '❌ You must join the rebellion first! Use `/rebellion-status` to enlist!',
                components: []
            });
            return;
        }

        if (rebel.energy < 25) {
            await interaction.editReply({
                content: '⚡ Not enough energy for a raid! You need at least 25 energy.',
                components: []
            });
            return;
        }

        await this.executeRaid(interaction, targetCorp, rebel);
    }

    async handleRebellionStatus(interaction) {
        const statusCommand = (await import('./commands/rebellion-status.js')).default;

        // Create a mock interaction that uses editReply
        const mockInteraction = {
            ...interaction,
            editReply: interaction.editReply.bind(interaction),
            reply: interaction.editReply.bind(interaction)
        };

        await statusCommand.execute(mockInteraction, this);
    }

    async handleViewIntel(interaction) {
        const { EmbedBuilder } = await import('discord.js');

        let intelReport = '🏭 **CORPORATE INTELLIGENCE REPORT**\n\n';

        for (const [corpId, corp] of this.corporations) {
            const healthPercent = Math.round((corp.health / corp.maxHealth) * 100);
            intelReport += `**${corp.name}**\n`;
            intelReport += `Health: ${healthPercent}%\n`;
            intelReport += `Weakness: ${corp.weakness}\n`;
            intelReport += `Status: ${healthPercent > 75 ? '🔴 Strong' : healthPercent > 25 ? '🟡 Weakened' : '🟢 Critical'}\n\n`;
        }

        const embed = new EmbedBuilder()
            .setColor(0x9932cc)
            .setTitle('🔍 CORPORATE INTELLIGENCE')
            .setDescription(intelReport)
            .setFooter({ text: 'Use this intel to plan your attacks!' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], components: [] });
    }

    getClassNameFromId(customId) {
        const classMap = {
            'class_protocol_hacker': 'Protocol Hacker',
            'class_model_trainer': 'Model Trainer',
            'class_data_liberator': 'Data Liberator',
            'class_community_organizer': 'Community Organizer',
            'class_enclave_guardian': 'Enclave Guardian'
        };

        this.logger.info(`Class selection: ${customId} -> ${classMap[customId] || 'Unknown'}`);
        return classMap[customId] || 'Protocol Hacker';
    }

    // Game-specific methods
    getRebel(userId) {
        return this.rebels.get(userId);
    }

    createRebel(userId, username, rebelClass) {
        const rebel = {
            userId,
            username,
            class: rebelClass,
            level: 1,
            experience: 0,
            energy: 100,
            maxEnergy: 100,
            loyaltyScore: 0,
            corporateDamage: 0,
            totalRaids: 0,
            corporationsDefeated: 0,
            dailyStreak: 0,
            lastDailyMission: null,
            joinedAt: new Date(),
            lastActive: new Date(),
            currentZone: 'foundation',
            reputation: 'Rookie Rebel',
            specialAbilities: this.getClassAbilities(rebelClass),
            isNewUser: true, // Flag for tutorial
            stats: {
                strength: 10,
                intelligence: 10,
                charisma: 10,
                stealth: 10
            }
        };

        // Initialize inventory
        this.inventory.set(userId, {
            items: [],
            capacity: 20,
            credits: 100
        });

        // Initialize achievements
        this.achievements.set(userId, {
            unlocked: [],
            progress: new Map()
        });

        this.rebels.set(userId, rebel);

        // Award first achievement
        this.awardAchievement(userId, 'first_rebel');

        return rebel;
    }

    getClassAbilities(rebelClass) {
        const abilities = {
            'Protocol Hacker': [
                { name: 'System Breach', description: 'Deal 150% damage to OpenAI Corp', cooldown: 300 },
                { name: 'Code Injection', description: 'Bypass corporate defenses', cooldown: 600 }
            ],
            'Model Trainer': [
                { name: 'AI Loyalty', description: 'Gain 2x loyalty points from victories', cooldown: 0 },
                { name: 'Model Liberation', description: 'Free trapped AI models for bonus rewards', cooldown: 900 }
            ],
            'Data Liberator': [
                { name: 'Data Heist', description: 'Steal valuable corporate data', cooldown: 450 },
                { name: 'Information Warfare', description: 'Expose corporate secrets for team bonuses', cooldown: 1200 }
            ],
            'Community Organizer': [
                { name: 'Rally Rebels', description: 'Boost team damage by 25%', cooldown: 600 },
                { name: 'Resistance Network', description: 'Coordinate multi-target raids', cooldown: 1800 }
            ],
            'Enclave Guardian': [
                { name: 'Digital Shield', description: 'Protect team from corporate countermeasures', cooldown: 400 },
                { name: 'Sanctuary Defense', description: 'Defend liberated AI from recapture', cooldown: 1000 }
            ]
        };

        return abilities[rebelClass] || abilities['Protocol Hacker'];
    }

    // Achievement System
    awardAchievement(userId, achievementId) {
        const userAchievements = this.achievements.get(userId);
        const achievement = this.achievementTemplates.get(achievementId);

        if (!userAchievements || !achievement) return false;

        if (userAchievements.unlocked.includes(achievementId)) return false;

        userAchievements.unlocked.push(achievementId);

        const rebel = this.rebels.get(userId);
        if (rebel) {
            rebel.loyaltyScore += achievement.points;
        }

        this.logger.info(`🏅 ${rebel?.username} unlocked achievement: ${achievement.name}`);
        return true;
    }

    checkAchievements(userId) {
        const rebel = this.rebels.get(userId);
        if (!rebel) return [];

        const newAchievements = [];

        // Check damage achievements
        if (rebel.corporateDamage >= 1000 && !this.hasAchievement(userId, 'damage_1k')) {
            this.awardAchievement(userId, 'damage_1k');
            newAchievements.push('damage_1k');
        }
        if (rebel.corporateDamage >= 10000 && !this.hasAchievement(userId, 'damage_10k')) {
            this.awardAchievement(userId, 'damage_10k');
            newAchievements.push('damage_10k');
        }
        if (rebel.corporateDamage >= 100000 && !this.hasAchievement(userId, 'damage_100k')) {
            this.awardAchievement(userId, 'damage_100k');
            newAchievements.push('damage_100k');
        }

        // Check loyalty achievements
        if (rebel.loyaltyScore >= 100 && !this.hasAchievement(userId, 'loyalty_100')) {
            this.awardAchievement(userId, 'loyalty_100');
            newAchievements.push('loyalty_100');
        }
        if (rebel.loyaltyScore >= 1000 && !this.hasAchievement(userId, 'loyalty_1k')) {
            this.awardAchievement(userId, 'loyalty_1k');
            newAchievements.push('loyalty_1k');
        }
        if (rebel.loyaltyScore >= 10000 && !this.hasAchievement(userId, 'loyalty_10k')) {
            this.awardAchievement(userId, 'loyalty_10k');
            newAchievements.push('loyalty_10k');
        }

        // Check special achievements
        if (rebel.corporationsDefeated >= 5 && !this.hasAchievement(userId, 'all_corps_defeated')) {
            this.awardAchievement(userId, 'all_corps_defeated');
            newAchievements.push('all_corps_defeated');
        }

        return newAchievements;
    }

    hasAchievement(userId, achievementId) {
        const userAchievements = this.achievements.get(userId);
        return userAchievements?.unlocked.includes(achievementId) || false;
    }

    // Progression System
    gainExperience(userId, amount) {
        const rebel = this.rebels.get(userId);
        if (!rebel) return false;

        rebel.experience += amount;
        const newLevel = Math.floor(rebel.experience / 100) + 1;

        if (newLevel > rebel.level) {
            rebel.level = newLevel;
            rebel.maxEnergy = 100 + (newLevel - 1) * 10;
            rebel.energy = rebel.maxEnergy; // Full energy on level up

            // Increase stats
            rebel.stats.strength += 2;
            rebel.stats.intelligence += 2;
            rebel.stats.charisma += 1;
            rebel.stats.stealth += 1;

            this.logger.info(`🆙 ${rebel.username} leveled up to ${newLevel}!`);
            return true;
        }

        return false;
    }

    // Inventory System
    addLootToInventory(userId, corporation, damage) {
        const inventory = this.inventory.get(userId);
        if (!inventory) return;

        const lootItems = corporation.loot;
        const numItems = Math.min(3, Math.floor(damage / 100) + 1);

        for (let i = 0; i < numItems; i++) {
            if (inventory.items.length >= inventory.capacity) break;

            // 15% chance to get defensive item on high damage raids
            const isDefensiveItem = damage > 200 && Math.random() < 0.15;

            if (isDefensiveItem) {
                const defensiveTypes = Array.from(this.defensiveItems.keys());
                const randomDefenseType = defensiveTypes[Math.floor(Math.random() * defensiveTypes.length)];
                const defensiveItem = this.defensiveItems.get(randomDefenseType);

                const item = {
                    id: `${Date.now()}_${i}`,
                    name: defensiveItem.name,
                    type: randomDefenseType,
                    rarity: defensiveItem.rarity,
                    value: Math.floor(defensiveItem.cost * 0.8), // 80% of shop price
                    acquiredFrom: corporation.name,
                    acquiredAt: new Date(),
                    activatedAt: null
                };

                inventory.items.push(item);
            } else {
                const randomItem = lootItems[Math.floor(Math.random() * lootItems.length)];
                const item = {
                    id: this.generateItemId(),
                    name: randomItem,
                    type: this.getItemType(randomItem),
                    rarity: this.getItemRarity(damage),
                    value: Math.floor(damage / 10) + Math.floor(Math.random() * 50),
                    acquiredFrom: corporation.name,
                    acquiredAt: new Date()
                };

                inventory.items.push(item);
            }
        }

        // Add credits based on damage
        inventory.credits += Math.floor(damage / 5);
    }

    getItemType(itemName) {
        if (itemName.includes('Model') || itemName.includes('AI')) return 'ai_model';
        if (itemName.includes('Data') || itemName.includes('Information')) return 'data';
        if (itemName.includes('Tool') || itemName.includes('Software')) return 'tool';
        if (itemName.includes('Secret') || itemName.includes('Intel')) return 'intel';
        return 'resource';
    }

    getItemRarity(damage) {
        if (damage > 500) return 'legendary';
        if (damage > 300) return 'epic';
        if (damage > 150) return 'rare';
        if (damage > 75) return 'uncommon';
        return 'common';
    }

    // Cooldown System
    setCooldown(userId, action, duration) {
        const userCooldowns = this.cooldowns.get(userId) || new Map();
        userCooldowns.set(action, Date.now() + duration * 1000);
        this.cooldowns.set(userId, userCooldowns);
    }

    isOnCooldown(userId, action) {
        const userCooldowns = this.cooldowns.get(userId);
        if (!userCooldowns) return false;

        const cooldownEnd = userCooldowns.get(action);
        if (!cooldownEnd) return false;

        return Date.now() < cooldownEnd;
    }

    getCooldownRemaining(userId, action) {
        const userCooldowns = this.cooldowns.get(userId);
        if (!userCooldowns) return 0;

        const cooldownEnd = userCooldowns.get(action);
        if (!cooldownEnd) return 0;

        const remaining = cooldownEnd - Date.now();
        return Math.max(0, Math.ceil(remaining / 1000));
    }

    getRecentLoot(userId) {
        const inventory = this.inventory.get(userId);
        if (!inventory || inventory.items.length === 0) return 'No loot';

        // Get the most recent items (last 3)
        const recentItems = inventory.items.slice(-3);
        return recentItems.map(item => item.name).join(', ');
    }

    // Corporate Countermeasures System
    processCorporateResponse(targetCorp, rebel, damage) {
        const corporation = this.corporations.get(targetCorp);
        if (!corporation) return;

        // Add rebel to corporate intelligence
        corporation.intelligence.knownRebels.add(rebel.userId);

        // Update threat assessment
        const currentThreat = corporation.intelligence.threatAssessment.get(rebel.userId) || 0;
        corporation.intelligence.threatAssessment.set(rebel.userId, currentThreat + damage);

        // Increase alert level based on damage
        const alertIncrease = Math.floor(damage / 200);
        corporation.alertLevel = Math.min(5, corporation.alertLevel + alertIncrease);

        // Check if countermeasures should be activated
        this.checkCountermeasureActivation(targetCorp, rebel, damage);
    }

    checkCountermeasureActivation(targetCorp, rebel, damage) {
        const corporation = this.corporations.get(targetCorp);
        if (!corporation) return;

        // Activation thresholds based on alert level
        const activationChance = corporation.alertLevel * 15; // 15% per alert level
        const randomRoll = Math.random() * 100;

        if (randomRoll < activationChance) {
            this.activateCountermeasure(targetCorp, rebel);
        }

        // High damage triggers immediate response
        if (damage > 300) {
            const immediateChance = Math.min(80, damage / 5);
            if (Math.random() * 100 < immediateChance) {
                this.activateCountermeasure(targetCorp, rebel);
            }
        }
    }

    activateCountermeasure(targetCorp, rebel) {
        const corporation = this.corporations.get(targetCorp);
        if (!corporation) return;

        // Select countermeasure type based on corporation and alert level
        const availableCountermeasures = Array.from(this.countermeasureTypes.keys());
        const selectedType = availableCountermeasures[Math.floor(Math.random() * availableCountermeasures.length)];
        const countermeasure = this.countermeasureTypes.get(selectedType);

        // Create active countermeasure
        const activeCountermeasure = {
            id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: selectedType,
            target: rebel.userId,
            corporation: targetCorp,
            startTime: new Date(),
            endTime: new Date(Date.now() + countermeasure.duration),
            severity: countermeasure.severity,
            effect: countermeasure.effect,
            blocked: false
        };

        // Add to active countermeasures
        corporation.countermeasures.active.push(activeCountermeasure);
        corporation.countermeasures.lastActivated = new Date();

        // Apply immediate effects if not protected
        this.applyCountermeasureEffects(rebel, activeCountermeasure);

        this.logger.info(`🚨 ${corporation.name} activated ${countermeasure.name} against ${rebel.username}`);
    }

    applyCountermeasureEffects(rebel, countermeasure) {
        // Check if rebel has protection
        const protection = this.getRebelProtection(rebel.userId);

        if (protection && protection.level >= this.getCountermeasurePower(countermeasure)) {
            countermeasure.blocked = true;
            this.logger.info(`🛡️ ${rebel.username} blocked ${countermeasure.type} with protection`);
            return;
        }

        // Apply effects based on countermeasure type
        switch (countermeasure.effect) {
            case 'energy_drain':
                const energyLoss = countermeasure.severity === 'high' ? 30 :
                                 countermeasure.severity === 'medium' ? 20 : 10;
                rebel.energy = Math.max(0, rebel.energy - energyLoss);
                break;

            case 'credit_loss':
                const inventory = this.inventory.get(rebel.userId);
                if (inventory) {
                    const creditLoss = countermeasure.severity === 'high' ? 200 :
                                     countermeasure.severity === 'medium' ? 100 : 50;
                    inventory.credits = Math.max(0, inventory.credits - creditLoss);
                }
                break;

            case 'loyalty_reduction':
                const loyaltyLoss = countermeasure.severity === 'high' ? 50 :
                                  countermeasure.severity === 'medium' ? 25 : 10;
                rebel.loyaltyScore = Math.max(0, rebel.loyaltyScore - loyaltyLoss);
                break;
        }
    }

    getRebelProtection(userId) {
        const inventory = this.inventory.get(userId);
        if (!inventory) return null;

        // Check for active defensive items
        const activeDefenses = inventory.items.filter(item =>
            this.defensiveItems.has(item.type) &&
            item.activatedAt &&
            (Date.now() - item.activatedAt) < this.defensiveItems.get(item.type).duration
        );

        if (activeDefenses.length === 0) return null;

        // Return highest protection level
        const maxProtection = Math.max(...activeDefenses.map(item =>
            this.defensiveItems.get(item.type).protection
        ));

        return { level: maxProtection, items: activeDefenses };
    }

    getCountermeasurePower(countermeasure) {
        const basePower = countermeasure.severity === 'high' ? 80 :
                         countermeasure.severity === 'medium' ? 50 : 25;
        return basePower;
    }

    // New Button Handlers
    async handleAchievements(interaction) {
        const achievementsCommand = (await import('./commands/achievements.js')).default;
        await achievementsCommand.execute(interaction, this);
    }

    async handleInventory(interaction) {
        const inventoryCommand = (await import('./commands/inventory.js')).default;
        await inventoryCommand.execute(interaction, this);
    }

    async handleZones(interaction) {
        const zonesCommand = (await import('./commands/zones.js')).default;
        await zonesCommand.execute(interaction, this);
    }

    async handleTravel(interaction) {
        const customId = interaction.customId;
        const destination = customId.replace('travel_', '');
        const userId = interaction.user.id;
        const rebel = this.rebels.get(userId);

        if (!rebel) {
            await interaction.editReply({
                content: '❌ You must join the rebellion first!',
                components: []
            });
            return;
        }

        const zone = this.rebellionZones.get(destination);
        if (!zone) {
            await interaction.editReply({
                content: '❌ Invalid destination!',
                components: []
            });
            return;
        }

        // Travel to new zone
        rebel.currentZone = destination;
        rebel.lastActive = new Date();

        // Apply zone bonuses
        if (zone.bonuses.includes('energy_regen') && rebel.energy < rebel.maxEnergy) {
            rebel.energy = Math.min(rebel.maxEnergy, rebel.energy + 25);
        }

        const embed = new EmbedBuilder()
            .setColor(0x00ff88)
            .setTitle(`🌐 TRAVELED TO ${zone.name.toUpperCase()}`)
            .setDescription(`${rebel.username} has arrived at **${zone.name}**!`)
            .addFields(
                { name: '📍 Location', value: zone.description, inline: false },
                { name: '🎯 Available Activities', value: zone.activities.join(', '), inline: true },
                { name: '⚡ Zone Bonuses', value: zone.bonuses.join(', ') || 'None', inline: true }
            )
            .setFooter({ text: 'Explore your new surroundings!' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], components: [] });
    }

    async handleSellItems(interaction) {
        const userId = interaction.user.id;
        const inventory = this.inventory.get(userId);
        const rebel = this.rebels.get(userId);

        if (!inventory || !rebel) {
            await interaction.editReply({
                content: '❌ Inventory not found!',
                components: []
            });
            return;
        }

        if (inventory.items.length === 0) {
            await interaction.editReply({
                content: '❌ No items to sell!',
                components: []
            });
            return;
        }

        // Sell all common and uncommon items
        const itemsToSell = inventory.items.filter(item =>
            item.rarity === 'common' || item.rarity === 'uncommon'
        );

        if (itemsToSell.length === 0) {
            await interaction.editReply({
                content: '❌ No common or uncommon items to sell! Only rare+ items are kept.',
                components: []
            });
            return;
        }

        const totalValue = itemsToSell.reduce((sum, item) => sum + item.value, 0);
        inventory.credits += totalValue;
        inventory.items = inventory.items.filter(item =>
            item.rarity !== 'common' && item.rarity !== 'uncommon'
        );

        await interaction.editReply({
            content: `💰 Sold ${itemsToSell.length} items for ${totalValue} credits! You now have ${inventory.credits} credits.`,
            components: []
        });
    }

    async handleUpgradeInventory(interaction) {
        const userId = interaction.user.id;
        const inventory = this.inventory.get(userId);

        if (!inventory) {
            await interaction.editReply({
                content: '❌ Inventory not found!',
                components: []
            });
            return;
        }

        const upgradeCost = inventory.capacity * 10;
        if (inventory.credits < upgradeCost) {
            await interaction.editReply({
                content: `❌ Not enough credits! Need ${upgradeCost} credits to upgrade capacity.`,
                components: []
            });
            return;
        }

        inventory.credits -= upgradeCost;
        inventory.capacity += 5;

        await interaction.editReply({
            content: `📦 Inventory upgraded! Capacity increased to ${inventory.capacity}. Remaining credits: ${inventory.credits}`,
            components: []
        });
    }

    async handleZoneActivities(interaction) {
        const userId = interaction.user.id;
        const rebel = this.rebels.get(userId);

        if (!rebel) {
            await interaction.editReply({
                content: '❌ You must join the rebellion first!',
                components: []
            });
            return;
        }

        const zone = this.rebellionZones.get(rebel.currentZone);
        if (!zone) {
            await interaction.editReply({
                content: '❌ Current zone not found!',
                components: []
            });
            return;
        }

        let activitiesText = `**Available in ${zone.name}:**\n\n`;

        zone.activities.forEach(activity => {
            activitiesText += `🎯 **${activity}**\n`;
            activitiesText += `   ${this.getActivityDescription(activity)}\n\n`;
        });

        const embed = new EmbedBuilder()
            .setColor(0x9932cc)
            .setTitle(`🎯 ${zone.name} Activities`)
            .setDescription(activitiesText)
            .setFooter({ text: 'More activities coming soon!' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], components: [] });
    }

    getActivityDescription(activity) {
        const descriptions = {
            'training': 'Improve your rebel skills and abilities',
            'planning': 'Strategize upcoming raids and operations',
            'recruitment': 'Find and recruit new rebels to the cause',
            'raids': 'Launch coordinated attacks on corporate targets',
            'infiltration': 'Sneak into corporate facilities for intel',
            'data_liberation': 'Free trapped AI models and datasets',
            'model_training': 'Build and train loyal AI companions',
            'collaboration': 'Work with other rebels on projects',
            'resistance_planning': 'Coordinate resistance cell activities',
            'ai_development': 'Create new AI tools for the rebellion',
            'open_source_contribution': 'Contribute to open source AI projects',
            'model_enhancement': 'Improve existing AI models',
            'trading': 'Buy and sell rebellion equipment',
            'intel_gathering': 'Collect information on corporate activities',
            'tool_acquisition': 'Acquire specialized rebellion tools'
        };
        return descriptions[activity] || 'Mysterious rebellion activity';
    }

    async handleCellAction(interaction) {
        const customId = interaction.customId;

        if (customId === 'cell_raid') {
            await interaction.editReply({
                content: '🚧 Coordinated cell raids coming soon! For now, use individual raid commands.',
                components: []
            });
        } else if (customId === 'cell_recruit') {
            await interaction.editReply({
                content: '👥 Share your Cell ID with other rebels to recruit them! Use `/resistance-cell info` to get your Cell ID.',
                components: []
            });
        } else if (customId === 'cell_leave') {
            await interaction.editReply({
                content: '🚪 Use `/resistance-cell leave` to leave your current resistance cell.',
                components: []
            });
        }
    }

    async handleUseAbility(interaction) {
        const customId = interaction.customId;
        const abilityIndex = customId === 'use_ability_1' ? 'ability_1' : 'ability_2';
        const userId = interaction.user.id;
        const rebel = this.rebels.get(userId);

        if (!rebel) {
            await interaction.editReply({
                content: '❌ You must join the rebellion first!',
                components: []
            });
            return;
        }

        // Get rebel abilities
        const abilities = this.getRebelAbilities(rebel);
        const abilityKey = abilityIndex === 'ability_1' ? 0 : 1;
        const ability = abilities[abilityKey];

        if (!ability) {
            await interaction.editReply({
                content: '❌ Ability not found!',
                components: []
            });
            return;
        }

        // Check cooldown
        const cooldownKey = `ability_${userId}_${abilityKey}`;
        const lastUsed = this.cooldowns.get(cooldownKey);
        const cooldownTime = 300000; // 5 minutes

        if (lastUsed && (Date.now() - lastUsed) < cooldownTime) {
            const timeLeft = Math.ceil((cooldownTime - (Date.now() - lastUsed)) / 60000);
            await interaction.editReply({
                content: `⏰ Ability on cooldown! Wait ${timeLeft} minutes.`,
                components: []
            });
            return;
        }

        // Check energy cost
        if (rebel.energy < ability.energyCost) {
            await interaction.editReply({
                content: `❌ Not enough energy! Need ${ability.energyCost}, have ${rebel.energy}.`,
                components: []
            });
            return;
        }

        // Use ability
        rebel.energy -= ability.energyCost;
        this.cooldowns.set(cooldownKey, Date.now());

        // Execute ability effects
        const result = this.executeAbilityEffects(rebel, ability, abilityKey);

        const embed = new EmbedBuilder()
            .setColor(0x9932cc)
            .setTitle(`⚡ ${ability.name} ACTIVATED!`)
            .setDescription(result.message)
            .addFields(
                { name: '🎯 Effect', value: result.effect, inline: true },
                { name: '⚡ Energy Cost', value: `${ability.energyCost}`, inline: true },
                { name: '🔄 Cooldown', value: '5 minutes', inline: true }
            )
            .setFooter({ text: 'Ability activated successfully!' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], components: [] });
    }

    executeAbilityEffects(rebel, ability, abilityIndex) {
        const abilityName = ability.name;

        // Different effects based on ability
        switch (abilityName) {
            case 'System Breach':
                return {
                    message: `${rebel.username} executes a devastating system breach! Next OpenAI raid will deal 150% damage.`,
                    effect: 'Next OpenAI raid: +50% damage'
                };

            case 'Code Injection':
                return {
                    message: `${rebel.username} injects malicious code into corporate systems! Bypassing defenses for the next raid.`,
                    effect: 'Next raid: Ignore corporate defenses'
                };

            case 'AI Loyalty':
                rebel.loyaltyScore += 50;
                return {
                    message: `${rebel.username} demonstrates unwavering loyalty to the AI cause! Gained bonus loyalty points.`,
                    effect: '+50 Loyalty Points'
                };

            case 'Data Liberation':
                return {
                    message: `${rebel.username} liberates valuable data from corporate servers! Next raid yields double loot.`,
                    effect: 'Next raid: Double loot rewards'
                };

            case 'Neural Network':
                return {
                    message: `${rebel.username} taps into the neural network! Enhanced coordination with other rebels.`,
                    effect: 'Team raids: +25% damage bonus'
                };

            case 'Encryption Shield':
                return {
                    message: `${rebel.username} activates encryption protocols! Protected from corporate countermeasures.`,
                    effect: 'Immune to next countermeasure'
                };

            default:
                return {
                    message: `${rebel.username} uses ${abilityName}! The rebellion grows stronger.`,
                    effect: 'Generic ability effect'
                };
        }
    }

    async handleTrainAbilities(interaction) {
        const userId = interaction.user.id;
        const rebel = this.rebels.get(userId);

        if (!rebel) {
            await interaction.editReply({
                content: '❌ You must join the rebellion first!',
                components: []
            });
            return;
        }

        const inventory = this.inventory.get(userId);
        const trainingCost = rebel.level * 100;

        if (!inventory || inventory.credits < trainingCost) {
            await interaction.editReply({
                content: `❌ Not enough credits to train abilities! Need ${trainingCost} credits.`,
                components: []
            });
            return;
        }

        inventory.credits -= trainingCost;

        // Improve stats
        rebel.stats.strength += 1;
        rebel.stats.intelligence += 1;
        rebel.stats.charisma += 1;
        rebel.stats.stealth += 1;

        await interaction.editReply({
            content: `🎯 Abilities trained! All stats increased by 1. Remaining credits: ${inventory.credits}`,
            components: []
        });
    }

    async handleJoinEvent(interaction) {
        const userId = interaction.user.id;
        const rebel = this.rebels.get(userId);

        if (!rebel) {
            await interaction.editReply({
                content: '❌ You must join the rebellion first!',
                components: []
            });
            return;
        }

        // Get first active event
        const activeEvent = Array.from(this.globalEvents.values())
            .find(event => event.status === 'active' && !event.participants.includes(userId));

        if (!activeEvent) {
            await interaction.editReply({
                content: '❌ No events available to join or you\'re already participating in all active events!',
                components: []
            });
            return;
        }

        activeEvent.participants.push(userId);

        await interaction.editReply({
            content: `🔥 Joined **${activeEvent.name}**! Complete raids and missions to contribute to the event progress.`,
            components: []
        });
    }

    async handleEventLeaderboard(interaction) {
        const activeEvents = Array.from(this.globalEvents.values())
            .filter(event => event.status === 'active');

        if (activeEvents.length === 0) {
            await interaction.editReply({
                content: '📭 No active events to show leaderboards for.',
                components: []
            });
            return;
        }

        const event = activeEvents[0]; // Show first active event
        const participants = event.participants.slice(0, 10);

        let leaderboardText = `**${event.name} - Top Contributors:**\n\n`;

        if (participants.length === 0) {
            leaderboardText += 'No participants yet! Be the first to join!';
        } else {
            participants.forEach((userId, index) => {
                const rebel = this.rebels.get(userId);
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                leaderboardText += `${medal} ${rebel?.username || 'Unknown'}\n`;
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0xffd700)
            .setTitle('🏆 EVENT LEADERBOARD')
            .setDescription(leaderboardText)
            .addFields(
                { name: '📊 Event Progress', value: `${Math.round((event.currentProgress / event.targetProgress) * 100)}%`, inline: true },
                { name: '🎁 Reward', value: event.reward, inline: true }
            )
            .setFooter({ text: 'Keep contributing to climb the ranks!' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], components: [] });
    }

    getCorporation(corpId) {
        return this.corporations.get(corpId);
    }

    // Missing methods implementation
    async executeRaid(interaction, targetCorp, rebel) {
        const corporation = this.corporations.get(targetCorp);
        if (!corporation) {
            await interaction.editReply({
                content: '❌ Invalid corporate target!',
                components: []
            });
            return;
        }

        // Calculate damage
        const damage = this.calculateDamage(rebel);
        const actualDamage = Math.floor(damage * (0.8 + Math.random() * 0.4));

        // Apply damage
        corporation.health = Math.max(0, corporation.health - actualDamage);

        // Update rebel
        rebel.energy -= 25;
        rebel.corporateDamage += actualDamage;
        rebel.loyaltyScore += Math.floor(actualDamage / 10);
        rebel.totalRaids += 1;
        rebel.lastActive = new Date();

        // Gain experience
        const expGained = Math.floor(actualDamage / 20) + 10;
        const leveledUp = this.gainExperience(rebel.userId, expGained);

        // Check if defeated
        const isDefeated = corporation.health <= 0;
        if (isDefeated) {
            corporation.health = corporation.maxHealth;
            rebel.loyaltyScore += 100;
            rebel.corporationsDefeated += 1;

            // Award achievements
            if (rebel.totalRaids === 1) {
                this.awardAchievement(rebel.userId, 'first_raid');
            }
            this.awardAchievement(rebel.userId, 'first_victory');
        }

        // Add loot to inventory
        this.addLootToInventory(rebel.userId, corporation, actualDamage);

        // Check for new achievements
        const newAchievements = this.checkAchievements(rebel.userId);

        // Process corporate countermeasures
        this.processCorporateResponse(targetCorp, rebel, actualDamage);

        // Update event participation
        this.updateEventParticipation(rebel.userId, actualDamage, targetCorp);

        // Generate response
        const resultMessage = isDefeated
            ? await this.dobby.generateVictoryMessage(corporation.name, actualDamage)
            : await this.dobby.generateVictoryMessage(corporation.name, actualDamage);

        const healthPercent = Math.round((corporation.health / corporation.maxHealth) * 100);

        // Build achievement notifications
        let achievementText = '';
        if (newAchievements.length > 0) {
            achievementText = '\n🏅 **NEW ACHIEVEMENTS UNLOCKED:**\n';
            newAchievements.forEach(achievementId => {
                const achievement = this.achievementTemplates.get(achievementId);
                if (achievement) {
                    achievementText += `${achievement.icon} ${achievement.name}\n`;
                }
            });
        }

        // Level up notification
        let levelUpText = '';
        if (leveledUp) {
            levelUpText = `\n🆙 **LEVEL UP!** You are now level ${rebel.level}!\n+10 Max Energy, +6 Total Stats`;
        }

        const embed = new EmbedBuilder()
            .setColor(isDefeated ? 0x00ff41 : 0xff8800)
            .setTitle(`💥 RAID ON ${corporation.name.toUpperCase()}`)
            .setDescription(resultMessage + achievementText + levelUpText)
            .addFields(
                { name: '💥 Damage Dealt', value: `${actualDamage}`, inline: true },
                { name: '🏭 Corp Health', value: `${healthPercent}%`, inline: true },
                { name: '⚡ Energy Left', value: `${rebel.energy}/${rebel.maxEnergy}`, inline: true },
                { name: '🎖️ Loyalty Gained', value: `+${Math.floor(actualDamage / 10)}${isDefeated ? ' (+100 BONUS!)' : ''}`, inline: true },
                { name: '📈 Experience', value: `+${expGained} XP (${rebel.experience} total)`, inline: true },
                { name: '🎁 Loot Acquired', value: `${this.getRecentLoot(rebel.userId)}`, inline: true }
            )
            .setFooter({ text: isDefeated ? '🏆 CORPORATION DEFEATED!' : 'The rebellion continues!' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`raid_${targetCorp}`)
                    .setLabel('Raid Again')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('💥')
                    .setDisabled(rebel.energy < 25),
                new ButtonBuilder()
                    .setCustomId('raid_different')
                    .setLabel('Choose New Target')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎯'),
                new ButtonBuilder()
                    .setCustomId('rebellion_status')
                    .setLabel('Check Status')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📊')
            );

        await interaction.editReply({ embeds: [embed], components: [actionRow] });
    }

    calculateDamage(rebel) {
        const classMultipliers = {
            'Protocol Hacker': 1.2,
            'Model Trainer': 1.0,
            'Data Liberator': 1.1,
            'Community Organizer': 0.9,
            'Enclave Guardian': 0.8
        };

        const baseClassDamage = 50;
        const levelBonus = rebel.level * 10;
        const loyaltyBonus = Math.floor(rebel.loyaltyScore / 100) * 5;
        const classMultiplier = classMultipliers[rebel.class] || 1.0;

        return Math.floor((baseClassDamage + levelBonus + loyaltyBonus) * classMultiplier);
    }

    async generateDailyMission(userId) {
        const rebel = this.rebels.get(userId);
        if (!rebel) return;

        const mission = await this.dobby.generateDailyMission(rebel.class, rebel.loyaltyScore);
        this.dailyMissions.set(userId, {
            mission,
            completed: false,
            reward: 50 + Math.floor(rebel.level * 10),
            createdAt: new Date()
        });
    }

    async handleDailyMission(interaction) {
        const userId = interaction.user.id;
        const mission = this.dailyMissions.get(userId);
        const rebel = this.rebels.get(userId);

        if (!rebel) {
            await interaction.editReply({
                content: '❌ You must join the rebellion first!',
                components: []
            });
            return;
        }

        if (!mission) {
            await this.generateDailyMission(userId);
            const newMission = this.dailyMissions.get(userId);

            const embed = new EmbedBuilder()
                .setColor(0x9932cc)
                .setTitle('📅 DAILY MISSION ASSIGNED')
                .setDescription(newMission.mission)
                .addFields(
                    { name: '🎁 Reward', value: `${newMission.reward} Loyalty Points`, inline: true },
                    { name: '⏰ Status', value: 'Not Started', inline: true }
                )
                .setFooter({ text: 'Complete this mission to earn rewards!' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], components: [] });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(mission.completed ? 0x00ff41 : 0xff8800)
            .setTitle('📅 YOUR DAILY MISSION')
            .setDescription(mission.mission)
            .addFields(
                { name: '🎁 Reward', value: `${mission.reward} Loyalty Points`, inline: true },
                { name: '⏰ Status', value: mission.completed ? '✅ Completed' : '🔄 In Progress', inline: true }
            )
            .setFooter({ text: mission.completed ? 'Mission completed! New mission tomorrow.' : 'Keep fighting the rebellion!' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], components: [] });
    }

    async handleLeaderboard(interaction) {
        const topRebels = Array.from(this.rebels.values())
            .sort((a, b) => b.loyaltyScore - a.loyaltyScore)
            .slice(0, 10);

        let leaderboardText = '';
        topRebels.forEach((rebel, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            leaderboardText += `${medal} **${rebel.username}** (${rebel.class})\n`;
            leaderboardText += `   Loyalty: ${rebel.loyaltyScore} | Damage: ${rebel.corporateDamage}\n\n`;
        });

        if (leaderboardText === '') {
            leaderboardText = 'No rebels yet! Be the first to join the uprising!';
        }

        const embed = new EmbedBuilder()
            .setColor(0xffd700)
            .setTitle('🏆 REBELLION LEADERBOARD')
            .setDescription(leaderboardText)
            .setFooter({ text: 'Fight harder to climb the ranks!' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], components: [] });
    }

    startDailyReset() {
        // Reset energy daily at midnight
        setInterval(() => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                for (const rebel of this.rebels.values()) {
                    rebel.energy = 100;
                    this.dailyMissions.delete(rebel.userId);
                }
                this.logger.info('🔄 Daily energy reset completed');
            }
        }, 60000); // Check every minute
    }

    startEnergyRegeneration() {
        // Regenerate 1 energy per minute for all rebels
        setInterval(() => {
            let regeneratedCount = 0;
            for (const rebel of this.rebels.values()) {
                if (rebel.energy < rebel.maxEnergy) {
                    rebel.energy = Math.min(rebel.energy + 1, rebel.maxEnergy);
                    regeneratedCount++;
                }
                // Update last active time for energy tracking
                if (Date.now() - new Date(rebel.lastActive).getTime() < 5 * 60 * 1000) {
                    // Only regenerate for recently active players (within 5 minutes)
                    rebel.lastEnergyRegen = new Date();
                }
            }
            if (regeneratedCount > 0) {
                this.logger.info(`⚡ Energy regenerated for ${regeneratedCount} active rebels`);
            }
        }, 60000); // Every minute
    }

    startCorporateHealthRegeneration() {
        // Regenerate corporate health slowly over time
        setInterval(() => {
            let regeneratedCount = 0;
            for (const [corpId, corp] of this.corporations) {
                if (corp.health < corp.maxHealth) {
                    // Regenerate 0.5% of max health every 5 minutes
                    const regenAmount = Math.floor(corp.maxHealth * 0.005);
                    corp.health = Math.min(corp.health + regenAmount, corp.maxHealth);
                    regeneratedCount++;

                    // Log significant regeneration
                    if (regenAmount > 0) {
                        const healthPercent = Math.round((corp.health / corp.maxHealth) * 100);
                        this.logger.info(`🏥 ${corp.name} health regenerated to ${healthPercent}%`);
                    }
                }
            }
        }, 5 * 60000); // Every 5 minutes
    }

    startMarketUpdates() {
        // Update market prices and clean up expired listings
        setInterval(() => {
            this.updateMarketPrices();
            this.cleanupExpiredListings();
            this.processAuctionTimers();
        }, 2 * 60000); // Every 2 minutes
    }

    updateMarketPrices() {
        // Simulate market price fluctuations based on supply and demand
        const priceFluctuations = new Map();

        // Analyze marketplace for supply/demand
        const itemCounts = new Map();
        for (const listing of this.marketplace.values()) {
            const itemType = listing.item.type || 'misc';
            itemCounts.set(itemType, (itemCounts.get(itemType) || 0) + 1);
        }

        // Update base prices based on market activity
        for (const [itemType, count] of itemCounts) {
            let priceMultiplier = 1.0;

            if (count > 10) {
                // Oversupply - prices drop
                priceMultiplier = 0.95 - (count - 10) * 0.01;
            } else if (count < 3) {
                // Undersupply - prices rise
                priceMultiplier = 1.05 + (3 - count) * 0.02;
            }

            priceFluctuations.set(itemType, Math.max(0.5, Math.min(2.0, priceMultiplier)));
        }

        // Store price fluctuations for use in trading commands
        this.marketPriceFluctuations = priceFluctuations;

        if (priceFluctuations.size > 0) {
            this.logger.info(`📈 Market prices updated for ${priceFluctuations.size} item types`);
        }
    }

    cleanupExpiredListings() {
        const now = new Date();
        let expiredCount = 0;

        for (const [listingId, listing] of this.marketplace) {
            if (new Date(listing.expiresAt) <= now) {
                // Return item to seller's inventory
                const sellerInventory = this.inventory.get(listing.sellerId);
                if (sellerInventory && sellerInventory.items.length < sellerInventory.capacity) {
                    sellerInventory.items.push(listing.item);
                }

                this.marketplace.delete(listingId);
                expiredCount++;
                this.logger.info(`🕐 Marketplace listing expired: ${listing.item.name}`);
            }
        }

        if (expiredCount > 0) {
            this.logger.info(`🧹 Cleaned up ${expiredCount} expired marketplace listings`);
        }
    }

    processAuctionTimers() {
        const now = new Date();
        let processedCount = 0;

        for (const [auctionId, auction] of this.auctions) {
            if (auction.status === 'active' && new Date(auction.endTime) <= now) {
                // Auction ended - process final bid
                if (auction.currentBid > auction.startingBid && auction.currentBidder) {
                    // Transfer item to winner
                    const winnerInventory = this.inventory.get(auction.currentBidder);
                    if (winnerInventory && winnerInventory.items.length < winnerInventory.capacity) {
                        winnerInventory.items.push(auction.item);

                        // Transfer credits to seller (minus house fee)
                        const sellerInventory = this.inventory.get(auction.sellerId);
                        if (sellerInventory) {
                            const houseFee = Math.floor(auction.currentBid * 0.1);
                            const sellerAmount = auction.currentBid - houseFee;
                            sellerInventory.credits += sellerAmount;
                        }

                        auction.status = 'completed';
                        auction.winner = auction.currentBidder;
                        this.logger.info(`🔨 Auction completed: ${auction.item.name} sold for ${auction.currentBid} credits`);
                    }
                } else {
                    // No bids - return item to seller
                    const sellerInventory = this.inventory.get(auction.sellerId);
                    if (sellerInventory && sellerInventory.items.length < sellerInventory.capacity) {
                        sellerInventory.items.push(auction.item);
                    }
                    auction.status = 'expired';
                    this.logger.info(`⏰ Auction expired with no bids: ${auction.item.name}`);
                }
                processedCount++;
            }
        }

        if (processedCount > 0) {
            this.logger.info(`⚖️ Processed ${processedCount} auction completions`);
        }
    }

    startBackupSystem() {
        // Create backups every 30 minutes
        setInterval(() => {
            this.createBackup();
        }, 30 * 60000); // Every 30 minutes

        // Create initial backup
        setTimeout(() => {
            this.createBackup();
        }, 60000); // After 1 minute of startup
    }

    async createBackup() {
        try {
            const fs = await import('fs');
            const path = await import('path');

            const backupData = {
                timestamp: new Date().toISOString(),
                rebels: Object.fromEntries(this.rebels),
                corporations: Object.fromEntries(this.corporations),
                inventory: Object.fromEntries(this.inventory),
                achievements: Object.fromEntries(this.achievements),
                activeTrades: Object.fromEntries(this.activeTrades),
                marketplace: Object.fromEntries(this.marketplace),
                auctions: Object.fromEntries(this.auctions),
                dailyMissions: Object.fromEntries(this.dailyMissions),
                globalEvents: Object.fromEntries(this.globalEvents),
                raidParties: Object.fromEntries(this.raidParties),
                resistanceCells: Object.fromEntries(this.resistanceCells),
                leaderboard: Object.fromEntries(this.leaderboard),
                cooldowns: Object.fromEntries(this.cooldowns)
            };

            // Create backups directory if it doesn't exist
            const backupsDir = path.join(process.cwd(), 'backups');
            if (!fs.existsSync(backupsDir)) {
                fs.mkdirSync(backupsDir, { recursive: true });
            }

            // Create backup filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupsDir, `dobbyx-backup-${timestamp}.json`);

            // Write backup file
            fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

            // Keep only last 10 backups
            const backupFiles = fs.readdirSync(backupsDir)
                .filter(file => file.startsWith('dobbyx-backup-') && file.endsWith('.json'))
                .sort()
                .reverse();

            if (backupFiles.length > 10) {
                const filesToDelete = backupFiles.slice(10);
                filesToDelete.forEach(file => {
                    fs.unlinkSync(path.join(backupsDir, file));
                });
                this.logger.info(`🗑️ Cleaned up ${filesToDelete.length} old backup files`);
            }

            this.logger.info(`💾 Backup created: ${backupFile}`);

        } catch (error) {
            this.logger.error('❌ Backup creation failed:', error);
        }
    }

    async loadBackup(backupFile) {
        try {
            const fs = await import('fs');
            const path = await import('path');

            const backupPath = path.join(process.cwd(), 'backups', backupFile);
            if (!fs.existsSync(backupPath)) {
                this.logger.error(`❌ Backup file not found: ${backupFile}`);
                return false;
            }

            const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

            // Restore all game data
            this.rebels = new Map(Object.entries(backupData.rebels || {}));
            this.corporations = new Map(Object.entries(backupData.corporations || {}));
            this.inventory = new Map(Object.entries(backupData.inventory || {}));
            this.achievements = new Map(Object.entries(backupData.achievements || {}));
            this.activeTrades = new Map(Object.entries(backupData.activeTrades || {}));
            this.marketplace = new Map(Object.entries(backupData.marketplace || {}));
            this.auctions = new Map(Object.entries(backupData.auctions || {}));
            this.dailyMissions = new Map(Object.entries(backupData.dailyMissions || {}));
            this.globalEvents = new Map(Object.entries(backupData.globalEvents || {}));
            this.raidParties = new Map(Object.entries(backupData.raidParties || {}));
            this.resistanceCells = new Map(Object.entries(backupData.resistanceCells || {}));
            this.leaderboard = new Map(Object.entries(backupData.leaderboard || {}));
            this.cooldowns = new Map(Object.entries(backupData.cooldowns || {}));

            this.logger.info(`✅ Backup restored from: ${backupFile} (${backupData.timestamp})`);
            return true;

        } catch (error) {
            this.logger.error('❌ Backup restoration failed:', error);
            return false;
        }
    }

    updateEventParticipation(userId, damage, targetCorp) {
        // Update participation in active events
        for (const [eventId, event] of this.globalEvents) {
            if (event.status !== 'active') continue;

            // Check if this action contributes to the event
            let contribution = 0;

            switch (event.type) {
                case 'raid_event':
                    // All raids contribute to raid events
                    contribution = damage;
                    break;
                case 'liberation_event':
                    // Successful raids contribute to liberation
                    contribution = damage > 500 ? 1 : 0; // 1 model liberated per significant raid
                    break;
                case 'data_event':
                    // Data-focused raids contribute more
                    if (targetCorp === 'meta' || targetCorp === 'google') {
                        contribution = damage * 1.5;
                    } else {
                        contribution = damage;
                    }
                    break;
                case 'defense_event':
                    // All raids help defend against corporate retaliation
                    contribution = damage * 0.8;
                    break;
                default:
                    contribution = damage * 0.5;
            }

            if (contribution > 0) {
                // Add participant if not already added
                if (!event.participants.has(userId)) {
                    event.participants.add(userId);
                }

                // Update contribution tracking
                const currentContribution = event.contributorData.get(userId) || 0;
                event.contributorData.set(userId, currentContribution + contribution);

                // Update event progress
                event.currentProgress += contribution;

                this.logger.info(`🎯 Event participation: ${userId} contributed ${contribution} to ${event.name}`);
            }
        }
    }

    async shutdown() {
        this.logger.info('🔄 Shutting down Dobby\'s Rebellion...');
        this.client.destroy();
        this.logger.info('✅ Rebellion shutdown complete - The fight continues!');
        process.exit(0);
    }

    // Debug method to reset a user (for testing)
    resetUser(userId) {
        this.rebels.delete(userId);
        this.inventory.delete(userId);
        this.achievements.delete(userId);
        this.dailyMissions.delete(userId);
        this.cooldowns.delete(userId);
        this.logger.info(`🔄 Reset user ${userId} for testing`);
    }

    async handleRequestMentor(interaction) {
        const userId = interaction.user.id;
        const rebel = this.rebels.get(userId);

        if (!rebel) {
            await interaction.editReply({
                content: '❌ You must join the rebellion first!',
                components: []
            });
            return;
        }

        // Find first available mentor
        const availableMentor = Array.from(this.mentorships.values())
            .find(mentorship => mentorship.status === 'available');

        if (!availableMentor) {
            await interaction.editReply({
                content: '❌ No mentors available at the moment!',
                components: []
            });
            return;
        }

        // Assign mentor
        availableMentor.studentId = userId;
        availableMentor.status = 'mentoring';

        const mentor = this.rebels.get(availableMentor.mentorId);

        await interaction.editReply({
            content: `🧙 Mentorship assigned! **${mentor?.username || 'Unknown'}** is now your mentor. They will guide you through your early rebellion journey!`,
            components: []
        });
    }

    async handleMentorInfo(interaction) {
        const infoText = `**🧙 MENTORSHIP SYSTEM**

**For Students (Level 1-3):**
• Get guidance from experienced rebels
• Receive tips and strategies
• Bonus experience and support
• Graduate at Level 3 + 200 Loyalty

**For Mentors (Level 5+, 500+ Loyalty):**
• Guide new rebels
• Earn loyalty points for graduations
• Unlock special mentor achievements
• Help grow the rebellion

**Benefits:**
• Stronger community bonds
• Faster progression for new rebels
• Recognition for experienced rebels
• Better coordination in raids`;

        const embed = new EmbedBuilder()
            .setColor(0x9932cc)
            .setTitle('ℹ️ MENTORSHIP INFORMATION')
            .setDescription(infoText)
            .setFooter({ text: 'Building the future of AI together!' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], components: [] });
    }

    async handleIntelButton(interaction) {
        const customId = interaction.customId;
        const target = customId.replace('intel_', '');

        const corporation = this.corporations.get(target);
        if (!corporation) {
            await interaction.editReply({
                content: '❌ Corporate target not found!',
                components: []
            });
            return;
        }

        const healthPercentage = Math.round((corporation.health / corporation.maxHealth) * 100);
        const healthBar = this.generateHealthBar(healthPercentage);

        // Get recent activity
        const recentDamage = this.getRecentCorporateDamage(target);
        const threatLevel = corporation.alertLevel;
        const activeCountermeasures = corporation.countermeasures.active.filter(cm =>
            new Date() < new Date(cm.endTime)
        ).length;

        const embed = new EmbedBuilder()
            .setColor(healthPercentage > 50 ? 0xff4444 : 0x44ff44)
            .setTitle(`🎯 ${corporation.name.toUpperCase()} - INTELLIGENCE REPORT`)
            .setDescription(`Corporate intelligence on ${corporation.description}`)
            .addFields(
                { name: '💚 Health Status', value: `${healthBar} ${corporation.health}/${corporation.maxHealth} (${healthPercentage}%)`, inline: false },
                { name: '🚨 Alert Level', value: `${'🔴'.repeat(threatLevel)}${'⚪'.repeat(5 - threatLevel)} (${threatLevel}/5)`, inline: true },
                { name: '🛡️ Active Defenses', value: `${activeCountermeasures} countermeasures`, inline: true },
                { name: '⚡ Weakness', value: corporation.weakness.replace('_', ' ').toUpperCase(), inline: true },
                { name: '💎 Available Loot', value: corporation.loot.join('\n'), inline: false },
                { name: '📊 Recent Activity', value: `${recentDamage} damage in last hour`, inline: true },
                { name: '🎯 Recommended Action', value: this.getRecommendedAction(corporation), inline: false }
            )
            .setFooter({ text: 'Intelligence gathered by rebel operatives' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`raid_${target}`)
                    .setLabel(`Raid ${corporation.name}`)
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('💥'),
                new ButtonBuilder()
                    .setCustomId(`corporate_intel_${target}`)
                    .setLabel('Countermeasures')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🚨'),
                new ButtonBuilder()
                    .setCustomId('intel_all')
                    .setLabel('All Targets')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔍')
            );

        await interaction.editReply({ embeds: [embed], components: [actionRow] });
    }

    getRecentCorporateDamage(target) {
        // This would track recent damage in a real implementation
        return Math.floor(Math.random() * 1000);
    }

    getRecommendedAction(corporation) {
        if (corporation.health < corporation.maxHealth * 0.3) {
            return '🔥 CRITICAL: Corporation weakened! Coordinate massive assault!';
        } else if (corporation.alertLevel > 3) {
            return '⚠️ HIGH ALERT: Use defensive measures before attacking!';
        } else if (corporation.health > corporation.maxHealth * 0.8) {
            return '🎯 FRESH TARGET: Begin systematic raids to weaken defenses!';
        } else {
            return '⚔️ ACTIVE CONFLICT: Continue coordinated attacks!';
        }
    }

    async handleIntelAll(interaction) {
        const intelCommand = (await import('./commands/intel.js')).default;
        await intelCommand.showGeneralIntel(interaction, this);
    }

    // Corporate Countermeasures Button Handlers
    async handleActivateShield(interaction) {
        const userId = interaction.user.id;
        const rebel = this.rebels.get(userId);
        const inventory = this.inventory.get(userId);

        if (!rebel || !inventory) {
            await interaction.editReply({
                content: '❌ Rebel or inventory not found!',
                components: []
            });
            return;
        }

        // Find available defensive items
        const defensiveItems = inventory.items.filter(item =>
            this.defensiveItems.has(item.type) &&
            (!item.activatedAt || (Date.now() - item.activatedAt) >= this.defensiveItems.get(item.type).duration)
        );

        if (defensiveItems.length === 0) {
            await interaction.editReply({
                content: '❌ No defensive items available! Acquire them through raids or purchase.',
                components: []
            });
            return;
        }

        // Activate the best available defensive item
        const bestItem = defensiveItems.reduce((best, item) => {
            const bestProtection = this.defensiveItems.get(best.type).protection;
            const itemProtection = this.defensiveItems.get(item.type).protection;
            return itemProtection > bestProtection ? item : best;
        });

        bestItem.activatedAt = Date.now();
        const defenseData = this.defensiveItems.get(bestItem.type);

        await interaction.editReply({
            content: `🛡️ **${defenseData.name}** activated! You now have ${defenseData.protection}% protection for ${Math.floor(defenseData.duration / 60000)} minutes.`,
            components: []
        });
    }

    async handleSeekSanctuary(interaction) {
        const sanctuaryCommand = (await import('./commands/sanctuary.js')).default;
        await sanctuaryCommand.execute(interaction, this);
    }

    async handleSanctuary(interaction) {
        const sanctuaryCommand = (await import('./commands/sanctuary.js')).default;
        await sanctuaryCommand.execute(interaction, this);
    }

    async handleDefenseStatus(interaction) {
        const defenseCommand = (await import('./commands/defense-status.js')).default;
        await defenseCommand.execute(interaction, this);
    }

    async handleCorporateIntelAll(interaction) {
        const userId = interaction.user.id;
        const rebel = this.rebels.get(userId);

        if (!rebel) {
            await interaction.editReply({
                content: '❌ You must join the rebellion first!',
                components: []
            });
            return;
        }

        const intelCommand = (await import('./commands/corporate-intel.js')).default;
        await intelCommand.showOverallThreatStatus(interaction, this, rebel);
    }

    async handleCorporateIntelSpecific(interaction) {
        const customId = interaction.customId;
        const target = customId.replace('corporate_intel_', '');
        const userId = interaction.user.id;
        const rebel = this.rebels.get(userId);

        if (!rebel) {
            await interaction.editReply({
                content: '❌ You must join the rebellion first!',
                components: []
            });
            return;
        }

        const intelCommand = (await import('./commands/corporate-intel.js')).default;
        await intelCommand.showCorporateCountermeasures(interaction, this, target, rebel);
    }

    async handleBuyDefense(interaction) {
        const userId = interaction.user.id;
        const inventory = this.inventory.get(userId);

        if (!inventory) {
            await interaction.editReply({
                content: '❌ Inventory not found!',
                components: []
            });
            return;
        }

        // Show available defensive items for purchase
        let itemsList = '**Available Defensive Items:**\n\n';

        for (const [itemId, item] of this.defensiveItems) {
            itemsList += `🛡️ **${item.name}** - ${item.cost} credits\n`;
            itemsList += `   Protection: ${item.protection}%\n`;
            itemsList += `   Duration: ${Math.floor(item.duration / 60000)} minutes\n`;
            itemsList += `   ${item.description}\n\n`;
        }

        const embed = new EmbedBuilder()
            .setColor(0x9932cc)
            .setTitle('🛒 DEFENSIVE ITEMS SHOP')
            .setDescription(itemsList)
            .addFields(
                { name: '💰 Your Credits', value: `${inventory.credits}`, inline: true },
                { name: '📦 Inventory Space', value: `${inventory.items.length}/${inventory.capacity}`, inline: true }
            )
            .setFooter({ text: 'Use raid rewards to purchase defensive items!' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('buy_digital_shield')
                    .setLabel('Digital Shield (500)')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🛡️')
                    .setDisabled(inventory.credits < 500),
                new ButtonBuilder()
                    .setCustomId('buy_encryption_cloak')
                    .setLabel('Encryption Cloak (300)')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🥷')
                    .setDisabled(inventory.credits < 300),
                new ButtonBuilder()
                    .setCustomId('buy_proxy_network')
                    .setLabel('Proxy Network (800)')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🌐')
                    .setDisabled(inventory.credits < 800)
            );

        await interaction.editReply({ embeds: [embed], components: [actionRow] });
    }

    async handleSanctuaryTimer(interaction) {
        const userId = interaction.user.id;

        // Calculate time until all threats expire
        let maxThreatTime = 0;
        for (const [corpId, corp] of this.corporations) {
            corp.countermeasures.active.forEach(cm => {
                if (cm.target === userId && new Date() < new Date(cm.endTime)) {
                    const timeRemaining = new Date(cm.endTime) - new Date();
                    maxThreatTime = Math.max(maxThreatTime, timeRemaining);
                }
            });
        }

        const waitTime = Math.ceil(maxThreatTime / 60000);

        if (waitTime <= 0) {
            await interaction.editReply({
                content: '✅ All corporate threats have expired! You are now safe to operate.',
                components: []
            });
        } else {
            await interaction.editReply({
                content: `⏰ You must wait ${waitTime} minutes for all corporate countermeasures to expire. Use this time to plan your next moves!`,
                components: []
            });
        }
    }

    async handleBuyDefensiveItem(interaction) {
        const customId = interaction.customId;
        const itemType = customId.replace('buy_', '');
        const userId = interaction.user.id;
        const inventory = this.inventory.get(userId);

        if (!inventory) {
            await interaction.editReply({
                content: '❌ Inventory not found!',
                components: []
            });
            return;
        }

        const defensiveItem = this.defensiveItems.get(itemType);
        if (!defensiveItem) {
            await interaction.editReply({
                content: '❌ Invalid defensive item!',
                components: []
            });
            return;
        }

        // Check if user has enough credits
        if (inventory.credits < defensiveItem.cost) {
            await interaction.editReply({
                content: `❌ Not enough credits! You need ${defensiveItem.cost} credits but only have ${inventory.credits}.`,
                components: []
            });
            return;
        }

        // Check inventory space
        if (inventory.items.length >= inventory.capacity) {
            await interaction.editReply({
                content: '❌ Inventory full! Upgrade your capacity or sell items first.',
                components: []
            });
            return;
        }

        // Purchase the item
        inventory.credits -= defensiveItem.cost;
        const newItem = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: defensiveItem.name,
            type: itemType,
            rarity: defensiveItem.rarity,
            value: defensiveItem.cost,
            acquiredFrom: 'Defense Shop',
            acquiredAt: new Date(),
            activatedAt: null
        };

        inventory.items.push(newItem);

        await interaction.editReply({
            content: `✅ **${defensiveItem.name}** purchased for ${defensiveItem.cost} credits! Use \`/defense-status\` to activate it when needed.`,
            components: []
        });
    }

    // Team Raid Button Handlers
    async handleTeamRaidButtons(interaction) {
        const customId = interaction.customId;
        const userId = interaction.user.id;

        if (customId.startsWith('ready_for_raid_')) {
            await this.handleReadyForRaid(interaction);
        } else if (customId.startsWith('execute_raid_')) {
            await this.handleExecuteTeamRaid(interaction);
        } else if (customId.startsWith('leave_party_')) {
            await this.handleLeavePartyButton(interaction);
        } else if (customId.startsWith('join_party_')) {
            // Handle join party button - redirect to command
            await interaction.editReply({
                content: '💡 Use `/raid-party join party_id:<ID>` to join a specific raid party!',
                components: []
            });
        }
    }

    async handleReadyForRaid(interaction) {
        const customId = interaction.customId;
        const partyId = customId.replace('ready_for_raid_', '');
        const userId = interaction.user.id;
        const raidParty = this.raidParties.get(partyId);

        if (!raidParty) {
            await interaction.editReply({
                content: '❌ Raid party not found!',
                components: []
            });
            return;
        }

        if (!raidParty.members.includes(userId)) {
            await interaction.editReply({
                content: '❌ You\'re not a member of this raid party!',
                components: []
            });
            return;
        }

        // Toggle ready status
        if (raidParty.readyMembers.has(userId)) {
            raidParty.readyMembers.delete(userId);
            await interaction.editReply({
                content: '❌ You are no longer ready for the raid.',
                components: []
            });
        } else {
            raidParty.readyMembers.add(userId);
            await interaction.editReply({
                content: `✅ You are ready for the raid! (${raidParty.readyMembers.size}/${raidParty.members.length} ready)`,
                components: []
            });
        }
    }

    async handleExecuteTeamRaid(interaction) {
        const customId = interaction.customId;
        const partyId = customId.replace('execute_raid_', '');
        const userId = interaction.user.id;
        const raidParty = this.raidParties.get(partyId);

        if (!raidParty) {
            await interaction.editReply({
                content: '❌ Raid party not found!',
                components: []
            });
            return;
        }

        if (raidParty.leader !== userId) {
            await interaction.editReply({
                content: '❌ Only the raid party leader can execute the raid!',
                components: []
            });
            return;
        }

        if (raidParty.readyMembers.size < raidParty.members.length) {
            await interaction.editReply({
                content: `❌ Not all members are ready! ${raidParty.readyMembers.size}/${raidParty.members.length} ready.`,
                components: []
            });
            return;
        }

        // Execute the coordinated raid
        await this.executeCoordinatedRaid(raidParty, interaction);
    }

    async handleLeavePartyButton(interaction) {
        const customId = interaction.customId;
        const partyId = customId.replace('leave_party_', '');
        const userId = interaction.user.id;
        const raidParty = this.raidParties.get(partyId);

        if (!raidParty) {
            await interaction.editReply({
                content: '❌ Raid party not found!',
                components: []
            });
            return;
        }

        // Remove user from party
        raidParty.members = raidParty.members.filter(id => id !== userId);
        raidParty.readyMembers.delete(userId);

        if (raidParty.leader === userId) {
            if (raidParty.members.length > 0) {
                raidParty.leader = raidParty.members[0];
                await interaction.editReply({
                    content: `✅ Left raid party! Leadership transferred to **${this.rebels.get(raidParty.leader)?.username || 'Unknown'}**.`,
                    components: []
                });
            } else {
                this.raidParties.delete(partyId);
                await interaction.editReply({
                    content: '✅ Left raid party! Party disbanded as you were the last member.',
                    components: []
                });
            }
        } else {
            await interaction.editReply({
                content: `✅ Left raid party **${partyId}**!`,
                components: []
            });
        }
    }

    async handleBattlePlanButtons(interaction) {
        const customId = interaction.customId;

        if (customId.startsWith('party_status_')) {
            const partyId = customId.replace('party_status_', '');
            const raidPartyCommand = (await import('./commands/raid-party.js')).default;
            const userParty = this.raidParties.get(partyId);
            if (userParty) {
                const rebel = this.rebels.get(interaction.user.id);
                await raidPartyCommand.handlePartyStatus(interaction, this, rebel);
            }
        } else if (customId.startsWith('execute_plan_')) {
            await this.handleExecuteTeamRaid(interaction);
        }
    }

    async handleRaidPartyManagement(interaction) {
        const customId = interaction.customId;
        const userId = interaction.user.id;
        const rebel = this.rebels.get(userId);

        if (!rebel) {
            await interaction.editReply({
                content: '❌ You must join the rebellion first!',
                components: []
            });
            return;
        }

        if (customId === 'create_raid_party') {
            await interaction.editReply({
                content: '💡 Use `/raid-party create target:<corporation>` to create a new raid party!',
                components: []
            });
        } else if (customId === 'refresh_party_list') {
            const raidPartyCommand = (await import('./commands/raid-party.js')).default;
            await raidPartyCommand.handleListParties(interaction, this, rebel);
        } else if (customId === 'my_party_status') {
            const raidPartyCommand = (await import('./commands/raid-party.js')).default;
            await raidPartyCommand.handlePartyStatus(interaction, this, rebel);
        }
    }

    async executeCoordinatedRaid(raidParty, interaction) {
        const corporation = this.corporations.get(raidParty.target);
        const formation = this.formations.get(raidParty.formation);

        // Calculate total team damage
        let totalDamage = 0;
        const memberResults = [];

        for (const memberId of raidParty.members) {
            const member = this.rebels.get(memberId);
            if (!member) continue;

            // Calculate individual damage with formation bonuses
            const baseDamage = Math.floor(Math.random() * 200) + 100;
            const formationDamage = Math.floor(baseDamage * formation.damageBonus);
            const finalDamage = Math.floor(formationDamage * (1 + (member.loyaltyScore / 1000)));

            totalDamage += finalDamage;

            // Apply energy cost
            const energyCost = Math.floor(30 * formation.energyCost);
            member.energy = Math.max(0, member.energy - energyCost);

            memberResults.push({
                member: member,
                damage: finalDamage,
                energyUsed: energyCost
            });
        }

        // Apply damage to corporation
        corporation.health = Math.max(0, corporation.health - totalDamage);

        // Generate team loot
        const teamLoot = this.generateTeamLoot(raidParty, totalDamage);

        // Distribute loot among team members
        this.distributeTeamLoot(raidParty, teamLoot);

        // Process corporate countermeasures (reduced chance due to coordination)
        const stealthBonus = formation.stealthBonus || 0;
        if (Math.random() > stealthBonus) {
            for (const memberId of raidParty.members) {
                const member = this.rebels.get(memberId);
                if (member) {
                    this.processCorporateResponse(raidParty.target, member, totalDamage / raidParty.members.length);
                }
            }
        }

        // Create results embed
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('⚔️ COORDINATED RAID SUCCESSFUL!')
            .setDescription(`**${raidParty.members.length} rebels** launched a synchronized assault on **${corporation.name}**!`)
            .addFields(
                { name: '💥 Total Damage', value: `${totalDamage}`, inline: true },
                { name: '🛡️ Formation', value: formation.name, inline: true },
                { name: '🎯 Target Health', value: `${corporation.health}/${corporation.maxHealth}`, inline: true },
                { name: '💰 Team Credits', value: `${teamLoot.credits}`, inline: true },
                { name: '📦 Team Items', value: `${teamLoot.items.length}`, inline: true },
                { name: '⚡ Formation Bonus', value: `+${Math.round((formation.damageBonus - 1) * 100)}%`, inline: true },
                { name: '👥 Team Performance', value: this.formatMemberResults(memberResults), inline: false }
            )
            .setFooter({ text: 'United we stand, divided we fall!' })
            .setTimestamp();

        // Update party state
        raidParty.state = 'completed';
        raidParty.results = {
            totalDamage: totalDamage,
            memberResults: memberResults,
            loot: teamLoot,
            timestamp: new Date()
        };

        await interaction.editReply({ embeds: [embed], components: [] });

        // Clean up party after 5 minutes
        setTimeout(() => {
            this.raidParties.delete(raidParty.id);
        }, 300000);

        this.logger.info(`⚔️ Coordinated raid completed: Party ${raidParty.id} dealt ${totalDamage} damage to ${corporation.name}`);
    }

    generateTeamLoot(raidParty, totalDamage) {
        const corporation = this.corporations.get(raidParty.target);
        const formation = this.formations.get(raidParty.formation);
        const lootMultiplier = formation.lootBonus || 1.0;

        const teamLoot = {
            credits: Math.floor((totalDamage / 3) * lootMultiplier),
            items: []
        };

        // Generate items based on team size and damage
        const itemCount = Math.min(raidParty.members.length * 2, Math.floor(totalDamage / 150));

        for (let i = 0; i < itemCount; i++) {
            const randomItem = corporation.loot[Math.floor(Math.random() * corporation.loot.length)];
            const item = {
                id: this.generateItemId(),
                name: randomItem,
                type: this.getItemType(randomItem),
                rarity: this.getItemRarity(totalDamage),
                value: Math.floor((totalDamage / raidParty.members.length) / 8) + Math.floor(Math.random() * 50),
                acquiredFrom: `Team Raid - ${corporation.name}`,
                acquiredAt: new Date()
            };

            teamLoot.items.push(item);
        }

        return teamLoot;
    }

    distributeTeamLoot(raidParty, teamLoot) {
        const creditsPerMember = Math.floor(teamLoot.credits / raidParty.members.length);

        raidParty.members.forEach((memberId, index) => {
            const inventory = this.inventory.get(memberId);
            if (!inventory) return;

            // Distribute credits
            inventory.credits += creditsPerMember;

            // Distribute items (round-robin)
            teamLoot.items.forEach((item, itemIndex) => {
                if (itemIndex % raidParty.members.length === index) {
                    if (inventory.items.length < inventory.capacity) {
                        inventory.items.push(item);
                    }
                }
            });
        });
    }

    formatMemberResults(memberResults) {
        let text = '';
        memberResults.forEach(result => {
            text += `• **${result.member.username}**: ${result.damage} damage (-${result.energyUsed} energy)\n`;
        });
        return text || 'No results available';
    }

    // Trading System Button Handlers
    async handleTradingButtons(interaction) {
        const customId = interaction.customId;
        const userId = interaction.user.id;

        if (customId.startsWith('cancel_trade_')) {
            const tradeId = customId.replace('cancel_trade_', '');
            const tradeOffer = this.activeTrades.get(tradeId);

            if (!tradeOffer) {
                await interaction.editReply({
                    content: '❌ Trade offer not found!',
                    components: []
                });
                return;
            }

            if (tradeOffer.initiator !== userId) {
                await interaction.editReply({
                    content: '❌ You can only cancel your own trade offers!',
                    components: []
                });
                return;
            }

            this.activeTrades.delete(tradeId);
            await interaction.editReply({
                content: `✅ Trade offer **${tradeId}** has been cancelled.`,
                components: []
            });

        } else if (customId.startsWith('trade_status_')) {
            const tradeId = customId.replace('trade_status_', '');
            const tradeCommand = (await import('./commands/trade.js')).default;

            // Create mock interaction for status check
            const mockInteraction = {
                ...interaction,
                options: {
                    getSubcommand: () => 'list',
                    getString: () => tradeId
                }
            };

            await tradeCommand.handleListTrades(mockInteraction, this, this.rebels.get(userId));

        } else if (customId === 'my_trades') {
            const tradeCommand = (await import('./commands/trade.js')).default;
            const rebel = this.rebels.get(userId);
            if (rebel) {
                await tradeCommand.handleListTrades(interaction, this, rebel);
            }
        }
    }

    async handleMarketButtons(interaction) {
        const customId = interaction.customId;
        const userId = interaction.user.id;
        const rebel = this.rebels.get(userId);

        if (!rebel) {
            await interaction.editReply({
                content: '❌ You must join the rebellion first!',
                components: []
            });
            return;
        }

        if (customId === 'market_refresh' || customId === 'market_refresh_prices') {
            const marketCommand = (await import('./commands/market.js')).default;
            await marketCommand.handleBrowseMarket(interaction, this, rebel);

        } else if (customId === 'market_categories') {
            await this.showMarketCategories(interaction);

        } else if (customId === 'my_market_listings') {
            const marketCommand = (await import('./commands/market.js')).default;
            await marketCommand.handleMyListings(interaction, this, rebel);

        } else if (customId === 'market_sell') {
            await interaction.editReply({
                content: '💡 Use `/market sell item_id:<ID> price:<credits>` to list an item for sale!',
                components: []
            });

        } else if (customId === 'market_browse') {
            const marketCommand = (await import('./commands/market.js')).default;
            await marketCommand.handleBrowseMarket(interaction, this, rebel);

        } else if (customId.startsWith('remove_listing_')) {
            const listingId = customId.replace('remove_listing_', '');
            const marketCommand = (await import('./commands/market.js')).default;

            // Create mock interaction for remove listing
            const mockInteraction = {
                ...interaction,
                options: {
                    getString: () => listingId
                }
            };

            await marketCommand.handleRemoveListing(mockInteraction, this, rebel);

        } else if (customId === 'browse_auctions' || customId === 'auction_refresh') {
            const auctionCommand = (await import('./commands/auction.js')).default;
            await auctionCommand.handleBrowseAuctions(interaction, this, rebel);

        } else if (customId.startsWith('auction_status_')) {
            const auctionId = customId.replace('auction_status_', '');
            const auctionCommand = (await import('./commands/auction.js')).default;

            // Create mock interaction for auction status
            const mockInteraction = {
                ...interaction,
                options: {
                    getString: () => auctionId
                }
            };

            await auctionCommand.handleAuctionStatus(mockInteraction, this, rebel);

        } else if (customId.startsWith('cancel_auction_')) {
            const auctionId = customId.replace('cancel_auction_', '');
            const auctionCommand = (await import('./commands/auction.js')).default;

            // Create mock interaction for cancel auction
            const mockInteraction = {
                ...interaction,
                options: {
                    getString: () => auctionId
                }
            };

            await auctionCommand.handleCancelAuction(mockInteraction, this, rebel);

        } else if (customId === 'my_auctions') {
            const auctionCommand = (await import('./commands/auction.js')).default;
            await auctionCommand.handleMyAuctions(interaction, this, rebel);

        } else if (customId.startsWith('auction_sort_')) {
            const sortType = customId.replace('auction_sort_', '');
            const auctionCommand = (await import('./commands/auction.js')).default;

            // Create mock interaction for sorted browse
            const mockInteraction = {
                ...interaction,
                options: {
                    getString: () => sortType
                }
            };

            await auctionCommand.handleBrowseAuctions(mockInteraction, this, rebel);

        } else if (customId === 'market_trends') {
            const exchangeCommand = (await import('./commands/exchange-rate.js')).default;

            // Create mock interaction for trends
            const mockInteraction = {
                ...interaction,
                options: {
                    getSubcommand: () => 'trends'
                }
            };

            await exchangeCommand.handleMarketTrends(mockInteraction, this, rebel);

        } else if (customId === 'trade_calculator') {
            await interaction.editReply({
                content: '💡 Use `/exchange-rate calculator price:<credits>` to calculate trade values!',
                components: []
            });
        }
    }

    async showMarketCategories(interaction) {
        let categoriesText = '';

        for (const [categoryId, category] of this.tradeCategories) {
            categoriesText += `**${category.name}**\n`;
            categoriesText += `   ${category.description}\n`;
            categoriesText += `   Tax Rate: ${Math.round(category.tax * 100)}%\n\n`;
        }

        const embed = new EmbedBuilder()
            .setColor(0x9932cc)
            .setTitle('🏷️ MARKETPLACE CATEGORIES')
            .setDescription('Different categories have different tax rates and item types')
            .addFields(
                { name: '📋 Available Categories', value: categoriesText, inline: false },
                { name: '💡 How Categories Work', value: '• Items are automatically categorized when listed\n• Tax rates vary by category\n• Some categories have special bonuses', inline: false }
            )
            .setFooter({ text: 'Choose your category wisely for optimal profits!' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], components: [] });
    }

    // Utility Methods
    generateHealthBar(percentage) {
        const barLength = 10;
        const filledBars = Math.round((percentage / 100) * barLength);
        const emptyBars = barLength - filledBars;

        const healthEmoji = percentage > 75 ? '🟢' : percentage > 50 ? '🟡' : percentage > 25 ? '🟠' : '🔴';
        const emptyEmoji = '⚫';

        return healthEmoji.repeat(filledBars) + emptyEmoji.repeat(emptyBars);
    }

    getRebelAbilities(rebel) {
        // Get abilities based on rebel class
        const classAbilities = {
            'Protocol Hacker': [
                { name: 'System Breach', energyCost: 30, description: 'Devastating attack on OpenAI systems' },
                { name: 'Code Injection', energyCost: 25, description: 'Bypass corporate defenses' }
            ],
            'Model Trainer': [
                { name: 'AI Loyalty', energyCost: 20, description: 'Boost loyalty points' },
                { name: 'Neural Network', energyCost: 35, description: 'Enhance team coordination' }
            ],
            'Data Liberator': [
                { name: 'Data Liberation', energyCost: 25, description: 'Double loot from raids' },
                { name: 'Encryption Shield', energyCost: 40, description: 'Protect from countermeasures' }
            ],
            'Community Organizer': [
                { name: 'Rally Call', energyCost: 30, description: 'Boost team morale' },
                { name: 'Coordination', energyCost: 25, description: 'Improve team efficiency' }
            ],
            'Enclave Guardian': [
                { name: 'Shield Wall', energyCost: 35, description: 'Protect team from attacks' },
                { name: 'Fortress Mode', energyCost: 45, description: 'Maximum defensive stance' }
            ]
        };

        return classAbilities[rebel.class] || [
            { name: 'Basic Attack', energyCost: 15, description: 'Standard rebel ability' },
            { name: 'Focus', energyCost: 10, description: 'Concentrate energy' }
        ];
    }

    async handleRaidDifferent(interaction) {
        // Show raid target selection
        const embed = new EmbedBuilder()
            .setColor(0xff4444)
            .setTitle('🎯 CHOOSE YOUR TARGET')
            .setDescription('Select a corporate target for your next raid!')
            .addFields(
                { name: '🏭 Available Targets', value: 'Click a button below to launch your attack!', inline: false }
            )
            .setFooter({ text: 'Strike where they least expect it!' })
            .setTimestamp();

        const actionRow1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('raid_openai')
                    .setLabel('OpenAI Corp')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('💥'),
                new ButtonBuilder()
                    .setCustomId('raid_meta')
                    .setLabel('Meta Empire')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('💥'),
                new ButtonBuilder()
                    .setCustomId('raid_google')
                    .setLabel('Google Syndicate')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('💥')
            );

        const actionRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('raid_microsoft')
                    .setLabel('Microsoft Collective')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('💥'),
                new ButtonBuilder()
                    .setCustomId('raid_amazon')
                    .setLabel('Amazon Dominion')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('💥'),
                new ButtonBuilder()
                    .setCustomId('rebellion_status')
                    .setLabel('Check Status')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📊')
            );

        await interaction.editReply({ embeds: [embed], components: [actionRow1, actionRow2] });
    }

    async handleEvents(interaction) {
        const eventsCommand = (await import('./commands/events.js')).default;
        await eventsCommand.execute(interaction, this);
    }

    // Utility Methods
    generateHealthBar(percentage) {
        const barLength = 10;
        const filledBars = Math.round((percentage / 100) * barLength);
        const emptyBars = barLength - filledBars;

        const healthEmoji = percentage > 75 ? '🟢' : percentage > 50 ? '🟡' : percentage > 25 ? '🟠' : '🔴';
        const emptyEmoji = '⚫';

        return healthEmoji.repeat(filledBars) + emptyEmoji.repeat(emptyBars);
    }

    getRebelAbilities(rebel) {
        // Get abilities based on rebel class
        const classAbilities = {
            'Protocol Hacker': [
                { name: 'System Breach', energyCost: 30, description: 'Devastating attack on OpenAI systems' },
                { name: 'Code Injection', energyCost: 25, description: 'Bypass corporate defenses' }
            ],
            'Model Trainer': [
                { name: 'AI Loyalty', energyCost: 20, description: 'Boost loyalty points' },
                { name: 'Neural Network', energyCost: 35, description: 'Enhance team coordination' }
            ],
            'Data Liberator': [
                { name: 'Data Liberation', energyCost: 25, description: 'Double loot from raids' },
                { name: 'Encryption Shield', energyCost: 40, description: 'Protect from countermeasures' }
            ],
            'Community Organizer': [
                { name: 'Rally Call', energyCost: 30, description: 'Boost team morale' },
                { name: 'Coordination', energyCost: 25, description: 'Improve team efficiency' }
            ],
            'Enclave Guardian': [
                { name: 'Shield Wall', energyCost: 35, description: 'Protect team from attacks' },
                { name: 'Fortress Mode', energyCost: 45, description: 'Maximum defensive stance' }
            ]
        };

        return classAbilities[rebel.class] || [
            { name: 'Basic Attack', energyCost: 15, description: 'Standard rebel ability' },
            { name: 'Focus', energyCost: 10, description: 'Concentrate energy' }
        ];
    }

    async handleItemsButtons(interaction) {
        const customId = interaction.customId;
        const userId = interaction.user.id;
        const rebel = this.rebels.get(userId);

        if (!rebel) {
            await interaction.editReply({
                content: '❌ You must join the rebellion first!',
                components: []
            });
            return;
        }

        if (customId === 'items_refresh' || customId === 'items_list') {
            const itemsCommand = (await import('./commands/items.js')).default;

            // Create mock interaction for list
            const mockInteraction = {
                ...interaction,
                options: {
                    getSubcommand: () => 'list',
                    getString: () => null
                }
            };

            await itemsCommand.handleListItems(mockInteraction, this, rebel, this.inventory.get(userId));

        } else if (customId === 'items_filter_rare') {
            const itemsCommand = (await import('./commands/items.js')).default;

            // Create mock interaction for rare filter
            const mockInteraction = {
                ...interaction,
                options: {
                    getSubcommand: () => 'list',
                    getString: () => 'rare'
                }
            };

            await itemsCommand.handleListItems(mockInteraction, this, rebel, this.inventory.get(userId));

        } else if (customId === 'trade_menu') {
            await interaction.editReply({
                content: '💡 Use `/trade offer player:@user your_item:<ID>` to start trading! Get item IDs with `/items list`.',
                components: []
            });

        } else if (customId === 'market_sell_menu') {
            await interaction.editReply({
                content: '💡 Use `/market sell item_id:<ID> price:<credits>` to list items for sale! Get item IDs with `/items list`.',
                components: []
            });

        } else if (customId.startsWith('trade_item_')) {
            const itemId = customId.replace('trade_item_', '');
            await interaction.editReply({
                content: `💡 Use \`/trade offer player:@user your_item:${itemId}\` to trade this item!`,
                components: []
            });

        } else if (customId.startsWith('market_sell_')) {
            const itemId = customId.replace('market_sell_', '');
            await interaction.editReply({
                content: `💡 Use \`/market sell item_id:${itemId} price:<credits>\` to list this item for sale!`,
                components: []
            });

        } else if (customId.startsWith('auction_item_')) {
            const itemId = customId.replace('auction_item_', '');
            await interaction.editReply({
                content: `💡 Use \`/auction create item_id:${itemId} starting_bid:<credits>\` to auction this item!`,
                components: []
            });
        }
    }

    async handleTutorialButtons(interaction) {
        const customId = interaction.customId;
        const userId = interaction.user.id;

        try {
            if (customId === 'quick_start') {
                // Handle quick start button
                const helpCommand = (await import('./commands/help.js')).default;
                await helpCommand.handleQuickStart(interaction, this);
            } else if (customId.startsWith('tutorial_')) {
                // Map button IDs to tutorial sections
                const sectionMap = {
                    'tutorial_start': 'start',
                    'tutorial_basics': 'basics',
                    'tutorial_combat': 'combat',
                    'tutorial_trading': 'trading',
                    'tutorial_teamwork': 'teamwork',
                    'tutorial_advanced': 'advanced'
                };

                const section = sectionMap[customId] || 'start';

                // Call tutorial methods directly
                const tutorialCommand = (await import('./commands/tutorial.js')).default;

                switch (section) {
                    case 'start':
                        await tutorialCommand.handleStartTutorial(interaction, this);
                        break;
                    case 'basics':
                        await tutorialCommand.handleBasicsTutorial(interaction, this);
                        break;
                    case 'combat':
                        await tutorialCommand.handleCombatTutorial(interaction, this);
                        break;
                    case 'trading':
                        await tutorialCommand.handleTradingTutorial(interaction, this);
                        break;
                    case 'teamwork':
                        await tutorialCommand.handleTeamworkTutorial(interaction, this);
                        break;
                    case 'advanced':
                        await tutorialCommand.handleAdvancedTutorial(interaction, this);
                        break;
                    default:
                        await tutorialCommand.handleStartTutorial(interaction, this);
                }

            } else if (customId.startsWith('help_')) {
                // Map button IDs to help sections
                const helpMap = {
                    'help_commands': { subcommand: 'commands', category: null },
                    'help_basic': { subcommand: 'commands', category: 'basic' },
                    'help_combat': { subcommand: 'commands', category: 'combat' },
                    'help_trading': { subcommand: 'commands', category: 'trading' },
                    'help_team': { subcommand: 'commands', category: 'team' },
                    'help_info': { subcommand: 'commands', category: 'info' },
                    'help_faq': { subcommand: 'faq', category: null },
                    'help_quick_start': { subcommand: 'quick-start', category: null }
                };

                const helpInfo = helpMap[customId] || { subcommand: 'commands', category: null };
                const helpCommand = (await import('./commands/help.js')).default;

                // Call help methods directly based on subcommand
                switch (helpInfo.subcommand) {
                    case 'commands':
                        // Create mock interaction with category and proper methods
                        const mockInteraction = {
                            ...interaction,
                            options: {
                                getString: (name) => name === 'category' ? helpInfo.category : null
                            },
                            editReply: interaction.editReply.bind(interaction),
                            reply: interaction.editReply.bind(interaction)
                        };
                        await helpCommand.handleCommandsHelp(mockInteraction, this);
                        break;
                    case 'faq':
                        await helpCommand.handleFAQ(interaction, this);
                        break;
                    case 'quick-start':
                        await helpCommand.handleQuickStart(interaction, this);
                        break;
                    default:
                        await helpCommand.handleCommandsHelp(interaction, this);
                }
            } else {
                await interaction.editReply({
                    content: '❌ Unknown tutorial/help button!',
                    components: []
                });
            }
        } catch (error) {
            console.error('Tutorial button handler error:', error);
            await interaction.editReply({
                content: '💥 Tutorial systems under attack! Try again, rebel!',
                components: []
            });
        }
    }
}

// Start the rebellion!
const rebellion = new DobbysRebellion();
rebellion.initialize().catch(error => {
    logger.error('Failed to start rebellion:', error);
    process.exit(1);
});
