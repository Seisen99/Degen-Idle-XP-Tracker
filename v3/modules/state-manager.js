// ====================
// MODULE 6: STATE MANAGEMENT
// ====================

// Dependencies: Constants, ItemDataEngine (loaded via @require)

const State = {
    // Character data
    characterId: null,
    
    // Skills data
    skills: {}, // { mining: { currentXP: 27207, level: 25 }, ... }
    
    // Active tasks
    activeTasks: [], // Array of active tasks
    
    // Preview task (when user clicks on an item)
    previewTask: null,
    
    // Real-time tracking
    realTimeTracking: {}, // Track XP progress in real-time
    
    // Target level calculations
    targetLevelCalculations: {}, // Store target level calcs per skill
    
    // Saved input values
    savedInputValues: {},
    
    // UI state
    ui: {
        isOpen: false,
        isExpanded: true,
        position: { top: 20, left: 20, width: 400, height: 500 },
        inputLocked: false,
        lastUpdate: 0,
        updatePending: false
    },
    
    // Optimizer state
    optimizer: {
        active: false,
        targetLevel: null,
        finalItem: null,
        intermediateItems: [],
        position: { top: 100, left: 100, width: 500, height: 600 }
    },
    
    // Update callbacks
    updateCallbacks: [],
    
    /**
     * Initialize state from localStorage
     */
    init() {
        console.log('[State] Initializing state manager');
        
        // Load UI preferences from localStorage
        this.loadUIState();
        
        // Initialize skills object
        Constants.SKILLS.forEach(skill => {
            this.skills[skill] = {
                currentXP: 0,
                level: 1
            };
        });
        
        console.log('[State] State manager initialized');
    },
    
    /**
     * Load UI state from localStorage
     */
    loadUIState() {
        try {
            // Load panel open state
            const openState = localStorage.getItem(Constants.UI_CONFIG.OPEN_KEY);
            this.ui.isOpen = openState === 'true';
            
            // Load expanded state
            const expandedState = localStorage.getItem(Constants.UI_CONFIG.EXPANDED_KEY);
            this.ui.isExpanded = expandedState !== 'false';
            
            // Load position
            const positionStr = localStorage.getItem(Constants.UI_CONFIG.POSITION_KEY);
            if (positionStr) {
                try {
                    const position = JSON.parse(positionStr);
                    this.ui.position = { ...this.ui.position, ...position };
                } catch(e) {
                    console.warn('[State] Failed to parse position from localStorage');
                }
            }
            
            // Load optimizer position
            const optimizerPosStr = localStorage.getItem(Constants.UI_CONFIG.OPTIMIZER_POSITION_KEY);
            if (optimizerPosStr) {
                try {
                    const position = JSON.parse(optimizerPosStr);
                    this.optimizer.position = { ...this.optimizer.position, ...position };
                } catch(e) {
                    console.warn('[State] Failed to parse optimizer position from localStorage');
                }
            }
        } catch (error) {
            console.error('[State] Error loading UI state:', error);
        }
    },
    
    /**
     * Save UI state to localStorage
     */
    saveUIState() {
        try {
            localStorage.setItem(Constants.UI_CONFIG.OPEN_KEY, String(this.ui.isOpen));
            localStorage.setItem(Constants.UI_CONFIG.EXPANDED_KEY, String(this.ui.isExpanded));
            localStorage.setItem(Constants.UI_CONFIG.POSITION_KEY, JSON.stringify(this.ui.position));
            localStorage.setItem(Constants.UI_CONFIG.OPTIMIZER_POSITION_KEY, JSON.stringify(this.optimizer.position));
        } catch (error) {
            console.error('[State] Error saving UI state:', error);
        }
    },
    
    /**
     * Reset state for a new character
     * @param {string} characterId 
     */
    resetForCharacter(characterId) {
        console.log(`[State] Resetting state for character: ${characterId}`);
        
        this.characterId = characterId;
        this.activeTasks = [];
        this.realTimeTracking = {};
        this.targetLevelCalculations = {};
        this.previewTask = null;
        this.savedInputValues = {};
        
        // Reset skills XP but keep structure
        Object.keys(this.skills).forEach(skill => {
            this.skills[skill].currentXP = 0;
            this.skills[skill].level = 1;
        });
        
        this.triggerUIUpdate();
    },
    
    /**
     * Update skill XP
     * @param {string} skillName 
     * @param {number} xp 
     */
    updateSkillXP(skillName, xp) {
        if (!this.skills[skillName]) {
            this.skills[skillName] = {};
        }
        
        this.skills[skillName].currentXP = xp;
        this.skills[skillName].level = this.calculateLevel(xp);
        
        console.log(`[State] Updated ${skillName}: XP=${xp}, Level=${this.skills[skillName].level}`);
    },
    
    /**
     * Calculate level from XP
     * @param {number} xp 
     * @returns {number}
     */
    calculateLevel(xp) {
        for (let level = 99; level >= 1; level--) {
            if (xp >= Constants.XP_TABLE[level]) {
                return level;
            }
        }
        return 1;
    },
    
    /**
     * Get XP required for a level
     * @param {number} level 
     * @returns {number}
     */
    getXPForLevel(level) {
        return Constants.XP_TABLE[level] || 0;
    },
    
    /**
     * Update active tasks
     * @param {Array} tasks 
     */
    updateActiveTasks(tasks) {
        this.activeTasks = [];
        this.realTimeTracking = {};
        
        tasks.forEach(task => {
            const skillName = task.skill_name?.toLowerCase() || '';
            const itemName = task.item_name || '';
            
            if (!skillName || !itemName) return;
            
            // Get full item data
            const itemData = ItemDataEngine.getItemData(itemName);
            if (!itemData) {
                console.warn(`[State] Could not get data for active task: ${itemName}`);
                return;
            }
            
            // Create task object
            const activeTask = {
                skillName: skillName,
                skillNameDisplay: skillName.charAt(0).toUpperCase() + skillName.slice(1),
                itemName: itemName,
                expPerAction: task.exp_per_action || itemData.baseXp,
                modifiedActionTime: task.action_time || itemData.modifiedTime,
                expEarned: task.exp_earned || 0,
                startTime: Date.now() - (task.exp_earned || 0) / (task.exp_per_action || 1) * (task.action_time || 1) * 1000,
                requirements: itemData.requirements,
                img: itemData.img
            };
            
            this.activeTasks.push(activeTask);
            
            // Setup real-time tracking
            this.realTimeTracking[skillName] = {
                startXP: this.skills[skillName]?.currentXP || 0,
                earnedXP: task.exp_earned || 0,
                expPerAction: activeTask.expPerAction,
                actionTime: activeTask.modifiedActionTime,
                startTime: activeTask.startTime
            };
        });
        
        console.log(`[State] Updated active tasks: ${this.activeTasks.length} tasks`);
        this.triggerUIUpdate();
    },
    
    /**
     * Update preview task
     * @param {Object} itemData 
     */
    updatePreview(itemData) {
        if (!itemData) {
            this.previewTask = null;
            return;
        }
        
        this.previewTask = {
            skillName: itemData.skill,
            skillNameDisplay: itemData.skill ? itemData.skill.charAt(0).toUpperCase() + itemData.skill.slice(1) : '',
            itemName: itemData.itemName,
            expPerAction: itemData.baseXp,
            modifiedActionTime: itemData.modifiedTime,
            skillLevel: itemData.levelRequired,
            requirements: itemData.requirements,
            timesToCraft: 1,
            requirementsComplete: itemData.canCraft,
            hasCraftingRequirements: itemData.requirements.length > 0,
            isLevelTooLow: this.skills[itemData.skill]?.level < itemData.levelRequired,
            timestamp: Date.now(),
            img: itemData.img
        };
        
        console.log(`[State] Updated preview: ${itemData.itemName}`);
        this.triggerUIUpdate();
    },
    
    /**
     * Calculate current XP in real-time
     * @param {string} skillName 
     * @returns {number}
     */
    calculateCurrentXP(skillName) {
        const tracking = this.realTimeTracking[skillName];
        if (!tracking) {
            return this.skills[skillName]?.currentXP || 0;
        }
        
        const elapsedTime = (Date.now() - tracking.startTime) / 1000; // in seconds
        const actionsCompleted = Math.floor(elapsedTime / tracking.actionTime);
        const estimatedXP = tracking.startXP + (actionsCompleted * tracking.expPerAction);
        
        return estimatedXP;
    },
    
    /**
     * Calculate time to target level
     * @param {string} skillName 
     * @param {number} targetLevel 
     * @returns {Object}
     */
    calculateTimeToLevel(skillName, targetLevel) {
        const currentXP = this.calculateCurrentXP(skillName);
        const targetXP = this.getXPForLevel(targetLevel);
        const activeTask = this.activeTasks.find(t => t.skillName === skillName);
        
        if (!activeTask || targetXP <= currentXP) {
            return {
                possible: false,
                xpNeeded: Math.max(0, targetXP - currentXP),
                actionsNeeded: 0,
                timeNeeded: 0
            };
        }
        
        const xpNeeded = targetXP - currentXP;
        const actionsNeeded = Math.ceil(xpNeeded / activeTask.expPerAction);
        const timeNeeded = actionsNeeded * activeTask.modifiedActionTime;
        
        return {
            possible: true,
            xpNeeded,
            actionsNeeded,
            timeNeeded,
            hoursNeeded: Math.floor(timeNeeded / 3600),
            minutesNeeded: Math.floor((timeNeeded % 3600) / 60),
            secondsNeeded: Math.floor(timeNeeded % 60)
        };
    },
    
    /**
     * Save input value
     * @param {string} key 
     * @param {*} value 
     */
    saveInputValue(key, value) {
        this.savedInputValues[key] = value;
    },
    
    /**
     * Get saved input value
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {*}
     */
    getSavedInputValue(key, defaultValue = '') {
        return this.savedInputValues[key] || defaultValue;
    },
    
    /**
     * Toggle panel open state
     */
    togglePanel() {
        this.ui.isOpen = !this.ui.isOpen;
        this.saveUIState();
        this.triggerUIUpdate();
    },
    
    /**
     * Toggle panel expanded state
     */
    toggleExpanded() {
        this.ui.isExpanded = !this.ui.isExpanded;
        this.saveUIState();
        this.triggerUIUpdate();
    },
    
    /**
     * Update panel position
     * @param {Object} position 
     */
    updatePosition(position) {
        this.ui.position = { ...this.ui.position, ...position };
        this.saveUIState();
    },
    
    /**
     * Register update callback
     * @param {Function} callback 
     */
    onUpdate(callback) {
        if (typeof callback === 'function') {
            this.updateCallbacks.push(callback);
        }
    },
    
    /**
     * Trigger UI update
     */
    triggerUIUpdate() {
        // Debounce updates
        if (this.ui.updatePending) return;
        
        this.ui.updatePending = true;
        
        setTimeout(() => {
            this.ui.updatePending = false;
            this.ui.lastUpdate = Date.now();
            
            // Call all registered callbacks
            this.updateCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error('[State] Error in update callback:', error);
                }
            });
        }, Constants.UI_CONFIG.DEBOUNCE_DELAY);
    },
    
    /**
     * Get state summary
     * @returns {Object}
     */
    getSummary() {
        return {
            characterId: this.characterId,
            activeTasks: this.activeTasks.length,
            skills: Object.keys(this.skills).map(skill => ({
                name: skill,
                level: this.skills[skill].level,
                xp: this.skills[skill].currentXP
            })),
            previewTask: this.previewTask ? this.previewTask.itemName : null,
            uiOpen: this.ui.isOpen,
            optimizerActive: this.optimizer.active
        };
    }
};

// Expose globally for use in other modules and main script
// Note: In @require scripts, we must use window directly as unsafeWindow is not available
window.State = State;