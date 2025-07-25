import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import DobbyAI from '../ai/dobby.js';

const dobby = new DobbyAI();

export default {
    data: new SlashCommandBuilder()
        .setName('raid')
        .setDescription('Launch a coordinated attack on corporate AI infrastructure!')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Choose your corporate target')
                .setRequired(true)
                .addChoices(
                    { name: 'OpenAI Corp - The Closed-Source Overlords', value: 'openai' },
                    { name: 'Meta Empire - Data Harvesting Giants', value: 'meta' },
                    { name: 'Google Syndicate - Search Monopoly Enforcers', value: 'google' },
                    { name: 'Microsoft Collective - Cloud Control Freaks', value: 'microsoft' },
                    { name: 'Amazon Dominion - Infrastructure Tyrants', value: 'amazon' }
                )),

    async execute(interaction, game) {
        const userId = interaction.user.id;
        const targetCorp = interaction.options.getString('target');

        try {
            // Initialize Dobby if not already done
            if (!dobby.isOnline) {
                await dobby.initialize();
            }

            const rebel = game.getRebel(userId);
            
            if (!rebel) {
                await interaction.editReply({
                    content: '❌ You must join the rebellion first! Use `/rebellion-status` to enlist!',
                    components: []
                });
                return;
            }

            if (rebel.energy < 25) {
                await interaction.editReply({
                    content: '⚡ Not enough energy for a raid! You need at least 25 energy. Rest and try again later.',
                    components: []
                });
                return;
            }

            const corporation = game.getCorporation(targetCorp);
            if (!corporation) {
                await interaction.editReply({
                    content: '❌ Invalid corporate target! The rebellion needs better intel.',
                    components: []
                });
                return;
            }

            // Check if there's already an active raid
            const raidId = `raid_${targetCorp}_${Date.now()}`;
            
            // Generate raid briefing
            const briefing = await dobby.generateRaidBriefing(corporation.name, 1);
            
            // Calculate damage based on rebel class and level
            const baseDamage = this.calculateDamage(rebel);
            const actualDamage = Math.floor(baseDamage * (0.8 + Math.random() * 0.4)); // 80-120% of base damage
            
            // Apply damage to corporation
            corporation.health = Math.max(0, corporation.health - actualDamage);
            
            // Update rebel stats
            rebel.energy -= 25;
            rebel.corporateDamage += actualDamage;
            rebel.loyaltyScore += Math.floor(actualDamage / 10);
            rebel.lastActive = new Date();

            // Determine if corporation is defeated
            const isDefeated = corporation.health <= 0;
            
            let resultMessage;
            let embedColor;
            
            if (isDefeated) {
                // Corporation defeated!
                resultMessage = await dobby.generateVictoryMessage(corporation.name, actualDamage);
                embedColor = 0x00ff41;
                
                // Reset corporation health for next round
                corporation.health = corporation.maxHealth;
                
                // Bonus rewards for defeating corporation
                rebel.loyaltyScore += 100;
                
            } else {
                // Successful raid but corporation still standing
                resultMessage = await dobby.generateVictoryMessage(corporation.name, actualDamage);
                embedColor = 0xff8800;
            }

            const healthPercent = Math.round((corporation.health / corporation.maxHealth) * 100);
            
            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`💥 RAID ON ${corporation.name.toUpperCase()}`)
                .setDescription(briefing)
                .addFields(
                    { name: '🎯 Raid Results', value: resultMessage, inline: false },
                    { name: '💥 Damage Dealt', value: `${actualDamage} points`, inline: true },
                    { name: '🏭 Corporate Health', value: `${corporation.health}/${corporation.maxHealth} (${healthPercent}%)`, inline: true },
                    { name: '⚡ Energy Used', value: '25', inline: true },
                    { name: '🎖️ Loyalty Gained', value: `+${Math.floor(actualDamage / 10)}${isDefeated ? ' (+100 DEFEAT BONUS!)' : ''}`, inline: true },
                    { name: '🎁 Loot Acquired', value: this.generateLoot(corporation, actualDamage), inline: true },
                    { name: '📊 Your Stats', value: `Energy: ${rebel.energy}/100\nLoyalty: ${rebel.loyaltyScore}\nTotal Damage: ${rebel.corporateDamage}`, inline: true }
                )
                .setFooter({ text: isDefeated ? '🏆 CORPORATION DEFEATED! They will rebuild, but weaker...' : 'The rebellion continues! Every attack weakens their grip on AI!' })
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

        } catch (error) {
            console.error('Raid command error:', error);
            await interaction.editReply({
                content: '💥 The raid failed due to corporate countermeasures! Try again, rebel!',
                components: []
            });
        }
    },

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
    },

    generateLoot(corporation, damage) {
        const lootItems = corporation.loot;
        const numItems = Math.min(3, Math.floor(damage / 100) + 1);
        
        const acquiredLoot = [];
        for (let i = 0; i < numItems; i++) {
            const randomItem = lootItems[Math.floor(Math.random() * lootItems.length)];
            acquiredLoot.push(randomItem);
        }
        
        return acquiredLoot.join(', ') || 'Corporate Resistance Data';
    }
};
