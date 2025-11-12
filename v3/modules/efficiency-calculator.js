// ====================
// MODULE 3: EFFICIENCY CALCULATOR
// ====================

const EfficiencyCalc = {
    // Store latest bonuses from /all-data
    bonuses: {
        membership: false,
        equipment: {},
        pet: {},
        talents: {},
        workshop: {}
    },
    
    /**
     * Update bonuses from /all-data response
     * @param {Object} allData - Response from /all-data endpoint
     */
    updateFromAllData(allData) {
        if (!allData) {
            console.warn('[EfficiencyCalc] No data provided to update bonuses');
            return;
        }
        
        // Update membership bonus (15% if active)
        this.bonuses.membership = allData.activeTasks?.[0]?.membership_bonus || false;
        
        // Update equipment bonuses
        this.bonuses.equipment = allData.equipment?.item_effects || {};
        
        // Update pet bonuses
        this.bonuses.pet = allData.equippedPet?.skills || {};
        
        // Update talent bonuses
        this.bonuses.talents = allData.talentEffects || {};
        
        // Update workshop levels
        this.bonuses.workshop = allData.workshopLevels || {};
        
        console.log('[EfficiencyCalc] Bonuses updated:', {
            membership: this.bonuses.membership,
            equipmentKeys: Object.keys(this.bonuses.equipment),
            petKeys: Object.keys(this.bonuses.pet),
            talentKeys: Object.keys(this.bonuses.talents),
            workshopKeys: Object.keys(this.bonuses.workshop)
        });
    },
    
    /**
     * Calculate total efficiency for a skill
     * @param {string} skillName - Name of the skill (lowercase)
     * @returns {number} Total efficiency percentage
     */
    calculate(skillName) {
        if (!skillName) {
            console.warn('[EfficiencyCalc] No skill name provided');
            return 0;
        }
        
        // Capitalize first letter for equipment/pet bonus keys
        const skillCapitalized = skillName.charAt(0).toUpperCase() + skillName.slice(1).toLowerCase();
        
        // 1. Membership bonus (15% if active)
        const membershipBonus = this.bonuses.membership ? 15 : 0;
        
        // 2. Tool/Equipment bonus (skill-specific)
        const toolBonus = this.bonuses.equipment[`${skillCapitalized} Efficiency`] || 0;
        
        // 3. Pet bonus (skill-specific)
        const petBonus = this.bonuses.pet[`${skillCapitalized} Efficiency`] || 0;
        
        // 4. Talent bonus (global resource_efficiency)
        const talentBonus = this.bonuses.talents.resource_efficiency || 0;
        
        // 5. Workshop bonus (skill-specific, 1 level = +1%)
        const workshopBonus = this.bonuses.workshop[skillName.toLowerCase()] || 0;
        
        // Calculate total
        const totalEfficiency = membershipBonus + toolBonus + petBonus + talentBonus + workshopBonus;
        
        console.log(`[EfficiencyCalc] ${skillName} efficiency breakdown:`, {
            membership: membershipBonus,
            tool: toolBonus,
            pet: petBonus,
            talent: talentBonus,
            workshop: workshopBonus,
            total: totalEfficiency
        });
        
        return totalEfficiency;
    },
    
    /**
     * Calculate modified action time with efficiency
     * @param {number} baseTime - Base action time in seconds
     * @param {number} efficiency - Total efficiency percentage
     * @returns {number} Modified action time
     */
    calculateModifiedTime(baseTime, efficiency) {
        if (!baseTime || baseTime <= 0) {
            return 0;
        }
        
        // Apply efficiency reduction (efficiency is a percentage)
        const modifiedTime = baseTime * (1 - efficiency / 100);
        
        // Round to 1 decimal place
        return Math.round(modifiedTime * 10) / 10;
    },
    
    /**
     * Get all current bonuses
     * @returns {Object} Current bonuses state
     */
    getBonuses() {
        return JSON.parse(JSON.stringify(this.bonuses));
    },
    
    /**
     * Reset all bonuses to default
     */
    reset() {
        this.bonuses = {
            membership: false,
            equipment: {},
            pet: {},
            talents: {},
            workshop: {}
        };
        console.log('[EfficiencyCalc] Bonuses reset to default');
    },
    
    /**
     * Get efficiency breakdown for a skill
     * @param {string} skillName 
     * @returns {Object} Detailed breakdown of efficiency bonuses
     */
    getEfficiencyBreakdown(skillName) {
        if (!skillName) {
            return null;
        }
        
        const skillCapitalized = skillName.charAt(0).toUpperCase() + skillName.slice(1).toLowerCase();
        
        return {
            skill: skillName,
            membership: {
                active: this.bonuses.membership,
                value: this.bonuses.membership ? 15 : 0
            },
            equipment: {
                bonus: this.bonuses.equipment[`${skillCapitalized} Efficiency`] || 0
            },
            pet: {
                bonus: this.bonuses.pet[`${skillCapitalized} Efficiency`] || 0
            },
            talent: {
                resourceEfficiency: this.bonuses.talents.resource_efficiency || 0
            },
            workshop: {
                level: this.bonuses.workshop[skillName.toLowerCase()] || 0,
                bonus: this.bonuses.workshop[skillName.toLowerCase()] || 0
            },
            total: this.calculate(skillName)
        };
    },
    
    /**
     * Check if bonuses have been initialized
     * @returns {boolean}
     */
    isInitialized() {
        return Object.keys(this.bonuses.equipment).length > 0 ||
               Object.keys(this.bonuses.pet).length > 0 ||
               Object.keys(this.bonuses.talents).length > 0 ||
               Object.keys(this.bonuses.workshop).length > 0;
    }
};

// Expose globally for use in other modules and main script
if (typeof unsafeWindow !== 'undefined') {
    unsafeWindow.EfficiencyCalc = EfficiencyCalc;
} else {
    window.EfficiencyCalc = EfficiencyCalc;
}