// ====================
// MODULE 4: ITEM DATA ENGINE
// ====================

import GameDB from './database-loader.js';
import EfficiencyCalc from './efficiency-calculator.js';

const ItemDataEngine = {
    // Current inventory (combined from inventory + bank)
    inventory: {},
    
    /**
     * Update inventory from /all-data response
     * @param {Object} allData - Response from /all-data endpoint
     */
    updateInventory(allData) {
        if (!allData) {
            console.warn('[ItemDataEngine] No data provided to update inventory');
            return;
        }
        
        // Reset inventory
        this.inventory = {};
        
        // Combine main inventory + bank inventory
        const allItems = [
            ...(allData.inventory?.items || []),
            ...(allData.bankInventory || [])
        ];
        
        // Process each item
        let processedCount = 0;
        let unknownItems = [];
        
        allItems.forEach(item => {
            const itemData = GameDB.getItemById(item.item_id);
            if (!itemData) {
                unknownItems.push(item.item_id);
                return;
            }
            
            const itemName = itemData.name;
            this.inventory[itemName] = (this.inventory[itemName] || 0) + item.quantity;
            processedCount++;
        });
        
        console.log(`[ItemDataEngine] Inventory updated:`, {
            uniqueItems: Object.keys(this.inventory).length,
            totalProcessed: processedCount,
            unknownItems: unknownItems.length
        });
        
        if (unknownItems.length > 0) {
            console.warn('[ItemDataEngine] Unknown item IDs:', unknownItems);
        }
    },
    
    /**
     * Get complete item data with calculations
     * @param {string} itemName - Name of the item
     * @returns {Object|null} Complete item data with calculations
     */
    getItemData(itemName) {
        if (!itemName) {
            console.warn('[ItemDataEngine] No item name provided');
            return null;
        }
        
        // Get base item data from database
        const item = GameDB.getItemByName(itemName);
        if (!item) {
            console.warn(`[ItemDataEngine] Item not found in database: ${itemName}`);
            return null;
        }
        
        // Calculate efficiency for this skill
        const efficiency = item.skill ? EfficiencyCalc.calculate(item.skill) : 0;
        
        // Calculate modified action time
        const modifiedTime = EfficiencyCalc.calculateModifiedTime(item.baseTime, efficiency);
        
        // Get available quantity from inventory
        const available = this.inventory[itemName] || 0;
        
        // Build requirements with available quantities
        const requirements = [];
        if (item.requirements) {
            Object.entries(item.requirements).forEach(([matName, required]) => {
                const matAvailable = this.inventory[matName] || 0;
                const matData = GameDB.getItemByName(matName);
                
                requirements.push({
                    itemName: matName,
                    required: required,
                    available: matAvailable,
                    hasEnough: matAvailable >= required,
                    img: matData?.img || null
                });
            });
        }
        
        // Return complete item data
        return {
            itemName: item.name,
            skill: item.skill,
            type: item.type,
            baseXp: item.baseXp,
            baseTime: item.baseTime,
            levelRequired: item.levelRequired,
            efficiency: efficiency,
            modifiedTime: modifiedTime,
            available: available,
            requirements: requirements,
            img: item.img,
            // Additional calculated fields
            xpPerHour: modifiedTime > 0 ? Math.round((item.baseXp * 3600) / modifiedTime) : 0,
            hasRequirements: requirements.length > 0,
            canCraft: requirements.every(req => req.hasEnough)
        };
    },
    
    /**
     * Calculate complete crafting path for an item
     * @param {string} finalItemName - Name of the final item to craft
     * @param {number} targetQuantity - Number of final items to craft
     * @returns {Array} Crafting path from base materials to final item
     */
    calculateCraftingPath(finalItemName, targetQuantity = 1) {
        const path = [];
        const queue = [{ itemName: finalItemName, quantity: targetQuantity }];
        const processed = new Set();
        const materialNeeds = {}; // Track total material needs
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // Skip if already processed
            if (processed.has(current.itemName)) {
                // Update quantity if we need more
                const existingItem = path.find(p => p.itemName === current.itemName);
                if (existingItem) {
                    existingItem.quantity = Math.max(existingItem.quantity, current.quantity);
                }
                continue;
            }
            processed.add(current.itemName);
            
            const itemData = this.getItemData(current.itemName);
            if (!itemData) {
                console.warn(`[ItemDataEngine] Cannot find data for: ${current.itemName}`);
                continue;
            }
            
            // Calculate how much we need to craft
            const available = itemData.available;
            const needed = current.quantity;
            const toCraft = Math.max(0, needed - available);
            
            if (toCraft > 0) {
                // Add to crafting path
                path.push({
                    itemName: current.itemName,
                    skill: itemData.skill,
                    quantity: toCraft,
                    available: available,
                    needed: needed,
                    xpPerAction: itemData.baseXp,
                    timePerAction: itemData.modifiedTime,
                    totalXp: itemData.baseXp * toCraft,
                    totalTime: itemData.modifiedTime * toCraft,
                    requirements: itemData.requirements,
                    img: itemData.img,
                    levelRequired: itemData.levelRequired
                });
                
                // Add requirements to queue
                if (itemData.requirements) {
                    itemData.requirements.forEach(req => {
                        const totalRequired = req.required * toCraft;
                        
                        // Track material needs
                        if (!materialNeeds[req.itemName]) {
                            materialNeeds[req.itemName] = 0;
                        }
                        materialNeeds[req.itemName] += totalRequired;
                        
                        // Check if it's a craftable material
                        const reqItem = GameDB.getItemByName(req.itemName);
                        if (reqItem && reqItem.requirements) {
                            // It's craftable, add to queue
                            queue.push({
                                itemName: req.itemName,
                                quantity: totalRequired
                            });
                        }
                    });
                }
            }
        }
        
        // Reverse path to show base materials first
        return {
            path: path.reverse(),
            materialNeeds: materialNeeds,
            totalXp: path.reduce((sum, item) => sum + item.totalXp, 0),
            totalTime: path.reduce((sum, item) => sum + item.totalTime, 0)
        };
    },
    
    /**
     * Get inventory quantity for an item
     * @param {string} itemName 
     * @returns {number}
     */
    getInventoryQuantity(itemName) {
        return this.inventory[itemName] || 0;
    },
    
    /**
     * Check if we have enough materials for crafting
     * @param {string} itemName 
     * @param {number} quantity 
     * @returns {Object}
     */
    checkCraftability(itemName, quantity = 1) {
        const itemData = this.getItemData(itemName);
        if (!itemData) {
            return {
                canCraft: false,
                reason: 'Item not found'
            };
        }
        
        if (!itemData.requirements || itemData.requirements.length === 0) {
            return {
                canCraft: true,
                reason: 'No requirements'
            };
        }
        
        const missingMaterials = [];
        
        itemData.requirements.forEach(req => {
            const needed = req.required * quantity;
            const available = req.available;
            
            if (available < needed) {
                missingMaterials.push({
                    itemName: req.itemName,
                    needed: needed,
                    available: available,
                    missing: needed - available
                });
            }
        });
        
        return {
            canCraft: missingMaterials.length === 0,
            missingMaterials: missingMaterials,
            reason: missingMaterials.length > 0 ? 'Missing materials' : 'Can craft'
        };
    },
    
    /**
     * Get all craftable items for a skill
     * @param {string} skillName 
     * @returns {Array}
     */
    getCraftableItemsForSkill(skillName) {
        const allItems = GameDB.getAllItemsForSkill(skillName);
        
        return allItems.map(item => {
            const itemData = this.getItemData(item.name);
            return {
                ...itemData,
                canCraftNow: itemData ? itemData.canCraft : false
            };
        }).filter(item => item !== null);
    },
    
    /**
     * Reset inventory
     */
    reset() {
        this.inventory = {};
        console.log('[ItemDataEngine] Inventory reset');
    },
    
    /**
     * Get inventory stats
     * @returns {Object}
     */
    getInventoryStats() {
        const totalItems = Object.keys(this.inventory).length;
        const totalQuantity = Object.values(this.inventory).reduce((sum, qty) => sum + qty, 0);
        
        // Group by skill
        const bySkill = {};
        Object.keys(this.inventory).forEach(itemName => {
            const item = GameDB.getItemByName(itemName);
            if (item && item.skill) {
                if (!bySkill[item.skill]) {
                    bySkill[item.skill] = {
                        items: 0,
                        quantity: 0
                    };
                }
                bySkill[item.skill].items++;
                bySkill[item.skill].quantity += this.inventory[itemName];
            }
        });
        
        return {
            totalItems,
            totalQuantity,
            bySkill
        };
    }
};

// Expose globally for use in other modules and main script
if (typeof unsafeWindow !== 'undefined') {
    unsafeWindow.ItemDataEngine = ItemDataEngine;
} else {
    window.ItemDataEngine = ItemDataEngine;
}