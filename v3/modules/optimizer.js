// ====================
// MODULE 8: XP OPTIMIZER (SIMPLIFIED V2)
// ====================

// Dependencies: Constants, State, ItemDataEngine, GameDB (loaded via @require)

const Optimizer = {
    active: false,
    targetLevel: null,
    finalItem: null,
    currentSkill: null,
    optimizationResult: null,
    modalElement: null,
    
    /**
     * Start optimizer wizard
     */
    start() {
        console.log('[Optimizer] Starting optimizer wizard');
        
        this.active = true;
        this.targetLevel = null;
        this.finalItem = null;
        this.currentSkill = null;
        this.optimizationResult = null;
        
        this.createModal();
        this.showStep1();
    },
    
    /**
     * Close optimizer
     */
    close() {
        this.active = false;
        
        if (this.modalElement) {
            this.modalElement.remove();
            this.modalElement = null;
        }
        
        // Update state
        State.optimizer.active = false;
        
        console.log('[Optimizer] Closed');
    },
    
    /**
     * Create modal container
     */
    createModal() {
        // Remove existing modal if any
        const existing = document.getElementById('craftingOptimizerModal');
        if (existing) {
            existing.remove();
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'craftingOptimizerModal';
        modal.style.cssText = `
            position: fixed;
            top: ${State.optimizer.position.top}px;
            left: ${State.optimizer.position.left}px;
            width: ${State.optimizer.position.width}px;
            height: ${State.optimizer.position.height}px;
            background: #0B0E14;
            border: 1px solid #1E2330;
            border-radius: 8px;
            color: #e0e0e0;
            font-family: monospace;
            font-size: 13px;
            z-index: 1000000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            resize: none;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 16px;
            background: #0B0E14;
            border-bottom: 1px solid #1E2330;
            border-radius: 6px 6px 0 0;
            cursor: move;
            user-select: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
            flex-shrink: 0;
        `;
        header.innerHTML = `
            <h3 style="margin: 0; color: white; font-size: 16px; font-weight: bold;">
                XP Optimizer
            </h3>
            <div class="header-buttons" style="display: flex; gap: 12px; align-items: center;">
                <button id="resetOptimizerBtn" title="Reset position & size" style="
                    cursor: pointer;
                    background: none;
                    border: none;
                    padding: 0;
                    color: #8B8D91;
                    transition: color 0.2s, opacity 0.2s;
                    display: flex;
                    align-items: center;
                    opacity: 0.7;
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                </button>
                <span id="minimizeOptimizerBtn" style="
                    cursor: pointer;
                    background: none;
                    border: none;
                    padding: 0;
                    color: #8B8D91;
                    transition: color 0.2s, opacity 0.2s;
                    display: flex;
                    align-items: center;
                    opacity: 0.7;
                    font-size: 20px;
                ">−</span>
                <button id="closeOptimizerBtn" style="
                    cursor: pointer;
                    background: none;
                    border: none;
                    padding: 0;
                    color: #8B8D91;
                    transition: color 0.2s, opacity 0.2s;
                    display: flex;
                    align-items: center;
                    opacity: 0.7;
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18"></path>
                        <path d="m6 6 12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        
        // Create content area
        const content = document.createElement('div');
        content.id = 'optimizerContent';
        content.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        `;
        
        // Create resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.id = 'resizeHandleOptimizer';
        resizeHandle.style.cssText = `
            position: absolute;
            bottom: 0;
            right: 0;
            width: 16px;
            height: 16px;
            cursor: nwse-resize;
        `;
        resizeHandle.innerHTML = `
            <svg style="position: absolute; bottom: 2px; right: 2px;" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 11L1 1M11 6L6 11" stroke="#8B8D91" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
        `;
        
        modal.appendChild(header);
        modal.appendChild(content);
        modal.appendChild(resizeHandle);
        document.body.appendChild(modal);
        
        this.modalElement = modal;
        
        // Attach button listeners
        document.getElementById('closeOptimizerBtn').addEventListener('click', () => this.close());
        document.getElementById('resetOptimizerBtn').addEventListener('click', () => this.resetPosition());
        document.getElementById('minimizeOptimizerBtn').addEventListener('click', () => this.toggleMinimize());
        
        // Add hover effects for buttons
        const buttons = modal.querySelectorAll('.header-buttons button, .header-buttons span');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.color = 'white';
                btn.style.opacity = '1';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.color = '#8B8D91';
                btn.style.opacity = '0.7';
            });
        });
        
        // Make draggable
        this.makeDraggable(modal, header);
        
        // Make resizable
        this.makeResizable(modal, resizeHandle);
    },
    
    /**
     * Make modal draggable
     */
    makeDraggable(modal, header) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        
        header.addEventListener('mousedown', (e) => {
            // Don't drag if clicking on buttons or SVG elements
            if (e.target.tagName === 'BUTTON' || 
                e.target.tagName === 'SPAN' || 
                e.target.tagName === 'svg' || 
                e.target.tagName === 'path' ||
                e.target.closest('button') ||
                e.target.closest('span#minimizeOptimizerBtn')) {
                return;
            }
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = modal.offsetLeft;
            initialTop = modal.offsetTop;
            
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            modal.style.left = `${initialLeft + deltaX}px`;
            modal.style.top = `${initialTop + deltaY}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                
                // Save position
                State.optimizer.position = {
                    top: modal.offsetTop,
                    left: modal.offsetLeft,
                    width: modal.offsetWidth,
                    height: modal.offsetHeight
                };
                State.saveUIState();
            }
        });
    },
    
    /**
     * Make modal resizable
     */
    makeResizable(modal, handle) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            
            startX = e.clientX;
            startY = e.clientY;
            startWidth = modal.offsetWidth;
            startHeight = modal.offsetHeight;
            
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newWidth = Math.max(400, startWidth + deltaX);
            const newHeight = Math.max(300, startHeight + deltaY);
            
            modal.style.width = `${newWidth}px`;
            modal.style.height = `${newHeight}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.userSelect = '';
                
                // Save size
                State.optimizer.position = {
                    top: modal.offsetTop,
                    left: modal.offsetLeft,
                    width: modal.offsetWidth,
                    height: modal.offsetHeight
                };
                State.saveUIState();
            }
        });
    },
    
    /**
     * Reset position and size to default
     */
    resetPosition() {
        const modal = this.modalElement;
        if (!modal) return;
        
        const defaultPosition = {
            top: 150,
            left: window.innerWidth / 2 - 300,
            width: 600,
            height: 500
        };
        
        modal.style.top = `${defaultPosition.top}px`;
        modal.style.left = `${defaultPosition.left}px`;
        modal.style.width = `${defaultPosition.width}px`;
        modal.style.height = `${defaultPosition.height}px`;
        
        State.optimizer.position = defaultPosition;
        State.saveUIState();
        
        console.log('[Optimizer] Position reset to default');
    },
    
    /**
     * Toggle minimize/maximize (placeholder for future feature)
     */
    toggleMinimize() {
        // Future feature: minimize to just header
        console.log('[Optimizer] Minimize feature coming soon');
    },
    
    /**
     * Get skill icon as SVG (using Constants.SKILL_ICONS)
     */
    getSkillIconSVG(skillName) {
        // Capitalize first letter to match Constants.SKILL_ICONS format
        const capitalizedName = skillName.charAt(0).toUpperCase() + skillName.slice(1);
        const iconId = Constants.SKILL_ICONS[capitalizedName];
        
        if (iconId) {
            return `<svg width="16" height="16" style="display: inline-block; vertical-align: middle; margin-right: 6px;"><use href="#icon-${iconId}"></use></svg>`;
        }
        return '';
    },
    
    /**
     * Show Step 1: Select target level
     */
    showStep1() {
        const content = document.getElementById('optimizerContent');
        if (!content) return;
        
        // Get list of skills with levels
        const skillOptions = Constants.SKILLS_WITH_INTERMEDIATE_CRAFTS.map(skill => {
            const skillData = State.skills[skill] || { level: 1 };
            const skillIcon = this.getSkillIconSVG(skill);
            return `
                <div class="skill-option" style="
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 6px;
                    padding: 10px;
                    margin-bottom: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                " data-skill="${skill}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center;">
                            ${skillIcon}
                            <span style="font-size: 14px; font-weight: 600;">
                                ${skill.charAt(0).toUpperCase() + skill.slice(1)}
                            </span>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: #4CAF50; font-size: 13px;">Level ${skillData.level}</div>
                            <div style="color: #aaa; font-size: 11px;">${skillData.currentXP || 0} XP</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #C5C6C9; margin-bottom: 10px; font-size: 18px;">Step 1: Select Skill & Target Level</h2>
                <p style="color: #8B8D91; font-size: 13px;">
                    Choose the skill you want to optimize and your target level
                </p>
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; color: #8B8D91; font-size: 12px;">Select Skill:</label>
                ${skillOptions}
            </div>
            
            <div style="margin-top: 20px; display: none;" id="levelInputSection">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label style="color: #8B8D91; font-size: 13px;">Target Level:</label>
                        <input type="number" id="targetLevelInput" min="1" max="99" placeholder="Level" style="
                            width: 80px;
                            padding: 8px;
                            background: #2A3041;
                            border: 1px solid #1E2330;
                            border-radius: 4px;
                            color: #fff;
                            font-size: 14px;
                            text-align: center;
                        ">
                    </div>
                    
                    <button id="step1NextBtn" style="
                        padding: 10px 32px;
                        background: linear-gradient(135deg, #4CAF50, #45a049);
                        border: none;
                        border-radius: 6px;
                        color: #fff;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    " disabled>Continue to Step 2 →</button>
                </div>
            </div>
        `;
        
        // Attach skill selection listeners
        document.querySelectorAll('.skill-option').forEach(option => {
            option.addEventListener('click', (e) => {
                // Remove previous selection
                document.querySelectorAll('.skill-option').forEach(opt => {
                    opt.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                    opt.style.background = 'rgba(255, 255, 255, 0.05)';
                });
                
                // Highlight selected
                option.style.border = '1px solid #6366f1';
                option.style.background = 'rgba(99, 102, 241, 0.1)';
                
                // Store selected skill
                this.currentSkill = option.dataset.skill;
                
                // Show level input
                document.getElementById('levelInputSection').style.display = 'block';
                
                // Pre-fill with current level + 1
                const currentLevel = State.skills[this.currentSkill]?.level || 1;
                document.getElementById('targetLevelInput').value = Math.min(99, currentLevel + 1);
                
                // Enable next button
                document.getElementById('step1NextBtn').disabled = false;
            });
            
            // Hover effect
            option.addEventListener('mouseenter', () => {
                if (option.dataset.skill !== this.currentSkill) {
                    option.style.background = 'rgba(255, 255, 255, 0.15)';
                }
            });
            
            option.addEventListener('mouseleave', () => {
                if (option.dataset.skill !== this.currentSkill) {
                    option.style.background = 'rgba(255, 255, 255, 0.05)';
                }
            });
        });
        
        // Target level input listener
        document.getElementById('targetLevelInput')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const currentLevel = State.skills[this.currentSkill]?.level || 1;
            
            if (value > currentLevel && value <= 99) {
                this.targetLevel = value;
                document.getElementById('step1NextBtn').disabled = false;
            } else {
                document.getElementById('step1NextBtn').disabled = true;
            }
        });
        
        // Next button listener
        document.getElementById('step1NextBtn')?.addEventListener('click', () => {
            if (this.currentSkill && this.targetLevel) {
                this.showStep2();
            }
        });
    },
    
    /**
     * Show Step 2: Select final item
     */
    showStep2() {
        const content = document.getElementById('optimizerContent');
        if (!content) return;
        
        // Get all items for the selected skill
        const items = GameDB.getAllItemsForSkill(this.currentSkill);
        
        // Filter to final items (weapons/armor)
        const finalItems = items.filter(item => {
            return item.type && (
                item.type.includes('weapon_') ||
                item.type.includes('equipment_')
            );
        });
        
        // Sort by level required (descending)
        finalItems.sort((a, b) => b.levelRequired - a.levelRequired);
        
        // Separate craftable and non-craftable items
        const craftableItems = [];
        const nonCraftableItems = [];
        
        finalItems.forEach(item => {
            const itemData = ItemDataEngine.getItemData(item.name);
            const canCraft = itemData && State.skills[this.currentSkill].level >= item.levelRequired;
            
            if (canCraft) {
                craftableItems.push({ item, itemData });
            } else {
                nonCraftableItems.push({ item, itemData });
            }
        });
        
        // Generate HTML for craftable items
        const craftableItemsHTML = craftableItems.map(({ item, itemData }) => {
            return `
                <div class="item-option craftable" style="
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                    padding: 8px;
                    margin-bottom: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                " data-item="${item.name}">
                    ${item.img ? `<img src="${item.img}" style="width: 24px; height: 24px; object-fit: contain;">` : ''}
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 13px; color: #C5C6C9;">${item.name}</div>
                        <div style="color: #8B8D91; font-size: 11px;">
                            Lvl ${item.levelRequired} • ${item.baseXp} XP • ${itemData?.modifiedTime.toFixed(1)}s
                        </div>
                    </div>
                    <div style="text-align: right; flex-shrink: 0;">
                        <div style="color: #4CAF50; font-size: 11px; font-weight: 600;">
                            ${itemData ? `${itemData.xpPerHour.toLocaleString()} XP/h` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Generate HTML for non-craftable items
        const nonCraftableItemsHTML = nonCraftableItems.map(({ item, itemData }) => {
            return `
                <div class="item-option non-craftable" style="
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    padding: 8px;
                    margin-bottom: 6px;
                    opacity: 0.5;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    ${item.img ? `<img src="${item.img}" style="width: 24px; height: 24px; object-fit: contain;">` : ''}
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 13px; color: #8B8D91;">${item.name}</div>
                        <div style="color: #6B6D71; font-size: 11px;">
                            Lvl ${item.levelRequired} • ${item.baseXp} XP • ${itemData?.modifiedTime.toFixed(1)}s
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        const skillIcon = this.getSkillIconSVG(this.currentSkill);
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #C5C6C9; margin-bottom: 10px; font-size: 18px;">Step 2: Select Final Item to Craft</h2>
                <p style="color: #8B8D91; font-size: 13px;">
                    Choose the item you want to craft to reach level ${this.targetLevel}
                </p>
                <div style="margin-top: 10px; padding: 8px 12px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 6px; display: inline-flex; align-items: center; gap: 8px;">
                    ${skillIcon}
                    <span style="font-weight: 600; color: #C5C6C9;">${this.currentSkill.charAt(0).toUpperCase() + this.currentSkill.slice(1)}</span>
                    <span style="color: #8B8D91;">→</span>
                    <span style="color: #6366f1; font-weight: 600;">Level ${this.targetLevel}</span>
                </div>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto; padding-right: 4px;">
                ${craftableItemsHTML}
                
                ${nonCraftableItems.length > 0 ? `
                    <details style="margin-top: 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 8px;">
                        <summary style="cursor: pointer; color: #8B8D91; font-size: 12px; font-weight: 600; user-select: none; list-style: none; display: flex; align-items: center; gap: 6px;">
                            <span style="transition: transform 0.2s;">▶</span>
                            Insufficient Skill Level (${nonCraftableItems.length})
                        </summary>
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            ${nonCraftableItemsHTML}
                        </div>
                    </details>
                ` : ''}
            </div>
            
            <button id="backToStep1Btn" style="
                width: 100%;
                padding: 10px;
                margin-top: 16px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                color: #C5C6C9;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;
            ">← Back to Step 1</button>
        `;
        
        // Add details toggle animation
        const details = content.querySelector('details');
        if (details) {
            details.addEventListener('toggle', (e) => {
                const arrow = e.target.querySelector('span');
                if (arrow) {
                    arrow.style.transform = details.open ? 'rotate(90deg)' : 'rotate(0deg)';
                }
            });
        }
        
        // Attach item selection listeners for craftable items
        document.querySelectorAll('.item-option.craftable').forEach(option => {
            option.addEventListener('click', () => {
                this.finalItem = option.dataset.item;
                this.calculateOptimalPath();
            });
            
            // Hover effect
            option.addEventListener('mouseenter', () => {
                option.style.background = 'rgba(255, 255, 255, 0.15)';
                option.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            });
            
            option.addEventListener('mouseleave', () => {
                option.style.background = 'rgba(255, 255, 255, 0.05)';
                option.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            });
        });
        
        // Back button hover effect
        const backBtn = document.getElementById('backToStep1Btn');
        if (backBtn) {
            backBtn.addEventListener('mouseenter', () => {
                backBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                backBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            });
            backBtn.addEventListener('mouseleave', () => {
                backBtn.style.background = 'rgba(255, 255, 255, 0.05)';
                backBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            });
            backBtn.addEventListener('click', () => {
                this.showStep1();
            });
        }
    },
    
    /**
     * Calculate optimal crafting path
     * Uses v2 algorithm: tests all quantities, minimizes overshoot, compares XP/time ratios
     */
    calculateOptimalPath() {
        console.log('[Optimizer] Calculating optimal path...');
        
        const currentXP = State.skills[this.currentSkill]?.currentXP || 0;
        const currentLevel = State.calculateLevel(currentXP);
        const targetXP = State.getXPForLevel(this.targetLevel);
        const xpNeeded = targetXP - currentXP;
        
        if (xpNeeded <= 0) {
            this.showResult({
                error: 'Already at or above target level!'
            });
            return;
        }
        
        // Get item data
        const itemData = ItemDataEngine.getItemData(this.finalItem);
        if (!itemData) {
            this.showResult({
                error: 'Could not get item data!'
            });
            return;
        }
        
        // Build material crafts list (materials that give XP when crafted)
        // Only include: Bar/Leather/Cloth (generic) + Handle/Bowstring/Gemstone (weapon components)
        const materialCrafts = [];
        if (itemData.requirements && itemData.requirements.length > 0) {
            itemData.requirements.forEach(req => {
                const matData = ItemDataEngine.getItemData(req.itemName);
                if (matData && matData.baseXp > 0) {
                    // Check if this is a valid craftable material
                    const isGenericMaterial = 
                        Constants.MATERIAL_PATTERNS.BAR.test(req.itemName) ||
                        Constants.MATERIAL_PATTERNS.LEATHER.test(req.itemName) ||
                        Constants.MATERIAL_PATTERNS.CLOTH.test(req.itemName);
                    
                    const isWeaponComponent = 
                        Constants.MATERIAL_PATTERNS.HANDLE.test(req.itemName) ||
                        Constants.MATERIAL_PATTERNS.BOWSTRING.test(req.itemName) ||
                        Constants.MATERIAL_PATTERNS.GEMSTONE.test(req.itemName);
                    
                    // Only add if it's a generic material or weapon component
                    if (isGenericMaterial || isWeaponComponent) {
                        materialCrafts.push({
                            name: req.itemName,
                            xpPerCraft: matData.baseXp,
                            actionTime: matData.modifiedTime,
                            requiredPerFinalCraft: req.required,
                            available: req.available,
                            isGeneric: isGenericMaterial,
                            isWeaponComponent: isWeaponComponent
                        });
                    } else {
                        console.log(`[Optimizer] Excluding non-craftable material: ${req.itemName} (gathered item)`);
                    }
                }
            });
        }
        
        // Calculate exact number of crafts needed with minimum overshoot
        let finalCraftsNeeded = 0;
        let materialCraftsNeeded = {}; // { materialName: quantity }
        let materialTotalNeeded = {}; // Track total needed before subtracting owned (for post-opt)
        
        if (materialCrafts.length > 0) {
            const itemXP = itemData.baseXp;
            const itemTime = itemData.modifiedTime;
            
            let bestSolution = null;
            let smallestOvershoot = Infinity;
            let fastestTime = Infinity;
            
            // Calculate max possible items to test
            const maxPossibleItems = Math.ceil(xpNeeded / itemXP) + 10;
            
            // Track if we used extra materials (to disable post-optimization if needed)
            let usedExtraMaterials = false;
            
            // Test all possible quantities from 1 to max
            for (let numItems = 1; numItems <= maxPossibleItems; numItems++) {
                // Calculate materials needed for this number of items
                let totalMaterialsForItems = {};
                let totalMaterialTime = 0;
                let xpFromMaterials = 0;
                
                materialCrafts.forEach(mat => {
                    const matsForItems = numItems * mat.requiredPerFinalCraft;
                    totalMaterialsForItems[mat.name] = matsForItems;
                    totalMaterialTime += matsForItems * mat.actionTime;
                    xpFromMaterials += matsForItems * mat.xpPerCraft;
                });
                
                const xpFromItems = numItems * itemXP;
                const xpSoFar = xpFromMaterials + xpFromItems;
                
                let extraMaterialsNeeded = {};
                let totalXP = xpSoFar;
                let extraMaterialTime = 0;
                let hasExtraMatsThisIteration = false;
                
                // If not enough XP, decide whether to craft more items or add materials
                if (xpSoFar < xpNeeded) {
                    const xpMissing = xpNeeded - xpSoFar;
                    
                    // Detect complex weapons (2+ weapon components)
                    const weaponComponents = materialCrafts.filter(mat => mat.isWeaponComponent);
                    const isComplexWeapon = weaponComponents.length >= 2;
                    
                    // Filter generic materials only (Bar/Leather/Cloth)
                    const genericMaterials = materialCrafts.filter(mat => mat.isGeneric);
                    
                    // Calculate ratios
                    const itemRatio = itemXP / itemTime;
                    
                    // Find best generic material if any
                    let bestGenericMaterial = null;
                    let bestGenericRatio = 0;
                    
                    if (genericMaterials.length > 0) {
                        bestGenericMaterial = genericMaterials[0];
                        bestGenericRatio = bestGenericMaterial.xpPerCraft / bestGenericMaterial.actionTime;
                        
                        genericMaterials.forEach(mat => {
                            const ratio = mat.xpPerCraft / mat.actionTime;
                            if (ratio > bestGenericRatio) {
                                bestGenericRatio = ratio;
                                bestGenericMaterial = mat;
                            }
                        });
                    }
                    
                    // FLEXIBLE LOGIC FOR COMPLEX WEAPONS:
                    // For weapons with 2+ components, allow using materials even if ratio is slightly worse
                    // This prevents impossible situations where the algo can't find a solution
                    let shouldCraftMoreItems;
                    
                    if (isComplexWeapon && bestGenericMaterial) {
                        // For complex weapons: allow materials if the difference is reasonable
                        // Accept materials if the XP deficit is small (< 20% of item XP)
                        // OR if material ratio is at least 70% as good as item ratio
                        const deficitRatio = xpMissing / itemXP;
                        const ratioComparison = bestGenericRatio / itemRatio;
                        
                        const smallDeficit = deficitRatio < 0.2;
                        const reasonableRatio = ratioComparison >= 0.7;
                        
                        shouldCraftMoreItems = !smallDeficit && !reasonableRatio && itemRatio > bestGenericRatio;
                    } else {
                        // For simple items: strict logic (prioritize final item if ratio is better)
                        shouldCraftMoreItems = !bestGenericMaterial || itemRatio >= bestGenericRatio;
                    }
                    
                    if (shouldCraftMoreItems) {
                        // Skip this incomplete solution - continue to next numItems iteration
                        continue;
                    } else {
                        // Use generic materials to fill the gap
                        if (bestGenericMaterial) {
                            const extraCount = Math.ceil(xpMissing / bestGenericMaterial.xpPerCraft);
                            extraMaterialsNeeded[bestGenericMaterial.name] = extraCount;
                            extraMaterialTime = extraCount * bestGenericMaterial.actionTime;
                            totalXP = xpSoFar + extraCount * bestGenericMaterial.xpPerCraft;
                            hasExtraMatsThisIteration = true; // Mark that we used extra materials
                        } else if (isComplexWeapon && weaponComponents.length > 0) {
                            // FALLBACK FOR COMPLEX WEAPONS: if no generic materials available,
                            // allow crafting extra weapon components (e.g., handle, gemstone)
                            // This is a last resort to make weapons craftable
                            const bestComponent = weaponComponents.reduce((best, comp) => {
                                const ratio = comp.xpPerCraft / comp.actionTime;
                                const bestRatio = best ? (best.xpPerCraft / best.actionTime) : 0;
                                return ratio > bestRatio ? comp : best;
                            }, null);
                            
                            if (bestComponent) {
                                const extraCount = Math.ceil(xpMissing / bestComponent.xpPerCraft);
                                extraMaterialsNeeded[bestComponent.name] = extraCount;
                                extraMaterialTime = extraCount * bestComponent.actionTime;
                                totalXP = xpSoFar + extraCount * bestComponent.xpPerCraft;
                                hasExtraMatsThisIteration = true; // Mark that we used extra materials
                                console.log(`[Optimizer] Using weapon component fallback: +${extraCount} ${bestComponent.name} for ${xpMissing} missing XP`);
                            }
                        }
                    }
                }
                
                const overshoot = totalXP - xpNeeded;
                const totalTime = totalMaterialTime + extraMaterialTime + numItems * itemTime;
                
                // Only accept solutions that meet or exceed the XP requirement
                if (overshoot < 0) continue;
                
                // Keep the solution with smallest overshoot, or if equal overshoot then fastest time
                const isBetter =
                    overshoot < smallestOvershoot ||
                    (overshoot === smallestOvershoot && totalTime < fastestTime);
                
                if (isBetter) {
                    smallestOvershoot = overshoot;
                    fastestTime = totalTime;
                    
                    // Merge base materials and extra materials
                    const finalMaterials = { ...totalMaterialsForItems };
                    Object.keys(extraMaterialsNeeded).forEach(matName => {
                        finalMaterials[matName] = (finalMaterials[matName] || 0) + extraMaterialsNeeded[matName];
                    });
                    
                    bestSolution = { items: numItems, materials: finalMaterials };
                    
                    // Track if this solution uses extra materials
                    if (hasExtraMatsThisIteration) {
                        usedExtraMaterials = true;
                    }
                }
                
                // Perfect match with fastest time, no need to continue
                if (overshoot === 0 && totalTime <= fastestTime) break;
                
                // If we're overshooting by more than one full item cycle, stop
                const fullCycleXP = itemXP + materialCrafts.reduce((sum, mat) => sum + (mat.requiredPerFinalCraft * mat.xpPerCraft), 0);
                if (overshoot > fullCycleXP) break;
            }
            
            if (bestSolution) {
                finalCraftsNeeded = bestSolution.items;
                materialCraftsNeeded = bestSolution.materials;
                
                // Track TOTAL needed (before subtracting owned) for post-optimization
                materialTotalNeeded = { ...materialCraftsNeeded };
                
                // Subtract already owned intermediate materials from the crafting requirements
                Object.keys(materialCraftsNeeded).forEach(matName => {
                    const reqData = itemData.requirements?.find(r => r.itemName === matName);
                    const available = reqData?.available || 0;
                    
                    if (available > 0) {
                        const originalCrafts = materialCraftsNeeded[matName];
                        const actualCraftsNeeded = Math.max(0, originalCrafts - available);
                        
                        console.log(`[Optimizer] ${matName}: ${originalCrafts} needed - ${available} owned = ${actualCraftsNeeded} to craft`);
                        materialCraftsNeeded[matName] = actualCraftsNeeded;
                    }
                });
                
                console.log(`[Optimizer] Optimal solution: ${finalCraftsNeeded} items + materials:`, materialCraftsNeeded, `(overshoot: ${smallestOvershoot} XP)`);
            } else {
                // Fallback (should never happen)
                finalCraftsNeeded = 1;
                materialCrafts.forEach(mat => {
                    materialCraftsNeeded[mat.name] = mat.requiredPerFinalCraft;
                });
            }
        } else {
            // No intermediate crafts, just final items
            finalCraftsNeeded = Math.ceil(xpNeeded / itemData.baseXp);
        }
        
        // Build the path
        const path = [];
        let stepXP = currentXP;
        
        // Add material crafting steps
        if (Object.keys(materialCraftsNeeded).length > 0) {
            materialCrafts.forEach(mat => {
                const craftsForThisMaterial = materialCraftsNeeded[mat.name] || 0;
                
                if (craftsForThisMaterial === 0) return;
                
                // XP = crafts to make × XP per craft (owned materials already gave XP before!)
                const totalMatXP = craftsForThisMaterial * mat.xpPerCraft;
                const totalMatTime = craftsForThisMaterial * mat.actionTime;
                const matData = ItemDataEngine.getItemData(mat.name);
                
                path.push({
                    itemName: mat.name,
                    quantity: craftsForThisMaterial,
                    xpPerAction: mat.xpPerCraft,
                    timePerAction: mat.actionTime,
                    totalXp: totalMatXP,
                    totalTime: totalMatTime,
                    img: matData?.img,
                    levelRequired: matData?.levelRequired || 1
                });
                
                stepXP += totalMatXP;
            });
        }
        
        // Add final item crafting step
        if (finalCraftsNeeded > 0) {
            const finalItemXP = finalCraftsNeeded * itemData.baseXp;
            const finalItemTime = finalCraftsNeeded * itemData.modifiedTime;
            
            path.push({
                itemName: this.finalItem,
                quantity: finalCraftsNeeded,
                xpPerAction: itemData.baseXp,
                timePerAction: itemData.modifiedTime,
                totalXp: finalItemXP,
                totalTime: finalItemTime,
                img: itemData.img,
                levelRequired: itemData.levelRequired
            });
        }
        
        // Calculate totals
        let totalXP = path.reduce((sum, step) => sum + step.totalXp, 0);
        let totalTime = path.reduce((sum, step) => sum + step.totalTime, 0);
        
        // SIMPLE POST-OPTIMIZATION: Remove final items if overshoot > item XP
        // This works for ALL item types (simple and complex)
        if (finalCraftsNeeded > 0 && materialCrafts.length > 0 && Object.keys(materialTotalNeeded).length > 0) {
            const finalItemXP = itemData.baseXp;
            let currentOvershoot = totalXP - xpNeeded;
            
            while (finalCraftsNeeded > 1 && currentOvershoot > finalItemXP) {
                // Remove one final item
                finalCraftsNeeded--;
                
                // Adjust ALL materials proportionally for weapon items
                // We need to recalculate from the ORIGINAL total needed (before subtracting owned)
                materialCrafts.forEach(mat => {
                    if (mat.isWeaponComponent || mat.isGeneric) {
                        // Recalculate from scratch: items × per_item_requirement
                        const totalNeededForNewCount = finalCraftsNeeded * mat.requiredPerFinalCraft;
                        const available = mat.available || 0;
                        const newCraftQuantity = Math.max(0, totalNeededForNewCount - available);
                        
                        // Update materialTotalNeeded (tracking dict)
                        materialTotalNeeded[mat.name] = totalNeededForNewCount;
                        materialCraftsNeeded[mat.name] = newCraftQuantity;
                        
                        // Find this material in path and update
                        const matStep = path.find(step => step.itemName === mat.name);
                        if (matStep) {
                            matStep.quantity = newCraftQuantity;
                            matStep.totalTime = newCraftQuantity * mat.actionTime;
                            matStep.totalXp = newCraftQuantity * mat.xpPerCraft;
                        }
                    }
                });
                
                // Update final item in path
                const finalStep = path.find(step => step.itemName === this.finalItem);
                if (finalStep) {
                    finalStep.quantity = finalCraftsNeeded;
                    finalStep.totalXp = finalCraftsNeeded * itemData.baseXp;
                    finalStep.totalTime = finalCraftsNeeded * itemData.modifiedTime;
                }
                
                // Recalculate overshoot from path (more reliable than tracking manually)
                const newTotalXP = path.reduce((sum, step) => sum + step.totalXp, 0);
                currentOvershoot = newTotalXP - xpNeeded;
                
                console.log(`[Optimizer] Post-opt: reduced to ${finalCraftsNeeded} items (overshoot now: ${currentOvershoot.toFixed(0)} XP)`);
            }
            
            // Recalculate totals after optimization
            totalXP = path.reduce((sum, step) => sum + step.totalXp, 0);
            totalTime = path.reduce((sum, step) => sum + step.totalTime, 0);
        }
        
        // CRITICAL VALIDATION: Ensure we reach the target XP
        if (totalXP < xpNeeded) {
            const xpDeficit = xpNeeded - totalXP;
            console.warn(`[Optimizer] XP Deficit detected: ${xpDeficit} XP missing. Attempting to fix by adding base materials...`);
            
            // 1. Identify the base material pattern for this skill
            const baseMatPattern = Constants.CRAFTABLE_MATERIAL_PATTERNS[this.currentSkill];
            
            if (!baseMatPattern) {
                console.error(`[Optimizer] No base material pattern found for skill: ${this.currentSkill}`);
                this.showResult({
                    error: `Optimization failed: Path only provides ${totalXP.toLocaleString()} XP but ${xpNeeded.toLocaleString()} XP is needed. Deficit: ${xpDeficit.toLocaleString()} XP. Cannot fix: no base material defined for ${this.currentSkill}.`
                });
                return;
            }
            
            // 2. Find the base material in materialCrafts
            const baseMaterial = materialCrafts.find(mat => baseMatPattern.test(mat.name) && mat.isGeneric);
            
            if (!baseMaterial) {
                console.error(`[Optimizer] Base material not found in materialCrafts for pattern: ${baseMatPattern}`);
                this.showResult({
                    error: `Optimization failed: Path only provides ${totalXP.toLocaleString()} XP but ${xpNeeded.toLocaleString()} XP is needed. Deficit: ${xpDeficit.toLocaleString()} XP. Cannot fix: base material not found.`
                });
                return;
            }
            
            // 3. Calculate extra quantity needed
            const extraCount = Math.ceil(xpDeficit / baseMaterial.xpPerCraft);
            console.log(`[Optimizer] Adding ${extraCount}x ${baseMaterial.name} to cover ${xpDeficit} XP deficit`);
            
            // 4. Find this material in the path and update it
            const baseMatStep = path.find(step => step.itemName === baseMaterial.name);
            
            if (baseMatStep) {
                // Material already in path, increase quantity
                baseMatStep.quantity += extraCount;
                baseMatStep.totalXp = baseMatStep.quantity * baseMaterial.xpPerCraft;
                baseMatStep.totalTime = baseMatStep.quantity * baseMaterial.actionTime;
                console.log(`[Optimizer] Updated ${baseMaterial.name}: ${baseMatStep.quantity} total (added ${extraCount})`);
            } else {
                // Material not in path (shouldn't happen but handle it)
                const matData = ItemDataEngine.getItemData(baseMaterial.name);
                path.unshift({
                    itemName: baseMaterial.name,
                    quantity: extraCount,
                    xpPerAction: baseMaterial.xpPerCraft,
                    timePerAction: baseMaterial.actionTime,
                    totalXp: extraCount * baseMaterial.xpPerCraft,
                    totalTime: extraCount * baseMaterial.actionTime,
                    img: matData?.img,
                    levelRequired: matData?.levelRequired || 1
                });
                console.log(`[Optimizer] Added new step: ${extraCount}x ${baseMaterial.name}`);
            }
            
            // 5. Recalculate totals
            totalXP = path.reduce((sum, step) => sum + step.totalXp, 0);
            totalTime = path.reduce((sum, step) => sum + step.totalTime, 0);
            
            // 6. Final validation
            if (totalXP < xpNeeded) {
                console.error(`[Optimizer] CRITICAL: Still not enough XP after correction! totalXP=${totalXP}, xpNeeded=${xpNeeded}`);
                this.showResult({
                    error: `Optimization failed: Even after adding ${extraCount}x ${baseMaterial.name}, path only provides ${totalXP.toLocaleString()} XP but ${xpNeeded.toLocaleString()} XP is needed. This is a critical bug - please report it.`
                });
                return;
            }
            
            console.log(`[Optimizer] ✅ Deficit fixed! New totalXP: ${totalXP} (overshoot: ${totalXP - xpNeeded})`);
        }
        
        console.log(`[Optimizer] ✅ Validation passed: totalXP (${totalXP}) >= xpNeeded (${xpNeeded}), overshoot: ${totalXP - xpNeeded}`);
        
        // Store result
        this.optimizationResult = {
            currentXP,
            targetXP,
            xpNeeded,
            finalItem: this.finalItem,
            finalQuantity: finalCraftsNeeded,
            path: path,
            totalXP: totalXP,
            totalTime: totalTime,
            overshoot: totalXP - xpNeeded,
            materialNeeds: {}
        };
        
        this.showResult(this.optimizationResult);
    },
    
    /**
     * Show optimization result
     */
    showResult(result) {
        const content = document.getElementById('optimizerContent');
        if (!content) return;
        
        if (result.error) {
            content.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h2 style="color: #f44336;">Error</h2>
                    <p>${result.error}</p>
                    <button onclick="Optimizer.showStep2()" style="
                        padding: 10px 20px;
                        margin-top: 20px;
                        background: #4CAF50;
                        border: none;
                        border-radius: 6px;
                        color: #fff;
                        cursor: pointer;
                    ">Try Again</button>
                </div>
            `;
            return;
        }
        
        // Format time
        const hours = Math.floor(result.totalTime / 3600);
        const minutes = Math.floor((result.totalTime % 3600) / 60);
        const seconds = Math.floor(result.totalTime % 60);
        
        // Build path display
        let pathHtml = '';
        result.path.forEach(step => {
            const stepTime = Math.floor(step.totalTime);
            const stepHours = Math.floor(stepTime / 3600);
            const stepMinutes = Math.floor((stepTime % 3600) / 60);
            const stepSeconds = stepTime % 60;
            
            let timeDisplay = '';
            if (stepHours > 0) {
                timeDisplay = `${stepHours}h ${stepMinutes}m`;
            } else if (stepMinutes > 0) {
                timeDisplay = `${stepMinutes}m ${stepSeconds}s`;
            } else {
                timeDisplay = `${stepSeconds}s`;
            }
            
            pathHtml += `
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 8px;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${step.img ? `<img src="${step.img}" style="width: 24px; height: 24px;">` : ''}
                            <div>
                                <strong>${step.itemName}</strong>
                                <span style="color: #4CAF50; margin-left: 10px;">x${step.quantity}</span>
                            </div>
                        </div>
                        <div style="text-align: right; font-size: 12px; color: #aaa;">
                            ${step.totalXp.toLocaleString()} XP • ${timeDisplay}
                        </div>
                    </div>
                </div>
            `;
        });
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #4CAF50; margin-bottom: 10px;">✅ Optimization Complete!</h2>
                <p style="color: #aaa; font-size: 14px;">
                    Here's your optimal crafting path to level ${this.targetLevel}
                </p>
            </div>
            
            <div style="
                background: rgba(76, 175, 80, 0.1);
                border: 1px solid #4CAF50;
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 20px;
            ">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <div>
                        <div style="color: #aaa; font-size: 12px;">XP Needed</div>
                        <div style="font-size: 18px; font-weight: 600;">${result.xpNeeded.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style="color: #aaa; font-size: 12px;">Total XP Gained</div>
                        <div style="font-size: 18px; font-weight: 600; color: #4CAF50;">${result.totalXP.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style="color: #aaa; font-size: 12px;">Total Time</div>
                        <div style="font-size: 18px; font-weight: 600;">${hours}h ${minutes}m</div>
                    </div>
                    <div>
                        <div style="color: #aaa; font-size: 12px;">XP Overshoot</div>
                        <div style="font-size: 18px; font-weight: 600; color: ${result.overshoot > result.xpNeeded * 0.1 ? '#FFC107' : '#4CAF50'};">
                            +${result.overshoot.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
            
            <h3 style="margin: 20px 0 10px; color: #FF6B6B;">Crafting Steps:</h3>
            <div style="max-height: 250px; overflow-y: auto;">
                ${pathHtml}
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button id="newOptimizationBtn" style="
                    flex: 1;
                    padding: 12px;
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    border: none;
                    border-radius: 6px;
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                ">New Optimization</button>
                
                <button id="closeResultBtn" style="
                    flex: 1;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 6px;
                    color: #fff;
                    font-size: 14px;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;
        
        // Attach button listeners
        document.getElementById('newOptimizationBtn')?.addEventListener('click', () => {
            this.showStep1();
        });
        
        document.getElementById('closeResultBtn')?.addEventListener('click', () => {
            this.close();
        });
    }
};


// Expose globally for use in other modules and main script
// Note: In @require scripts, we must use window directly as unsafeWindow is not available
window.Optimizer = Optimizer;