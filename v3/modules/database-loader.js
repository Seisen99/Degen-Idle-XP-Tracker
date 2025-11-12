// ====================
// MODULE 2: STATIC DATABASE LOADER
// ====================

const GameDB = {
    data: null,
    
    /**
     * Initialize the game database
     */
    init() {
        try {
            // In production, this would be the embedded database
            // For now, we import it directly
            this.data = gameDatabase;
            
            console.log(`[GameDB] Loaded ${this.data.total_items} items (v${this.data.version})`);
            console.log('[GameDB] Database initialized successfully');
            
            // Validate database structure
            this.validateDatabase();
            
            return true;
        } catch (error) {
            console.error('[GameDB] Failed to initialize database:', error);
            return false;
        }
    },
    
    /**
     * Validate database structure
     */
    validateDatabase() {
        if (!this.data) {
            throw new Error('Database not loaded');
        }
        
        if (!this.data.items || typeof this.data.items !== 'object') {
            throw new Error('Invalid database structure: missing items');
        }
        
        if (!this.data.itemNameToId || typeof this.data.itemNameToId !== 'object') {
            throw new Error('Invalid database structure: missing itemNameToId mapping');
        }
        
        console.log('[GameDB] Database validation passed');
    },
    
    /**
     * Get item by ID
     * @param {string|number} itemId 
     * @returns {Object|null}
     */
    getItemById(itemId) {
        if (!this.data || !this.data.items) {
            console.error('[GameDB] Database not initialized');
            return null;
        }
        
        // Convert to string if number
        const id = String(itemId);
        return this.data.items[id] || null;
    },
    
    /**
     * Get item by name
     * @param {string} itemName 
     * @returns {Object|null}
     */
    getItemByName(itemName) {
        if (!this.data || !this.data.itemNameToId) {
            console.error('[GameDB] Database not initialized');
            return null;
        }
        
        const itemId = this.data.itemNameToId[itemName];
        if (!itemId) {
            console.warn(`[GameDB] Item not found: ${itemName}`);
            return null;
        }
        
        return this.getItemById(itemId);
    },
    
    /**
     * Get all items for a specific skill
     * @param {string} skillName 
     * @returns {Array}
     */
    getAllItemsForSkill(skillName) {
        if (!this.data || !this.data.items) {
            console.error('[GameDB] Database not initialized');
            return [];
        }
        
        const normalizedSkill = skillName.toLowerCase();
        return Object.values(this.data.items).filter(item => 
            item.skill === normalizedSkill
        );
    },
    
    /**
     * Get items by type
     * @param {string} type 
     * @returns {Array}
     */
    getItemsByType(type) {
        if (!this.data || !this.data.items) {
            console.error('[GameDB] Database not initialized');
            return [];
        }
        
        return Object.values(this.data.items).filter(item => 
            item.type === type
        );
    },
    
    /**
     * Search items by partial name
     * @param {string} searchTerm 
     * @returns {Array}
     */
    searchItems(searchTerm) {
        if (!this.data || !this.data.items) {
            console.error('[GameDB] Database not initialized');
            return [];
        }
        
        const term = searchTerm.toLowerCase();
        return Object.values(this.data.items).filter(item => 
            item.name.toLowerCase().includes(term)
        );
    },
    
    /**
     * Get item ID from name
     * @param {string} itemName 
     * @returns {string|null}
     */
    getItemId(itemName) {
        if (!this.data || !this.data.itemNameToId) {
            console.error('[GameDB] Database not initialized');
            return null;
        }
        
        return this.data.itemNameToId[itemName] || null;
    },
    
    /**
     * Check if item exists
     * @param {string} itemName 
     * @returns {boolean}
     */
    itemExists(itemName) {
        return this.getItemId(itemName) !== null;
    },
    
    /**
     * Get database stats
     * @returns {Object}
     */
    getStats() {
        if (!this.data) {
            return { loaded: false };
        }
        
        const skillCounts = {};
        const typeCounts = {};
        
        Object.values(this.data.items).forEach(item => {
            // Count by skill
            if (item.skill) {
                skillCounts[item.skill] = (skillCounts[item.skill] || 0) + 1;
            }
            
            // Count by type
            if (item.type) {
                typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
            }
        });
        
        return {
            loaded: true,
            version: this.data.version,
            totalItems: this.data.total_items,
            lastUpdated: this.data.last_updated,
            skillCounts,
            typeCounts
        };
    }
};

// Expose globally for use in other modules and main script
if (typeof unsafeWindow !== 'undefined') {
    unsafeWindow.GameDB = GameDB;
} else {
    window.GameDB = GameDB;
}