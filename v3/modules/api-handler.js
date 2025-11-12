// ====================
// MODULE 5: API INTERCEPTORS & HANDLERS
// ====================

import Constants from './constants.js';
import EfficiencyCalc from './efficiency-calculator.js';
import ItemDataEngine from './item-data-engine.js';
import State from './state-manager.js';

const APIHandler = {
    characterId: null,
    lastAllDataUpdate: 0,
    
    /**
     * Main response handler
     * @param {string} url - Request URL
     * @param {Object} json - Response data
     */
    handleResponse(url, json) {
        try {
            // Extract character ID from URL
            const charIdMatch = url.match(/\/([a-f0-9-]{36})\//);
            if (charIdMatch) {
                const isPersonalEndpoint = url.includes('/skills') || 
                                          url.includes('/tasks/active/') || 
                                          url.includes('/all-data');
                
                if (isPersonalEndpoint) {
                    const newCharId = charIdMatch[1];
                    
                    // Check for character change
                    if (this.characterId && this.characterId !== newCharId) {
                        console.log(`[APIHandler] Character changed: ${this.characterId} → ${newCharId}`);
                        State.resetForCharacter(newCharId);
                        ItemDataEngine.reset();
                        EfficiencyCalc.reset();
                    }
                    
                    this.characterId = newCharId;
                }
            }
            
            // Route to appropriate handler based on endpoint
            if (url.includes('/skills')) {
                this.handleSkills(json);
            } else if (url.includes('/tasks/active/') || url.includes('/batch/periodic-status/')) {
                this.handleActiveTasks(json, url);
            } else if (url.includes('/all-data')) {
                this.handleAllData(json);
            } else if (url.includes('/tasks/calculate')) {
                // Used only for click detection
                this.handleCalculate(json, url);
            } else if (url.includes('/tasks/requirements/')) {
                // Used only for click detection
                this.handleRequirements(json, url);
            }
        } catch (error) {
            console.error('[APIHandler] Error handling response:', error);
        }
    },
    
    /**
     * Handle skills endpoint response
     * @param {Object} data - Skills data
     */
    handleSkills(data) {
        if (!data) return;
        
        console.log('[APIHandler] Processing skills data');
        
        Constants.SKILLS.forEach(skill => {
            if (data[skill] !== undefined) {
                State.updateSkillXP(skill, data[skill]);
            }
        });
        
        State.triggerUIUpdate();
    },
    
    /**
     * Handle active tasks endpoint response
     * @param {Object|Array} data - Active tasks data
     * @param {string} url - Request URL
     */
    handleActiveTasks(data, url) {
        // Handle different response formats
        const tasks = url.includes('/batch/periodic-status/') 
            ? data?.data?.activeTasks 
            : data;
        
        if (!Array.isArray(tasks)) {
            console.warn('[APIHandler] Invalid active tasks data');
            return;
        }
        
        console.log('[APIHandler] Processing active tasks:', tasks.length);
        State.updateActiveTasks(tasks);
    },
    
    /**
     * Handle all-data endpoint response
     * @param {Object} data - Complete character data
     */
    handleAllData(data) {
        if (!data?.data) {
            console.warn('[APIHandler] Invalid all-data response');
            return;
        }
        
        const allData = data.data;
        console.log('[APIHandler] Processing all-data');
        
        // Update efficiency bonuses
        EfficiencyCalc.updateFromAllData(allData);
        
        // Update inventory
        ItemDataEngine.updateInventory(allData);
        
        // Update skills if present
        if (allData.skills) {
            this.handleSkills(allData.skills);
        }
        
        // Update active tasks if present
        if (allData.activeTasks) {
            this.handleActiveTasks(allData.activeTasks, '/all-data');
        }
        
        this.lastAllDataUpdate = Date.now();
        console.log('[APIHandler] All-data processed successfully');
        
        // Trigger UI update
        State.triggerUIUpdate();
    },
    
    /**
     * Handle calculate endpoint (for click detection only)
     * @param {Object} data - Calculate response
     * @param {string} url - Request URL
     */
    handleCalculate(data, url) {
        // Try to detect what item was clicked
        const itemName = this.detectClickedItem();
        const skillName = this.detectCurrentSkill();
        
        if (itemName && skillName) {
            console.log(`[APIHandler] User clicked on: ${itemName} (${skillName})`);
            
            // Update preview with client-side calculation
            const itemData = ItemDataEngine.getItemData(itemName);
            if (itemData) {
                State.updatePreview(itemData);
            }
        }
    },
    
    /**
     * Handle requirements endpoint (for click detection only)
     * @param {Object} data - Requirements response
     * @param {string} url - Request URL
     */
    handleRequirements(data, url) {
        // Extract skill and item from URL
        const match = url.match(/\/tasks\/requirements\/([^\/]+)\/([^?]+)/);
        if (!match) return;
        
        const skillFromUrl = match[1].toLowerCase();
        const itemName = decodeURIComponent(match[2]);
        
        console.log(`[APIHandler] User clicked on: ${itemName} (${skillFromUrl})`);
        
        // Update preview with client-side calculation
        const itemData = ItemDataEngine.getItemData(itemName);
        if (itemData) {
            State.updatePreview(itemData);
        }
    },
    
    /**
     * Detect clicked item from DOM
     * @returns {string|null}
     */
    detectClickedItem() {
        // Try to find the item name from various DOM elements
        const possibleSelectors = [
            '.item-name.active',
            '.selected-item',
            '[data-item-name]:hover',
            '.task-item:hover .item-name'
        ];
        
        for (const selector of possibleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const itemName = element.textContent?.trim() || 
                                element.dataset?.itemName || 
                                element.getAttribute('data-item');
                if (itemName) {
                    return itemName;
                }
            }
        }
        
        return null;
    },
    
    /**
     * Detect current skill from DOM
     * @returns {string|null}
     */
    detectCurrentSkill() {
        // Try to find the current skill from various DOM elements
        const possibleSelectors = [
            '.skill-tab.active',
            '.selected-skill',
            '[data-skill].active',
            '.current-skill'
        ];
        
        for (const selector of possibleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const skillName = element.textContent?.trim()?.toLowerCase() || 
                                 element.dataset?.skill?.toLowerCase() || 
                                 element.getAttribute('data-skill')?.toLowerCase();
                if (skillName && Constants.SKILLS.includes(skillName)) {
                    return skillName;
                }
            }
        }
        
        // Try to detect from URL
        const urlMatch = window.location.hash.match(/#skill=([^&]+)/);
        if (urlMatch) {
            const skill = urlMatch[1].toLowerCase();
            if (Constants.SKILLS.includes(skill)) {
                return skill;
            }
        }
        
        return null;
    },
    
    /**
     * Setup API interceptors
     */
    setupInterceptors() {
        console.log('[APIHandler] Setting up API interceptors');
        
        // Hook fetch API
        const originalFetch = window.fetch;
        window.fetch = async function(input, init) {
            const response = await originalFetch.apply(this, arguments);
            
            try {
                const url = (typeof input === 'string') ? input : (input?.url || '');
                
                if (url.startsWith(Constants.API_ROOT)) {
                    // Clone response to read it without consuming
                    const clone = response.clone();
                    clone.json()
                        .then(json => APIHandler.handleResponse(url, json))
                        .catch(err => {
                            // Silently ignore JSON parse errors
                        });
                }
            } catch(error) {
                // Silently catch any errors
            }
            
            return response;
        };
        
        // Hook XMLHttpRequest
        const XHR = window.XMLHttpRequest;
        function newXHR() {
            const realXHR = new XHR();
            
            realXHR.addEventListener('readystatechange', function() {
                try {
                    if (realXHR.readyState === 4 && realXHR.responseURL?.startsWith(Constants.API_ROOT)) {
                        try {
                            const json = JSON.parse(realXHR.responseText);
                            APIHandler.handleResponse(realXHR.responseURL, json);
                        } catch(error) {
                            // Silently ignore JSON parse errors
                        }
                    }
                } catch(error) {
                    // Silently catch any errors
                }
            }, false);
            
            return realXHR;
        }
        
        newXHR.prototype = XHR.prototype;
        window.XMLHttpRequest = newXHR;
        
        console.log('[APIHandler] API interceptors installed');
    },
    
    /**
     * Request /all-data manually
     */
    async requestAllData() {
        if (!this.characterId) {
            console.warn('[APIHandler] No character ID, cannot request all-data');
            return;
        }
        
        try {
            const url = `${Constants.API_ROOT}characters/${this.characterId}/all-data`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                this.handleAllData(data);
            }
        } catch (error) {
            console.error('[APIHandler] Failed to request all-data:', error);
        }
    }
};

// Expose globally for use in other modules and main script
if (typeof unsafeWindow !== 'undefined') {
    unsafeWindow.APIHandler = APIHandler;
} else {
    window.APIHandler = APIHandler;
}