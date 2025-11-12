// ====================
// MODULE 6: STATE MANAGEMENT (ENHANCED)
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
    
    // Real-time tracking (from v2)
    realTimeTracking: {}, // Track XP progress in real-time
    
    // Target level calculations
    targetLevelCalculations: {}, // Store target level calcs per skill
    
    // Saved input values
    savedInputValues: {},
    
    // Requirements cache (from v2)
    requirementsCache: {},
    
    // UI state
    ui: {
        isOpen: false,
        isExpanded: true,
        position: { top: 100, left: null, right: 10, width: 380, height: null },
        inputLocked: false,
        updateLockUntil: 0,
        lastUpdate: 0,
        updatePending: false
    },
    
    // Optimizer state (from v2)
    optimizer: {
        active: false,
        step: 0,
        targetLevel: null,
        currentSkill: null,
        finalItem: null,
        materials: [],
        craftingCache: {}, // Per-character cache
        waitingForClick: false,
        pendingMaterials: [],
        position: { top: 100, left: '50%', right: null, width: 500, height: null, transform: 'translateX(-50%)' },
        // Save results for re-rendering on resize
        savedPath: null,
        savedCurrentLevel: null,
        savedXpNeeded: null
    },
    
    // Update callbacks
    updateCallbacks: [],
    
    /**
     * Initialize state from localStorage
     */
    init() {
        console.log('[State] Initializing enhanced state manager');
        
        // Load UI preferences from localStorage
        this.loadUIState();
        
        // Initialize skills object
        Constants.SKILLS.forEach(skill => {
            this.skills[skill] = {
                currentXP: 0,
                level: 1
            };
        });
        
        console.log('[State] Enhanced state manager initialized');
    },
    
    /**
     * Load UI state from localStorage (v2 compatible)
     */
    loadUIState() {
        try {
            // Load panel open state
            const openState = localStorage.getItem('degenLevelTracker_open');
            this.ui.isOpen = openState === 'true';
            
            // Load expanded state
            const expandedState = localStorage.getItem('degenLevelTracker_expanded');
            this.ui.isExpanded = expandedState !== 'false';
            
            // Load position
            const positionStr = localStorage.getItem('degenLevelTracker_position');
            if (positionStr) {
                try {
                    const position = JSON.parse(positionStr);
                    this.ui.position = { ...this.ui.position, ...position };
                } catch(e) {
                    console.warn('[State] Failed to parse position from localStorage');
                }
            }
            
            // Load optimizer position
            const optimizerPosStr = localStorage.getItem('degenOptimizerPosition');
            if (optimizerPosStr) {
                try {
                    const position = JSON.parse(optimizerPosStr);
                    this.optimizer.position = { ...this.optimizer.position, ...position };
                } catch(e) {
                    console.warn('[State] Failed to parse optimizer position from localStorage');
                }
            }
            
            // Load optimizer cache if character ID exists
            if (this.characterId) {
                this.loadOptimizerCache();
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
            localStorage.setItem('degenLevelTracker_open', String(this.ui.isOpen));
            localStorage.setItem('degenLevelTracker_expanded', String(this.ui.isExpanded));
            localStorage.setItem('degenLevelTracker_position', JSON.stringify(this.ui.position));
            localStorage.setItem('degenOptimizerPosition', JSON.stringify(this.optimizer.position));
        } catch (error) {
            console.error('[State] Error saving UI state:', error);
        }
    },
    
    /**
     * Load optimizer cache for current character
     */
    loadOptimizerCache() {
        if (!this.characterId) return;
        
        try {
            const cacheKey = `degenCraftingPathCache_${this.characterId}`;
            const cached = localStorage.getItem(cacheKey);
            this.optimizer.craftingCache = cached ? JSON.parse(cached) : {};
            console.log(`[State] Loaded optimizer cache for character ${this.characterId}`);
        } catch (e) {
            console.error('[State] Failed to load optimizer cache:', e);
            this.optimizer.craftingCache = {};
        }
    },
    
    /**
     * Save optimizer cache for current character
     */
    saveOptimizerCache() {
        if (!this.characterId) {
            console.warn('[State] Cannot save cache: no character ID');
            return;
        }
        
        try {
            const cacheKey = `degenCraftingPathCache_${this.characterId}`;
            localStorage.setItem(cacheKey, JSON.stringify(this.optimizer.craftingCache));
        } catch (e) {
            console.error('[State] Failed to save optimizer cache:', e);
        }
    },
    
    /**
     * Reset state for a new character
     * @param {string} characterId 
     */
    resetForCharacter(characterId) {
        console.log(`[State] Resetting state for character: ${characterId}`);
        
        // Detect character change
        const characterChanged = this.characterId && this.characterId !== characterId;
        
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
        
        // Load optimizer cache for new character
        if (characterChanged || !this.optimizer.craftingCache) {
            this.loadOptimizerCache();
        }
        
        this.triggerUIUpdate();
    },
    
    /**
     * Update skill XP
     * @param {string} skillName 
     * @param {number} xp 
     */
    updateSkillXP(skillName, xp) {
        const skillLower = skillName.toLowerCase();
        
        if (!this.skills[skillLower]) {
            this.skills[skillLower] = {};
        }
        
        this.skills[skillLower].currentXP = xp;
        this.skills[skillLower].level = this.calculateLevel(xp);
        
        console.log(`[State] Updated ${skillLower}: XP=${xp}, Level=${this.skills[skillLower].level}`);
    },
    
    /**
     * Calculate level from XP (optimized binary search from v2)
     * @param {number} xp 
     * @returns {number}
     */
    calculateLevel(xp) {
        const levels = Object.keys(Constants.XP_TABLE).map(Number).sort((a, b) => a - b);
        let left = 0;
        let right = levels.length - 1;
        let result = 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const level = levels[mid];

            if (Constants.XP_TABLE[level] <= xp) {
                result = level;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return result;
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
     * Calculate current XP (for real-time tracking)
     * @param {string} skillName 
     * @returns {number}
     */
    calculateCurrentXP(skillName) {
        const skillLower = skillName.toLowerCase();
        return this.skills[skillLower]?.currentXP || 0;
    },
    
    /**
     * Calculate time to level (from v2)
     * @param {string} skillName 
     * @param {number} targetLevel 
     * @returns {object}
     */
    calculateTimeToLevel(skillName, targetLevel) {
        const skillLower = skillName.toLowerCase();
        const currentXP = this.skills[skillLower]?.currentXP || 0;
        const currentLevel = this.calculateLevel(currentXP);
        
        if (targetLevel <= currentLevel || targetLevel > 99) {
            return { possible: false };
        }
        
        // Find active task for this skill
        const activeTask = this.activeTasks.find(t => 
            t.skillName.toLowerCase() === skillLower
        );
        
        if (!activeTask) {
            return { possible: false };
        }
        
        const targetXP = this.getXPForLevel(targetLevel);
        const xpNeeded = targetXP - currentXP;
        const actionsNeeded = Math.ceil(xpNeeded / activeTask.expPerAction);
        const timeNeeded = actionsNeeded * activeTask.modifiedActionTime;
        
        return {
            possible: true,
            xpNeeded,
            actionsNeeded,
            timeNeeded,
            hoursNeeded: Math.floor(timeNeeded / 3600),
            minutesNeeded: Math.floor((timeNeeded % 3600) / 60)
        };
    },
    
    /**
     * Update active tasks (enhanced with real-time tracking)
     * @param {Array} tasks 
     */
    updateActiveTasks(tasks) {
        const now = Date.now();
        const newTasks = [];
        
        tasks.forEach(task => {
            const skillName = task.skill_name?.toLowerCase() || '';
            const itemName = task.item_name || '';
            
            if (!skillName || !itemName) return;
            
            // Get full item data from ItemDataEngine
            const itemData = ItemDataEngine.getItemData(itemName);
            if (!itemData) {
                console.warn(`[State] No data for item: ${itemName}`);
                return;
            }
            
            const taskKey = `${skillName}_${itemName}`;
            const currentXP = this.skills[skillName]?.currentXP || 0;
            
            // Initialize or update real-time tracking (from v2)
            if (!this.realTimeTracking[taskKey]) {
                const currentLevel = this.calculateLevel(currentXP);
                const nextLevel = Math.min(currentLevel + 1, 99);
                const xpForNext = this.getXPForLevel(nextLevel);
                const xpNeeded = xpForNext - currentXP;
                const actionsNeeded = Math.ceil(xpNeeded / itemData.baseXp);
                const timeNeeded = actionsNeeded * itemData.modifiedTime;

                this.realTimeTracking[taskKey] = {
                    startTime: now,
                    baseXP: currentXP,
                    lastApiXP: currentXP,
                    lastApiTime: now,
                    actionTime: itemData.modifiedTime,
                    initialTimeRemaining: timeNeeded,
                    initialActionsRemaining: actionsNeeded,
                    initialXP: currentXP,
                    timerStartTime: now
                };
            } else {
                const tracking = this.realTimeTracking[taskKey];
                const xpGainedSinceLastApi = currentXP - tracking.lastApiXP;

                if (xpGainedSinceLastApi > 0) {
                    const currentLevel = this.calculateLevel(currentXP);
                    const nextLevel = Math.min(currentLevel + 1, 99);
                    const xpForNext = this.getXPForLevel(nextLevel);
                    const xpNeeded = xpForNext - currentXP;
                    const actionsNeeded = Math.ceil(xpNeeded / itemData.baseXp);
                    const timeNeeded = actionsNeeded * itemData.modifiedTime;

                    tracking.lastApiXP = currentXP;
                    tracking.lastApiTime = now;
                    tracking.baseXP = currentXP;
                    tracking.startTime = now;
                    tracking.initialTimeRemaining = timeNeeded;
                    tracking.initialActionsRemaining = actionsNeeded;
                    tracking.initialXP = currentXP;
                    tracking.timerStartTime = now;
                }

                tracking.actionTime = itemData.modifiedTime;
            }
            
            // Store processed task
            newTasks.push({
                skillName: skillName,
                skillNameDisplay: skillName.charAt(0).toUpperCase() + skillName.slice(1),
                itemName: itemName,
                expPerAction: itemData.baseXp,
                modifiedActionTime: itemData.modifiedTime,
                expEarned: task.exp_earned || 0,
                taskKey: taskKey
            });
        });
        
        this.activeTasks = newTasks;
        
        // Clean up real-time tracking for tasks that are no longer active
        const activeTaskKeys = newTasks.map(t => t.taskKey);
        Object.keys(this.realTimeTracking).forEach(key => {
            if (!activeTaskKeys.includes(key)) {
                delete this.realTimeTracking[key];
            }
        });
        
        console.log(`[State] Updated ${newTasks.length} active tasks`);
        this.triggerUIUpdate();
    },
    
    /**
     * Update preview task (enhanced from v2)
     * @param {object} calcData 
     * @param {string} skillName 
     * @param {string} itemName 
     */
    updatePreviewTask(calcData, skillName = null, itemName = null) {
        if (!calcData) return;
        
        const hasNewRequirements = calcData.requirements && calcData.requirements.length > 0;
        const hadOldRequirements = this.previewTask?.requirements && this.previewTask.requirements.length > 0;
        const isNewGatheringItem = hadOldRequirements && !hasNewRequirements;
        const isGatheringSkill = Constants.GATHERING_SKILLS.includes(skillName?.toLowerCase());
        
        let mergedRequirements = [];
        let timesToCraft = 1;
        let requirementsComplete = false;
        let hasCraftingRequirements = hasNewRequirements;
        
        if (isNewGatheringItem) {
            requirementsComplete = true;
            hasCraftingRequirements = false;
        } else {
            if (hasNewRequirements && isGatheringSkill) {
                mergedRequirements = calcData.requirements;
                requirementsComplete = true;
                hasCraftingRequirements = true;
                console.log(`[State] Gathering skill with consumables detected (${skillName})`);
            }
            
            // Check requirements cache (from v2)
            if (!requirementsComplete && skillName && itemName) {
                const cacheKey = `${skillName}_${itemName}`;
                const cached = this.requirementsCache[cacheKey];
                
                if (cached && (Date.now() - cached.timestamp) < 1800000) { // 30 min cache
                    mergedRequirements = cached.requirements;
                    requirementsComplete = true;
                    console.log(`[State] Using cached requirements for ${itemName}`);
                }
            }
            
            if (!requirementsComplete && this.previewTask?.requirements) {
                mergedRequirements = this.previewTask.requirements;
                requirementsComplete = this.previewTask.requirementsComplete || false;
            }
        }
        
        this.previewTask = {
            skillName: skillName,
            skillNameDisplay: skillName ? skillName.charAt(0).toUpperCase() + skillName.slice(1) : null,
            itemName: itemName,
            expPerAction: calcData.expPerAction,
            modifiedActionTime: calcData.modifiedActionTime,
            skillLevel: calcData.skillLevel,
            requirements: mergedRequirements,
            materialRequirements: calcData.materialRequirements || null,
            timesToCraft: timesToCraft,
            requirementsComplete: requirementsComplete,
            hasCraftingRequirements: hasCraftingRequirements,
            isLevelTooLow: false,
            timestamp: Date.now()
        };
        
        this.triggerUIUpdate();
    },
    
    /**
     * Update preview requirements (from v2)
     * @param {object} data 
     * @param {string} url 
     */
    updatePreviewRequirements(data, url) {
        if (!data || !data.requirements) return;
        
        const match = url.match(/\/tasks\/requirements\/([^\/]+)\/([^?]+)/);
        if (!match) return;
        
        const skillFromUrl = match[1].toLowerCase();
        const itemNameEncoded = match[2];
        const itemName = decodeURIComponent(itemNameEncoded);
        
        // Cache requirements
        const cacheKey = `${skillFromUrl}_${itemName}`;
        this.requirementsCache[cacheKey] = {
            requirements: data.requirements,
            skillName: skillFromUrl,
            itemName: itemName,
            timestamp: Date.now()
        };
        
        console.log(`[State] Cached requirements for ${itemName} with ${data.requirements.length} items`);
        
        // Update preview if it matches
        if (this.previewTask && 
            this.previewTask.skillName === skillFromUrl && 
            this.previewTask.itemName === itemName) {
            
            this.previewTask.requirements = data.requirements;
            this.previewTask.requirementsComplete = true;
            this.previewTask.hasCraftingRequirements = true;
            
            this.triggerUIUpdate();
        }
    },
    
    /**
     * Toggle panel open/close
     * @param {boolean} open - Optional force state
     */
    togglePanel(open = null) {
        if (open !== null) {
            this.ui.isOpen = open;
        } else {
            this.ui.isOpen = !this.ui.isOpen;
        }
        this.saveUIState();
    },
    
    /**
     * Toggle panel expanded/collapsed
     */
    toggleExpanded() {
        this.ui.isExpanded = !this.ui.isExpanded;
        this.saveUIState();
    },
    
    /**
     * Update panel position
     * @param {object} position 
     */
    updatePosition(position) {
        this.ui.position = { ...this.ui.position, ...position };
        this.saveUIState();
    },
    
    /**
     * Save input value
     * @param {string} key 
     * @param {any} value 
     */
    saveInputValue(key, value) {
        if (value) {
            this.savedInputValues[key] = value;
        } else {
            delete this.savedInputValues[key];
        }
    },
    
    /**
     * Get saved input value
     * @param {string} key 
     * @param {any} defaultValue 
     * @returns {any}
     */
    getSavedInputValue(key, defaultValue = '') {
        return this.savedInputValues[key] || defaultValue;
    },
    
    /**
     * Register update callback
     * @param {function} callback 
     */
    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    },
    
    /**
     * Trigger UI update
     */
    triggerUIUpdate() {
        this.updateCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('[State] Error in update callback:', error);
            }
        });
    }
};

// Expose globally for use in other modules and main script
window.State = State;
