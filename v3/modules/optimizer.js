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
            
            // Calculate new position
            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;
            
            // Constrain to viewport
            const minLeft = 0;
            const minTop = 0;
            const maxLeft = window.innerWidth - modal.offsetWidth;
            const maxTop = window.innerHeight - 60; // Keep header visible
            
            newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
            newTop = Math.max(minTop, Math.min(newTop, maxTop));
            
            modal.style.left = `${newLeft}px`;
            modal.style.top = `${newTop}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                
                // Final position constraint check
                const minLeft = 0;
                const minTop = 0;
                const maxLeft = window.innerWidth - modal.offsetWidth;
                const maxTop = window.innerHeight - 60;
                
                let finalLeft = Math.max(minLeft, Math.min(modal.offsetLeft, maxLeft));
                let finalTop = Math.max(minTop, Math.min(modal.offsetTop, maxTop));
                
                modal.style.left = `${finalLeft}px`;
                modal.style.top = `${finalTop}px`;
                
                // Save position
                State.optimizer.position = {
                    top: finalTop,
                    left: finalLeft,
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
            top: (window.innerHeight - 620) / 2,
            left: (window.innerWidth - 600) / 2,
            width: 600,
            height: 620
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
                    
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 4px; margin-bottom: 20px;">
                        <button class="level-preset-btn" data-level="10" style="
                            padding: 6px 12px;
                            background: rgba(99, 102, 241, 0.1);
                            border: 1px solid rgba(99, 102, 241, 0.3);
                            border-radius: 4px;
                            color: #6366f1;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">10</button>
                        <button class="level-preset-btn" data-level="20" style="
                            padding: 6px 12px;
                            background: rgba(99, 102, 241, 0.1);
                            border: 1px solid rgba(99, 102, 241, 0.3);
                            border-radius: 4px;
                            color: #6366f1;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">20</button>
                        <button class="level-preset-btn" data-level="30" style="
                            padding: 6px 12px;
                            background: rgba(99, 102, 241, 0.1);
                            border: 1px solid rgba(99, 102, 241, 0.3);
                            border-radius: 4px;
                            color: #6366f1;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">30</button>
                        <button class="level-preset-btn" data-level="40" style="
                            padding: 6px 12px;
                            background: rgba(99, 102, 241, 0.1);
                            border: 1px solid rgba(99, 102, 241, 0.3);
                            border-radius: 4px;
                            color: #6366f1;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">40</button>
                        <button class="level-preset-btn" data-level="50" style="
                            padding: 6px 12px;
                            background: rgba(99, 102, 241, 0.1);
                            border: 1px solid rgba(99, 102, 241, 0.3);
                            border-radius: 4px;
                            color: #6366f1;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">50</button>
                        <button class="level-preset-btn" data-level="60" style="
                            padding: 6px 12px;
                            background: rgba(99, 102, 241, 0.1);
                            border: 1px solid rgba(99, 102, 241, 0.3);
                            border-radius: 4px;
                            color: #6366f1;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">60</button>
                        <button class="level-preset-btn" data-level="70" style="
                            padding: 6px 12px;
                            background: rgba(99, 102, 241, 0.1);
                            border: 1px solid rgba(99, 102, 241, 0.3);
                            border-radius: 4px;
                            color: #6366f1;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">70</button>
                        <button class="level-preset-btn" data-level="80" style="
                            padding: 6px 12px;
                            background: rgba(99, 102, 241, 0.1);
                            border: 1px solid rgba(99, 102, 241, 0.3);
                            border-radius: 4px;
                            color: #6366f1;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">80</button>
                        <button class="level-preset-btn" data-level="90" style="
                            padding: 6px 12px;
                            background: rgba(99, 102, 241, 0.1);
                            border: 1px solid rgba(99, 102, 241, 0.3);
                            border-radius: 4px;
                            color: #6366f1;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">90</button>
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-top: 10px; width: 100%;">
                        <button id="step1ManualBtn" style="
                            flex: 1;
                            padding: 10px 24px;
                            background: #4f46e5;
                            border: none;
                            border-radius: 6px;
                            color: #fff;
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                        " disabled>
                            🔧 Manual Selection
                        </button>
                        <button id="step1AutoBtn" style="
                            flex: 1;
                            padding: 10px 24px;
                            background: #10b981;
                            border: none;
                            border-radius: 6px;
                            color: #fff;
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                        " disabled>
                            ⚡ Auto Calculate
                        </button>
                    </div>
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
                document.getElementById('step1ManualBtn').disabled = false;
                document.getElementById('step1AutoBtn').disabled = false;
            } else {
                document.getElementById('step1ManualBtn').disabled = true;
                document.getElementById('step1AutoBtn').disabled = true;
            }
        });
        
        // Level preset buttons listeners
        document.querySelectorAll('.level-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const level = parseInt(btn.dataset.level);
                const input = document.getElementById('targetLevelInput');
                const currentLevel = State.skills[this.currentSkill]?.level || 1;
                
                if (input && level > currentLevel) {
                    input.value = level;
                    this.targetLevel = level;
                    document.getElementById('step1ManualBtn').disabled = false;
                    document.getElementById('step1AutoBtn').disabled = false;
                }
            });
            
            // Hover effect
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'rgba(99, 102, 241, 0.2)';
                btn.style.borderColor = 'rgba(99, 102, 241, 0.5)';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'rgba(99, 102, 241, 0.1)';
                btn.style.borderColor = 'rgba(99, 102, 241, 0.3)';
            });
        });
        
        // Manual button listener
        document.getElementById('step1ManualBtn')?.addEventListener('click', () => {
            if (this.currentSkill && this.targetLevel) {
                console.log('[Optimizer] Manual mode selected');
                this.showStep2();
            }
        });
        
        // Auto button listener
        document.getElementById('step1AutoBtn')?.addEventListener('click', () => {
            if (this.currentSkill && this.targetLevel) {
                console.log('[Optimizer] Auto mode selected');
                this.calculateAutoProgression();
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
        
        // Filter to craftable items for this skill
        const finalItems = items.filter(item => {
            if (!item.type) return false;
            
            // DEFAULT: weapons and equipment (works for forging/leatherworking/tailoring)
            if (item.type.includes('weapon_') || item.type.includes('equipment_')) {
                return true;
            }
            
            // SPECIAL CASE: Alchemy - potions only (exclude extracts which are intermediate materials)
            if (this.currentSkill === 'alchemy' && item.type.includes('consumable_')) {
                // Exclude extracts (they're intermediate materials like Bars/Leather/Cloth)
                if (item.type === 'consumable_extract') {
                    return false;
                }
                return true;
            }
            
            // SPECIAL CASE: Cooking - food (consumable)
            if (this.currentSkill === 'cooking' && item.type.includes('consumable_')) {
                return true;
            }
            
            // SPECIAL CASE: Woodcrafting - planks (component_plank)
            if (this.currentSkill === 'woodcrafting' && item.type.includes('component_')) {
                return true;
            }
            
            // SPECIAL CASE: Crafting - tools and components
            if (this.currentSkill === 'crafting' && (item.type.includes('tool_') || item.type.includes('component_'))) {
                return true;
            }
            
            return false;
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
     * Calculate total time to obtain xpNeeded with an item (including materials)
     * @param {Object} itemData - Item data from ItemDataEngine
     * @param {number} xpNeeded - XP needed
     * @returns {Object} { totalTime, totalXP, numItems }
     */
    calculateTotalTimeForItem(itemData, xpNeeded) {
        // Number of items to craft
        const numItems = Math.ceil(xpNeeded / itemData.baseXp);
        
        // Time to craft final items
        let totalTime = numItems * itemData.modifiedTime;
        let totalXP = numItems * itemData.baseXp;
        
        console.log(`[Optimizer] calculateTotalTimeForItem: ${itemData.name} - ${numItems} items needed for ${xpNeeded} XP`);
        
        // Add time for intermediate materials
        if (itemData.requirements && itemData.requirements.length > 0) {
            itemData.requirements.forEach(req => {
                const matData = ItemDataEngine.getItemData(req.itemName);
                if (matData && matData.baseXp > 0) {
                    // Check if this is a craftable material
                    const isGenericMaterial = 
                        Constants.MATERIAL_PATTERNS.BAR.test(req.itemName) ||
                        Constants.MATERIAL_PATTERNS.LEATHER.test(req.itemName) ||
                        Constants.MATERIAL_PATTERNS.CLOTH.test(req.itemName);
                    
                    const isWeaponComponent = 
                        Constants.MATERIAL_PATTERNS.HANDLE.test(req.itemName) ||
                        Constants.MATERIAL_PATTERNS.BOWSTRING.test(req.itemName) ||
                        Constants.MATERIAL_PATTERNS.GEMSTONE.test(req.itemName);
                    
                    if (isGenericMaterial || isWeaponComponent) {
                        const matsNeeded = numItems * req.required;
                        const matTime = matsNeeded * matData.modifiedTime;
                        const matXP = matsNeeded * matData.baseXp;
                        
                        totalTime += matTime;
                        totalXP += matXP;
                        
                        console.log(`[Optimizer]   - ${req.itemName}: ${matsNeeded} × ${matData.modifiedTime.toFixed(1)}s = ${matTime.toFixed(0)}s (+${matXP} XP)`);
                    }
                }
            });
        }
        
        console.log(`[Optimizer]   → Total: ${totalTime.toFixed(0)}s for ${totalXP} XP (ratio: ${(totalTime/totalXP).toFixed(4)} sec/XP)`);
        
        return { totalTime, totalXP, numItems };
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * AUTO MODE V2 - NOUVELLE LOGIQUE (NE PAS TOUCHER AU MODE MANUAL)
     * ═══════════════════════════════════════════════════════════════
     * Calculate auto progression path across multiple tiers
     * Automatically selects best craftable item for each 10-level tier
     */
    calculateAutoProgression() {
        console.log('[Optimizer] AUTO MODE V2 - Starting calculation...');
        
        const currentXP = State.skills[this.currentSkill]?.currentXP || 0;
        const currentLevel = State.calculateLevel(currentXP);
        const targetLevel = this.targetLevel;
        
        console.log(`[Optimizer] Auto mode: ${this.currentSkill} ${currentLevel} → ${targetLevel}`);
        
        // 1. IDENTIFY TIERS (10-level increments)
        const tiers = [];
        let tierStart = currentLevel;
        
        while (tierStart < targetLevel) {
            const tierEnd = Math.min(Math.ceil((tierStart + 1) / 10) * 10, targetLevel);
            
            if (tierEnd > tierStart) {
                tiers.push({
                    startLevel: tierStart,
                    endLevel: tierEnd
                });
            }
            
            tierStart = tierEnd;
        }
        
        console.log(`[Optimizer] Identified ${tiers.length} tiers:`, tiers);
        
        // 2. FOR EACH TIER, SELECT BEST CRAFTABLE ITEM
        const tierResults = [];
        let cumulativeXP = currentXP;
        
        for (const tier of tiers) {
            console.log(`[Optimizer] ━━━ Processing tier ${tier.startLevel} → ${tier.endLevel} ━━━`);
            
            // Calculate XP needed for this tier
            const startXP = State.getXPForLevel(tier.startLevel);
            const endXP = State.getXPForLevel(tier.endLevel);
            const xpNeeded = endXP - startXP;
            
            console.log(`[Optimizer]   XP needed: ${xpNeeded.toLocaleString()}`);
            
            // Get all craftable items for this skill
            const allItems = GameDB.getAllItemsForSkill(this.currentSkill);
            
            // Filter: craftable items where levelRequired <= tier.startLevel
            // For alchemy/cooking/woodcrafting: type includes "consumable_" or "component_"
            // For crafting: type includes "equipment_" or "tool_"
            const availableItems = allItems.filter(item => {
                if (item.levelRequired > tier.startLevel) return false;
                
                // Accept craftable items (has requirements and gives XP)
                const isCraftable = item.type && 
                    (item.type.includes('consumable_') || 
                     item.type.includes('component_') ||
                     item.type.includes('equipment_') ||
                     item.type.includes('weapon_'));
                
                if (!isCraftable || item.baseXp <= 0) return false;
                
                // SPECIAL CASE: Alchemy - exclude extracts (they're intermediate materials like Bars/Leather/Cloth)
                if (this.currentSkill === 'alchemy' && item.type === 'consumable_extract') {
                    return false;
                }
                
                return true;
            });
            
            console.log(`[Optimizer]   Found ${availableItems.length} craftable items for tier`);
            
            if (availableItems.length === 0) {
                console.warn(`[Optimizer]   ⚠️ No craftable items for tier ${tier.startLevel}→${tier.endLevel}!`);
                continue;
            }
            
            // Select the item with highest levelRequired (most recent tier item)
            availableItems.sort((a, b) => b.levelRequired - a.levelRequired);
            const bestItem = availableItems[0];
            const itemData = ItemDataEngine.getItemData(bestItem.name);
            
            if (!itemData) {
                console.warn(`[Optimizer]   ⚠️ Could not get item data for ${bestItem.name}`);
                continue;
            }
            
            console.log(`[Optimizer]   ✓ Selected: ${bestItem.name} (Lvl ${bestItem.levelRequired})`);
            
            // ═══ USE INTERNAL OPTIMIZATION LOGIC (SAME AS MANUAL MODE) ═══
            const optResult = this.findOptimalCraftingPathInternal(bestItem.name, xpNeeded, this.currentSkill);
            
            if (!optResult) {
                console.warn(`[Optimizer]   ⚠️ Optimization failed for ${bestItem.name}`);
                continue;
            }
            
            console.log(`[Optimizer]   → Optimized path: ${optResult.finalCraftsNeeded}x ${bestItem.name} = ${optResult.totalXP} XP in ${optResult.totalTime.toFixed(0)}s (overshoot: ${optResult.overshoot})`);
            
            // Now add gathered materials (resources) to the path
            const fullPath = [];
            
            // First, add all gathered resources from ALL crafted items in the path
            // For each crafted item, get its requirements and add resources to fullPath
            optResult.path.forEach(pathStep => {
                const pathItemData = ItemDataEngine.getItemData(pathStep.itemName);
                
                if (pathItemData && pathItemData.requirements && pathItemData.requirements.length > 0) {
                    pathItemData.requirements.forEach(req => {
                        const reqItem = GameDB.getItemByName(req.itemName);
                        if (!reqItem) return;
                        
                        // Check if this is a GATHERED resource (not a crafted material)
                        const isGatheredResource = reqItem.type === 'resource';
                        
                        if (isGatheredResource) {
                            // Calculate total needed for this specific path step
                            const totalResourceNeeded = pathStep.quantity * req.required;
                            
                            if (totalResourceNeeded > 0) {
                                // Check if this resource is already in fullPath (to avoid duplicates)
                                const existingEntry = fullPath.find(fp => fp.itemName === req.itemName);
                                
                                if (existingEntry) {
                                    // Add to existing quantity
                                    existingEntry.quantity += totalResourceNeeded;
                                    existingEntry.totalXp += totalResourceNeeded * (reqItem.baseXp || 0);
                                    existingEntry.totalTime += totalResourceNeeded * (reqItem.baseTime || 0);
                                } else {
                                    // Add new entry
                                    fullPath.push({
                                        itemName: req.itemName,
                                        quantity: totalResourceNeeded,
                                        xpPerAction: reqItem.baseXp || 0,
                                        timePerAction: reqItem.baseTime || 0,
                                        totalXp: totalResourceNeeded * (reqItem.baseXp || 0),
                                        totalTime: totalResourceNeeded * (reqItem.baseTime || 0),
                                        img: reqItem.img,
                                        levelRequired: reqItem.levelRequired || 1,
                                        skill: reqItem.skill,
                                        isGathered: true,
                                        isCraftedMaterial: false
                                    });
                                }
                            }
                        }
                    });
                }
            });
            
            // Then, add the optimized crafting path (intermediate materials + final item)
            fullPath.push(...optResult.path);
            
            // Calculate cross-skill XP (from gathered resources)
            const crossSkillXP = this.calculateCrossSkillXP_v2(fullPath);
            
            tierResults.push({
                startLevel: tier.startLevel,
                endLevel: tier.endLevel,
                bestItem: bestItem.name,
                craftsNeeded: optResult.finalCraftsNeeded,
                timeRequired: optResult.totalTime,
                xpGained: optResult.totalXP,
                materials: optResult.materialCraftsNeeded,
                path: fullPath,
                crossSkillXP: crossSkillXP,
                img: itemData.img
            });
            
            cumulativeXP += optResult.totalXP;
        }
        
        // 3. AGGREGATE RESULTS
        const totalCraftTime = tierResults.reduce((sum, t) => sum + t.timeRequired, 0);
        const totalCraftXP = tierResults.reduce((sum, t) => sum + t.xpGained, 0);
        
        // Calculate total cross-skill time
        let totalCrossSkillTime = 0;
        const aggregatedCrossSkillXP = {};
        
        tierResults.forEach(tier => {
            Object.entries(tier.crossSkillXP).forEach(([skill, data]) => {
                if (!aggregatedCrossSkillXP[skill]) {
                    aggregatedCrossSkillXP[skill] = { xp: 0, time: 0, timeWithAltResources: 0, items: {} };
                }
                aggregatedCrossSkillXP[skill].xp += data.xp;
                aggregatedCrossSkillXP[skill].time += data.time;
                aggregatedCrossSkillXP[skill].timeWithAltResources += data.timeWithAltResources || 0;
                totalCrossSkillTime += data.time;
                
                Object.entries(data.items).forEach(([itemName, qty]) => {
                    if (!aggregatedCrossSkillXP[skill].items[itemName]) {
                        aggregatedCrossSkillXP[skill].items[itemName] = 0;
                    }
                    aggregatedCrossSkillXP[skill].items[itemName] += qty;
                });
            });
        });
        
        const result = {
            mode: 'auto',
            skill: this.currentSkill,
            currentLevel: currentLevel,
            targetLevel: targetLevel,
            tiers: tierResults,
            totalCraftTime: totalCraftTime,
            totalCraftXP: totalCraftXP,
            totalTime: totalCraftTime + totalCrossSkillTime,
            crossSkillXP: aggregatedCrossSkillXP
        };
        
        console.log('[Optimizer] ✅ Auto progression complete:', result);
        
        // Show results
        this.showAutoProgressionResult(result);
        
        return result;
    },
    
    /**
     * Calculate XP gained in other skills from gathering/crafting requirements
     * Enhanced version: tracks all gathering skills (Herbalism, Fishing, Mining, etc.)
     * Filters out ALT resources (Bone Ore, Coal Ore, Arcane Crystal) from TIME calculations
     * @param {Array} path - Array of path steps
     * @returns {Object} { skillName: { xp, time, timeWithAltResources, items: {} } }
     */
    calculateCrossSkillXP_v2(path) {
        const crossSkillXP = {};
        
        path.forEach(step => {
            // Only process gathered items (resources)
            if (!step.isGathered) return;
            
            // Determine the source skill
            let sourceSkill = step.skill;
            
            // If skill is not defined, try to infer from item name patterns
            if (!sourceSkill && step.itemName) {
                const itemName = step.itemName.toLowerCase();
                
                // Common patterns for gathering skills
                if (itemName.includes('ore') || itemName.includes('crystal')) {
                    sourceSkill = 'mining';
                } else if (itemName.includes('log') || itemName.includes('wood')) {
                    sourceSkill = 'woodcutting';
                } else if (itemName.includes('herb') || itemName.includes('leaf') || itemName.includes('flower')) {
                    sourceSkill = 'herbalism';
                } else if (itemName.includes('fish') || itemName.includes('crab') || itemName.includes('shrimp')) {
                    sourceSkill = 'fishing';
                } else if (itemName.includes('hide') || itemName.includes('pelt') || itemName.includes('bone')) {
                    sourceSkill = 'tracking';
                } else if (itemName.includes('grass') || itemName.includes('fiber') || itemName.includes('seed')) {
                    sourceSkill = 'gathering';
                }
            }
            
            // Skip if we still can't determine the skill
            if (!sourceSkill) {
                console.warn(`[Optimizer] Could not determine source skill for gathered item: ${step.itemName}`);
                return;
            }
            
            // Only track gathering skills (not crafting skills)
            const isGatheringSkill = Constants.GATHERING_SKILLS.includes(sourceSkill);
            if (!isGatheringSkill) return;
            
            // Check if this is an ALT resource (Bone Ore, Coal Ore, Arcane Crystal)
            const isAltResource = Constants.IGNORED_ALT_RESOURCES.includes(step.itemName);
            
            // Initialize skill entry if needed
            if (!crossSkillXP[sourceSkill]) {
                crossSkillXP[sourceSkill] = { 
                    xp: 0, 
                    time: 0, // Time WITHOUT alt resources
                    timeWithAltResources: 0, // Time WITH alt resources (for display)
                    items: {} 
                };
            }
            
            // Add XP (always count XP, even for alt resources for display purposes)
            const stepXp = parseFloat(step.totalXp) || 0;
            if (!isNaN(stepXp)) {
                crossSkillXP[sourceSkill].xp += stepXp;
            }
            
            // Add time to timeWithAltResources (for display)
            const stepTime = parseFloat(step.totalTime) || 0;
            if (!isNaN(stepTime)) {
                crossSkillXP[sourceSkill].timeWithAltResources += stepTime;
            }
            
            // Add time to 'time' ONLY if NOT an alt resource (for total calculation)
            if (!isAltResource && !isNaN(stepTime)) {
                crossSkillXP[sourceSkill].time += stepTime;
            }
            
            // Track item quantities
            if (!crossSkillXP[sourceSkill].items[step.itemName]) {
                crossSkillXP[sourceSkill].items[step.itemName] = 0;
            }
            crossSkillXP[sourceSkill].items[step.itemName] += step.quantity;
        });
        
        return crossSkillXP;
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * INTERNAL OPTIMIZATION LOGIC (SHARED BY MANUAL AND AUTO MODES)
     * ═══════════════════════════════════════════════════════════════
     * Calculate optimal crafting path for an item using the full optimization algorithm
     * This is the CORE logic extracted from manual mode to be reused by auto mode
     * 
     * @param {string} itemName - Name of the item to craft
     * @param {number} xpNeeded - XP needed
     * @param {string} skill - Skill name
     * @returns {Object|null} { path, totalXP, totalTime, overshoot, finalCraftsNeeded, materialCraftsNeeded }
     */
    findOptimalCraftingPathInternal(itemName, xpNeeded, skill) {
        console.log(`[Optimizer] findOptimalCraftingPathInternal: ${itemName}, xpNeeded=${xpNeeded}, skill=${skill}`);
        
        // Get item data
        const itemData = ItemDataEngine.getItemData(itemName);
        if (!itemData) {
            console.error(`[Optimizer] Item data not found: ${itemName}`);
            return null;
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
                        Constants.MATERIAL_PATTERNS.CLOTH.test(req.itemName) ||
                        Constants.MATERIAL_PATTERNS.EXTRACT.test(req.itemName);
                    
                    const isWeaponComponent = 
                        Constants.MATERIAL_PATTERNS.HANDLE.test(req.itemName) ||
                        Constants.MATERIAL_PATTERNS.BOWSTRING.test(req.itemName) ||
                        Constants.MATERIAL_PATTERNS.GEMSTONE.test(req.itemName);
                    
                    // Check if material should be included
                    let shouldIncludeMaterial = (isGenericMaterial || isWeaponComponent);
                    
                    // SPECIAL CASE for "crafting" skill: verify material belongs to same skill
                    // (prevents counting Wool Cloth XP/time in crafting calculations)
                    if (skill === 'crafting' && shouldIncludeMaterial) {
                        const materialBelongsToSameSkill = matData.skill === skill;
                        if (!materialBelongsToSameSkill) {
                            console.log(`[Optimizer] Excluding cross-skill material for crafting: ${req.itemName} (skill: ${matData.skill})`);
                            shouldIncludeMaterial = false;
                        }
                    }
                    
                    // Only add if it's a valid craftable material
                    if (shouldIncludeMaterial) {
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
                    
                    // FLEXIBLE LOGIC FOR COMPLEX WEAPONS
                    let shouldCraftMoreItems;
                    
                    if (isComplexWeapon && bestGenericMaterial) {
                        const deficitRatio = xpMissing / itemXP;
                        const ratioComparison = bestGenericRatio / itemRatio;
                        
                        const smallDeficit = deficitRatio < 0.2;
                        const reasonableRatio = ratioComparison >= 0.7;
                        
                        shouldCraftMoreItems = !smallDeficit && !reasonableRatio && itemRatio > bestGenericRatio;
                    } else {
                        shouldCraftMoreItems = !bestGenericMaterial || itemRatio >= bestGenericRatio;
                    }
                    
                    if (shouldCraftMoreItems) {
                        continue;
                    } else {
                        // Use generic materials to fill the gap
                        if (bestGenericMaterial) {
                            const extraCount = Math.ceil(xpMissing / bestGenericMaterial.xpPerCraft);
                            extraMaterialsNeeded[bestGenericMaterial.name] = extraCount;
                            extraMaterialTime = extraCount * bestGenericMaterial.actionTime;
                            totalXP = xpSoFar + extraCount * bestGenericMaterial.xpPerCraft;
                        } else if (isComplexWeapon && weaponComponents.length > 0) {
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
                        materialCraftsNeeded[matName] = actualCraftsNeeded;
                    }
                });
                
                console.log(`[Optimizer] Optimal solution: ${finalCraftsNeeded} items + materials:`, materialCraftsNeeded, `(overshoot: ${smallestOvershoot} XP)`);
            } else {
                // Fallback
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
        
        // Add material crafting steps
        if (Object.keys(materialCraftsNeeded).length > 0) {
            materialCrafts.forEach(mat => {
                const craftsForThisMaterial = materialCraftsNeeded[mat.name] || 0;
                
                if (craftsForThisMaterial === 0) return;
                
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
                    levelRequired: matData?.levelRequired || 1,
                    skill: skill,
                    isGathered: false,
                    isCraftedMaterial: true
                });
            });
        }
        
        // Add final item crafting step
        if (finalCraftsNeeded > 0) {
            const finalItemXP = finalCraftsNeeded * itemData.baseXp;
            const finalItemTime = finalCraftsNeeded * itemData.modifiedTime;
            
            path.push({
                itemName: itemName,
                quantity: finalCraftsNeeded,
                xpPerAction: itemData.baseXp,
                timePerAction: itemData.modifiedTime,
                totalXp: finalItemXP,
                totalTime: finalItemTime,
                img: itemData.img,
                levelRequired: itemData.levelRequired,
                skill: skill,
                isGathered: false,
                isCraftedMaterial: false
            });
        }
        
        // Calculate totals
        let totalXP = path.reduce((sum, step) => sum + step.totalXp, 0);
        let totalTime = path.reduce((sum, step) => sum + step.totalTime, 0);
        
        // SIMPLE POST-OPTIMIZATION: Remove final items if overshoot > item XP
        if (finalCraftsNeeded > 0 && materialCrafts.length > 0 && Object.keys(materialTotalNeeded).length > 0) {
            const finalItemXP = itemData.baseXp;
            let currentOvershoot = totalXP - xpNeeded;
            
            while (finalCraftsNeeded > 1 && currentOvershoot > finalItemXP) {
                // Remove one final item
                finalCraftsNeeded--;
                
                // Adjust ALL materials proportionally
                materialCrafts.forEach(mat => {
                    if (mat.isWeaponComponent || mat.isGeneric) {
                        const totalNeededForNewCount = finalCraftsNeeded * mat.requiredPerFinalCraft;
                        const available = mat.available || 0;
                        const newCraftQuantity = Math.max(0, totalNeededForNewCount - available);
                        
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
                const finalStep = path.find(step => step.itemName === itemName);
                if (finalStep) {
                    finalStep.quantity = finalCraftsNeeded;
                    finalStep.totalXp = finalCraftsNeeded * itemData.baseXp;
                    finalStep.totalTime = finalCraftsNeeded * itemData.modifiedTime;
                }
                
                // Recalculate overshoot
                const newTotalXP = path.reduce((sum, step) => sum + step.totalXp, 0);
                currentOvershoot = newTotalXP - xpNeeded;
            }
            
            // Recalculate totals after optimization
            totalXP = path.reduce((sum, step) => sum + step.totalXp, 0);
            totalTime = path.reduce((sum, step) => sum + step.totalTime, 0);
        }
        
        return {
            path: path,
            totalXP: totalXP,
            totalTime: totalTime,
            overshoot: totalXP - xpNeeded,
            finalCraftsNeeded: finalCraftsNeeded,
            materialCraftsNeeded: materialCraftsNeeded
        };
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
                        Constants.MATERIAL_PATTERNS.CLOTH.test(req.itemName) ||
                        Constants.MATERIAL_PATTERNS.EXTRACT.test(req.itemName);
                    
                    const isWeaponComponent = 
                        Constants.MATERIAL_PATTERNS.HANDLE.test(req.itemName) ||
                        Constants.MATERIAL_PATTERNS.BOWSTRING.test(req.itemName) ||
                        Constants.MATERIAL_PATTERNS.GEMSTONE.test(req.itemName);
                    
                    // Check if material should be included
                    let shouldIncludeMaterial = (isGenericMaterial || isWeaponComponent);
                    
                    // SPECIAL CASE for "crafting" skill: verify material belongs to same skill
                    // (prevents counting Wool Cloth XP/time in crafting calculations)
                    if (this.currentSkill === 'crafting' && shouldIncludeMaterial) {
                        const materialBelongsToSameSkill = matData.skill === this.currentSkill;
                        if (!materialBelongsToSameSkill) {
                            console.log(`[Optimizer] Excluding cross-skill material for crafting: ${req.itemName} (skill: ${matData.skill})`);
                            shouldIncludeMaterial = false;
                        }
                    }
                    
                    // Only add if it's a valid craftable material
                    if (shouldIncludeMaterial) {
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
     * Show auto progression results (V2 - with detailed steps and cross-skill XP)
     * @param {Object} result - Auto progression result object
     */
    showAutoProgressionResult(result) {
        const content = document.getElementById('optimizerContent');
        if (!content) return;
        
        console.log('[Optimizer] Displaying AUTO MODE V2 result');
        
        const skillIcon = this.getSkillIconSVG(result.skill);
        const craftTimeFormatted = this.formatLongTime(result.totalCraftTime);
        const totalTimeFormatted = this.formatLongTime(result.totalTime);
        
        // Build time breakdown for summary (craft + gathering skills)
        // SKIP gathering skills with 0s (alt resources)
        let timeBreakdown = `${skillIcon} ${craftTimeFormatted}`;
        if (result.crossSkillXP && Object.keys(result.crossSkillXP).length > 0) {
            Object.entries(result.crossSkillXP).forEach(([skill, data]) => {
                // Skip if time is 0 (alt resources like Bone/Coal/Arcane)
                if (data.time === 0) return;
                
                const gatheringSkillIcon = this.getSkillIconSVG(skill);
                const gatheringTimeFormatted = this.formatLongTime(data.time);
                timeBreakdown += ` | ${gatheringSkillIcon} ${gatheringTimeFormatted}`;
            });
        }
        
        // Build cross-skill XP summary (COMPACT - one line)
        let crossSkillHtml = '';
        if (result.crossSkillXP && Object.keys(result.crossSkillXP).length > 0) {
            const crossSkillItems = Object.entries(result.crossSkillXP).map(([skill, data]) => {
                const skillCapitalized = skill.charAt(0).toUpperCase() + skill.slice(1);
                const skillIconSvg = this.getSkillIconSVG(skill);
                // Use timeWithAltResources for display (includes alt resources like Bone/Coal/Arcane)
                const timeFormatted = this.formatLongTime(data.timeWithAltResources);
                
                return `${skillIconSvg}<span style="font-weight: 600; color: #C5C6C9;">${skillCapitalized}</span> <span style="color: #17997f;">+${data.xp.toLocaleString()} XP</span> <span style="color: #8B8D91; font-size: 11px;">(${timeFormatted})</span>`;
            }).join(' <span style="color: #8B8D91;">|</span> ');
            
            crossSkillHtml = `
                <div style="
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    border-radius: 6px;
                    padding: 10px 14px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 13px;
                ">
                    <span style="color: #a78bfa; font-weight: 600; white-space: nowrap;">Cross-Skill XP:</span>
                    <span style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">${crossSkillItems}</span>
                </div>
            `;
        }
        
        // Calculate total requirements across ALL tiers (same logic as Manual Mode)
        // Build set of crafted items (items that appear as steps in all tier paths)
        const craftedItems = new Set();
        result.tiers.forEach(tier => {
            if (tier.path && tier.path.length > 0) {
                tier.path.forEach(step => {
                    craftedItems.add(step.itemName);
                });
            }
        });
        
        const totalRequirements = {};
        result.tiers.forEach(tier => {
            if (tier.path && tier.path.length > 0) {
                tier.path.forEach(step => {
                    const requirements = this.getStepRequirements(step.itemName);
                    requirements.forEach(req => {
                        // Skip if this requirement is itself crafted in the path
                        if (craftedItems.has(req.itemName)) {
                            return;
                        }
                        
                        const totalNeeded = req.required * step.quantity;
                        if (!totalRequirements[req.itemName]) {
                            totalRequirements[req.itemName] = {
                                itemName: req.itemName,
                                img: req.img,
                                totalNeeded: 0,
                                available: req.available
                            };
                        }
                        totalRequirements[req.itemName].totalNeeded += totalNeeded;
                    });
                });
            }
        });
        
        // Generate total requirements HTML (same style as manual mode)
        let totalRequirementsHtml = '';
        if (Object.keys(totalRequirements).length > 0) {
            const reqItemsHtml = Object.values(totalRequirements)
                .map(req => {
                    const hasEnough = req.available >= req.totalNeeded;
                    const statusIcon = hasEnough ? '✅' : '❌';
                    const statusColor = hasEnough ? '#5fdd5f' : '#ff6b6b';
                    
                    return `
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 6px 10px;
                            background: rgba(0, 0, 0, 0.2);
                            border-radius: 4px;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                        ">
                            ${req.img ? `<img src="${req.img}" style="width: 24px; height: 24px; flex-shrink: 0;">` : ''}
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-weight: 600; font-size: 12px; color: #fff; margin-bottom: 2px;">
                                    ${req.itemName}
                                </div>
                                <div style="font-size: 11px; color: ${statusColor};">
                                    Have: ${req.available.toLocaleString()} / Need: ${req.totalNeeded.toLocaleString()} ${statusIcon}
                                </div>
                            </div>
                        </div>
                    `;
                })
                .join('');
            
            totalRequirementsHtml = `
                <details style="
                    background: rgba(167, 139, 250, 0.1);
                    border: 1px solid rgba(167, 139, 250, 0.3);
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 16px;
                " id="totalRequirementsDetailsAuto">
                    <summary style="
                        cursor: pointer;
                        color: #a78bfa;
                        font-size: 14px;
                        font-weight: 600;
                        user-select: none;
                        list-style: none;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <span style="transition: transform 0.2s;">▶</span>
                        📦 Total Requirements (All Tiers)
                    </summary>
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 6px;
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px solid rgba(167, 139, 250, 0.2);
                    ">
                        ${reqItemsHtml}
                    </div>
                </details>
            `;
        }
        
        // Build tiers display with detailed steps
        let tiersHtml = '';
        result.tiers.forEach((tier, index) => {
            const tierTime = this.formatLongTime(tier.timeRequired);
            
            // Calculate total tier time (craft + gathering, EXCLUDING alt resources)
            let tierTotalTime = tier.timeRequired; // Crafting time only
            if (tier.crossSkillXP) {
                Object.values(tier.crossSkillXP).forEach(data => {
                    // Use 'time' which excludes alt resources (Bone/Coal/Arcane)
                    tierTotalTime += data.time;
                });
            }
            const tierTotalTimeFormatted = this.formatLongTime(tierTotalTime);
            
            // Build tier time breakdown
            // SKIP gathering skills with 0s (alt resources)
            const tierCraftTimeFormatted = this.formatLongTime(tier.timeRequired);
            const tierSkillIcon = this.getSkillIconSVG(result.skill);
            let tierTimeBreakdown = `${tierSkillIcon} ${tierCraftTimeFormatted}`;
            if (tier.crossSkillXP && Object.keys(tier.crossSkillXP).length > 0) {
                Object.entries(tier.crossSkillXP).forEach(([skill, data]) => {
                    // Skip if time is 0 (alt resources like Bone/Coal/Arcane)
                    if (data.time === 0) return;
                    
                    const gatheringSkillIcon = this.getSkillIconSVG(skill);
                    const gatheringTimeFormatted = this.formatLongTime(data.time);
                    tierTimeBreakdown += ` | ${gatheringSkillIcon} ${gatheringTimeFormatted}`;
                });
            }
            
            // Build path steps
            let stepsHtml = '';
            if (tier.path && tier.path.length > 0) {
                tier.path.forEach((step, stepIndex) => {
                    const stepTimeFormatted = this.formatLongTime(step.totalTime);
                    const isMainSkill = step.skill === result.skill;
                    // Remove emoji icons - relying on skill icon + color coding instead
                    const stepIcon = '';
                    const stepSkillIcon = step.skill ? this.getSkillIconSVG(step.skill) : '';
                    
                    stepsHtml += `
                        <div style="
                            padding: 8px 12px;
                            background: ${isMainSkill ? 'rgba(16, 185, 129, 0.05)' : 'rgba(139, 141, 145, 0.05)'};
                            border-left: 3px solid ${isMainSkill ? '#10b981' : '#8B8D91'};
                            border-radius: 4px;
                            margin-bottom: 6px;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                                    ${stepIcon ? `<span style="font-size: 16px;">${stepIcon}</span>` : ''}
                                    ${step.img ? `<img src="${step.img}" style="width: 20px; height: 20px; border-radius: 3px;">` : ''}
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; font-size: 13px; color: ${isMainSkill ? '#10b981' : '#C5C6C9'};">
                                            ${step.itemName} × ${step.quantity.toLocaleString()}
                                        </div>
                                        ${step.skill ? `
                                            <div style="display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                                                ${stepSkillIcon}
                                                <span style="font-size: 10px; color: #8B8D91;">
                                                    ${step.skill.charAt(0).toUpperCase() + step.skill.slice(1)}
                                                </span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 12px; font-weight: 600; color: ${isMainSkill ? '#10b981' : '#8B8D91'};">
                                        ${step.totalXp > 0 ? `+${step.totalXp.toLocaleString()} XP` : ''}
                                    </div>
                                    <div style="font-size: 10px; color: #8B8D91;">
                                        ${stepTimeFormatted}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            
            tiersHtml += `
                <div style="
                    background: #1e2330;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    padding: 14px;
                    margin-bottom: 12px;
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 12px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    ">
                        <div>
                            <div style="color: #6366f1; font-weight: 600; font-size: 14px; margin-bottom: 4px;">
                                Tier ${index + 1}: Level ${tier.startLevel} → ${tier.endLevel}
                            </div>
                            <div style="color: #8B8D91; font-size: 11px;">
                                Main craft: ${tier.bestItem}
                            </div>
                        </div>
                        <div style="text-align: right; max-width: 60%;">
                            <div style="font-size: 13px; color: #17997f; font-weight: 600; margin-bottom: 4px;">
                                ${tier.xpGained.toLocaleString()} ${result.skill} XP
                            </div>
                            <div style="font-size: 11px; color: #8B8D91; display: flex; align-items: center; gap: 4px; justify-content: flex-end; flex-wrap: wrap;">
                                <span style="white-space: nowrap;">⏱️ Total: ${tierTotalTimeFormatted}</span>
                                <span style="color: #6B7280;">→</span>
                                <span style="display: flex; align-items: center; gap: 4px; font-size: 10px; flex-wrap: wrap;">
                                    ${tierTimeBreakdown}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 10px;">
                        ${stepsHtml}
                    </div>
                </div>
            `;
        });
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #C5C6C9; margin-bottom: 10px; font-size: 18px;">⚡ Auto Progression Plan</h2>
                <div style="
                    margin-top: 10px;
                    padding: 8px 12px;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 6px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                ">
                    ${skillIcon}
                    <span style="font-weight: 600; color: #C5C6C9;">${result.skill.charAt(0).toUpperCase() + result.skill.slice(1)}</span>
                    <span style="color: #8B8D91;">→</span>
                    <span style="color: #10b981; font-weight: 600;">Level ${result.currentLevel} → ${result.targetLevel}</span>
                </div>
            </div>
            
            <div style="
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid #10b981;
                border-radius: 6px;
                padding: 14px 16px;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
            ">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="color: #8B8D91; font-size: 12px;">${result.skill.charAt(0).toUpperCase() + result.skill.slice(1)} XP:</span>
                    <span style="font-size: 15px; font-weight: 600; color: #17997f;">${result.totalCraftXP.toLocaleString()}</span>
                </div>
                <span style="color: #8B8D91;">|</span>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="color: #8B8D91; font-size: 12px; white-space: nowrap;">⏱️ TOTAL:</span>
                    <span style="font-size: 15px; font-weight: 700; color: #10b981;">${totalTimeFormatted}</span>
                    <span style="color: #8B8D91; font-size: 14px;">→</span>
                    <span style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: #C5C6C9; flex-wrap: wrap;">
                        ${timeBreakdown}
                    </span>
                </div>
            </div>
            
            ${crossSkillHtml}
            
            ${totalRequirementsHtml}
            
            <h3 style="margin: 20px 0 10px; color: #10b981; font-size: 16px;">Detailed Path by Tier:</h3>
            <div style="max-height: 380px; overflow-y: auto; padding-right: 4px; margin-bottom: 20px;">
                ${tiersHtml}
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: center; margin-top: auto;">
                <button id="backToStep1FromAutoBtn" style="
                    flex: 1;
                    padding: 10px 24px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 6px;
                    color: #C5C6C9;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                ">← Back</button>
                <button id="newOptimizationFromAutoBtn" style="
                    flex: 1;
                    padding: 10px 24px;
                    background: #4f46e5;
                    border: none;
                    border-radius: 6px;
                    color: #fff;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                ">New Optimization</button>
            </div>
        `;
        
        // Attach button listeners
        const backBtn = document.getElementById('backToStep1FromAutoBtn');
        const newOptBtn = document.getElementById('newOptimizationFromAutoBtn');
        
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
        
        if (newOptBtn) {
            newOptBtn.addEventListener('mouseenter', () => {
                newOptBtn.style.transform = 'translateY(-1px)';
                newOptBtn.style.boxShadow = '0 4px 8px rgba(79, 70, 229, 0.4)';
                newOptBtn.style.background = '#6366f1';
            });
            newOptBtn.addEventListener('mouseleave', () => {
                newOptBtn.style.transform = 'translateY(0)';
                newOptBtn.style.boxShadow = 'none';
                newOptBtn.style.background = '#4f46e5';
            });
            newOptBtn.addEventListener('click', () => {
                // Reset state
                this.currentSkill = null;
                this.targetLevel = null;
                this.finalItem = null;
                this.optimizationResult = null;
                
                console.log('[Optimizer] Starting new optimization from auto mode');
                this.showStep1();
            });
        }
        
        console.log('[Optimizer] Auto progression result displayed');
    },
    
    /**
     * Format time with days/hours/minutes for long durations
     */
    formatLongTime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    },
    
    /**
     * Get requirements for a step item
     */
    getStepRequirements(itemName) {
        const itemData = ItemDataEngine.getItemData(itemName);
        if (!itemData || !itemData.requirements || itemData.requirements.length === 0) {
            return [];
        }
        return itemData.requirements;
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
        
        console.log('[Optimizer] Displaying optimization result:', result);
        
        // Format time with days if > 24h
        const totalTimeFormatted = this.formatLongTime(result.totalTime);
        
        // Build path display with requirements
        let pathHtml = '';
        let cumulativeXP = result.currentXP;
        
        result.path.forEach((step, index) => {
            const stepTime = Math.floor(step.totalTime);
            const timeDisplay = this.formatLongTime(stepTime);
            const xpPerHour = step.totalTime > 0 ? Math.round((step.totalXp / step.totalTime) * 3600) : 0;
            
            // Calculate level range for this step
            const startLevel = State.calculateLevel(cumulativeXP);
            cumulativeXP += step.totalXp;
            const endLevel = State.calculateLevel(cumulativeXP);
            
            // Get requirements for this step
            const requirements = this.getStepRequirements(step.itemName);
            const hasRequirements = requirements.length > 0;
            
            // Build requirements HTML
            let requirementsHtml = '';
            if (hasRequirements) {
                let reqItemsHtml = '';
                requirements.forEach(req => {
                    const totalNeeded = req.required * step.quantity;
                    const hasEnough = req.available >= totalNeeded;
                    const statusIcon = hasEnough ? '✅' : '❌';
                    const statusColor = hasEnough ? '#5fdd5f' : '#ff6b6b';
                    
                    reqItemsHtml += `
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 6px 8px;
                            background: rgba(0, 0, 0, 0.2);
                            border-radius: 4px;
                            font-size: 11px;
                        ">
                            ${req.img ? `<img src="${req.img}" style="width: 20px; height: 20px; border-radius: 3px;">` : ''}
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-weight: 600; color: #C5C6C9; margin-bottom: 2px;">${req.itemName}</div>
                                <div style="color: ${statusColor};">
                                    Have: <strong>${req.available}</strong> / Need: <strong>${totalNeeded}</strong> ${statusIcon}
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                requirementsHtml = `
                    <details style="margin-top: 8px;">
                        <summary style="
                            cursor: pointer;
                            color: #a78bfa;
                            font-size: 12px;
                            font-weight: 600;
                            user-select: none;
                            padding: 4px 0;
                            list-style: none;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        ">
                            <span style="transition: transform 0.2s;">▶</span>
                            📦 Materials Required
                        </summary>
                        <div style="
                            margin-top: 8px;
                            padding: 8px;
                            background: rgba(0, 0, 0, 0.15);
                            border-radius: 4px;
                            display: flex;
                            flex-direction: column;
                            gap: 6px;
                        ">
                            ${reqItemsHtml}
                        </div>
                    </details>
                `;
            }
            
            pathHtml += `
                <div style="
                    background: #1e2330;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 8px;
                " data-step-index="${index}">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
                        <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
                            ${step.img ? `<img src="${step.img}" style="width: 32px; height: 32px; flex-shrink: 0;">` : ''}
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                                    <strong style="color: #fff; font-size: 14px;">${step.itemName}</strong>
                                    <span style="
                                        color: #c4b5fd;
                                        font-weight: 600;
                                        background: rgba(196, 181, 253, 0.15);
                                        border: 1px solid rgba(196, 181, 253, 0.3);
                                        padding: 2px 8px;
                                        border-radius: 4px;
                                        font-size: 12px;
                                    ">x${step.quantity}</span>
                                </div>
                            </div>
                        </div>
                        <div style="text-align: right; flex-shrink: 0;">
                            <div style="font-size: 15px; color: #17997f; font-weight: 600; margin-bottom: 2px;">
                                ${step.totalXp.toLocaleString()} XP
                            </div>
                            <div style="font-size: 13px; color: #8B8D91;">
                                ${timeDisplay} · ${xpPerHour.toLocaleString()} XP/h
                            </div>
                            <div style="font-size: 12px; color: #8B8D91; margin-top: 2px;">
                                ${step.timePerAction.toFixed(1)}s/action · Lvl ${startLevel} → ${endLevel}
                            </div>
                        </div>
                    </div>
                    ${requirementsHtml}
                </div>
            `;
        });
        
        // Calculate total requirements across all steps
        // Build set of crafted items (items that appear as steps in the path)
        const craftedItems = new Set(result.path.map(step => step.itemName));
        
        const totalRequirements = {};
        result.path.forEach(step => {
            const requirements = this.getStepRequirements(step.itemName);
            requirements.forEach(req => {
                // Skip if this requirement is itself crafted in the path
                if (craftedItems.has(req.itemName)) {
                    return;
                }
                
                const totalNeeded = req.required * step.quantity;
                if (!totalRequirements[req.itemName]) {
                    totalRequirements[req.itemName] = {
                        itemName: req.itemName,
                        img: req.img,
                        totalNeeded: 0,
                        available: req.available
                    };
                }
                totalRequirements[req.itemName].totalNeeded += totalNeeded;
            });
        });
        
        // Generate total requirements HTML
        let totalRequirementsHtml = '';
        if (Object.keys(totalRequirements).length > 0) {
            const reqItemsHtml = Object.values(totalRequirements)
                .map(req => {
                    const hasEnough = req.available >= req.totalNeeded;
                    const statusIcon = hasEnough ? '✅' : '❌';
                    const statusColor = hasEnough ? '#5fdd5f' : '#ff6b6b';
                    
                    return `
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 6px 8px;
                            background: rgba(0, 0, 0, 0.2);
                            border-radius: 4px;
                            font-size: 11px;
                        ">
                            ${req.img ? `<img src="${req.img}" style="width: 20px; height: 20px; border-radius: 3px;">` : ''}
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-weight: 600; color: #C5C6C9; margin-bottom: 2px;">${req.itemName}</div>
                                <div style="color: ${statusColor};">
                                    Have: <strong>${req.available}</strong> / Need: <strong>${req.totalNeeded}</strong> ${statusIcon}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            
            totalRequirementsHtml = `
                <details style="
                    background: rgba(167, 139, 250, 0.1);
                    border: 1px solid rgba(167, 139, 250, 0.3);
                    border-radius: 6px;
                    padding: 12px;
                    margin-top: 16px;
                    margin-bottom: 16px;
                " id="totalRequirementsDetails">
                    <summary style="
                        cursor: pointer;
                        color: #a78bfa;
                        font-size: 14px;
                        font-weight: 600;
                        user-select: none;
                        list-style: none;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <span style="transition: transform 0.2s;">▶</span>
                        📦 Total Requirements (All Steps)
                    </summary>
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 6px;
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px solid rgba(167, 139, 250, 0.2);
                    ">
                        ${reqItemsHtml}
                    </div>
                </details>
            `;
        }
        
        console.log('[Optimizer] Total requirements calculated:', Object.keys(totalRequirements).length, 'base materials (excluding crafted items)');
        
        content.innerHTML = `
            <div style="
                background: rgba(76, 175, 80, 0.1);
                border: 1px solid #4CAF50;
                border-radius: 6px;
                padding: 12px 15px;
                margin-bottom: 16px;
                display: flex;
                justify-content: space-around;
                align-items: center;
                gap: 20px;
            ">
                <div style="text-align: center;">
                    <div style="color: #8B8D91; font-size: 11px; margin-bottom: 4px;">XP Needed</div>
                    <div style="font-size: 16px; font-weight: 600;">${result.xpNeeded.toLocaleString()}</div>
                </div>
                <div style="text-align: center;">
                    <div style="color: #8B8D91; font-size: 11px; margin-bottom: 4px;">Total XP Gained</div>
                    <div style="font-size: 16px; font-weight: 600; color: #17997f;">
                        ${result.totalXP.toLocaleString()} 
                        <span style="font-size: 11px; color: #8B8D91; font-weight: normal;">(+${result.overshoot.toLocaleString()})</span>
                    </div>
                </div>
                <div style="text-align: center;">
                    <div style="color: #8B8D91; font-size: 11px; margin-bottom: 4px;">Total Time</div>
                    <div style="font-size: 16px; font-weight: 600;">${totalTimeFormatted}</div>
                </div>
            </div>
            
            <h3 style="margin: 20px 0 10px; color: #a78bfa; font-size: 16px;">Crafting Steps:</h3>
            <div style="max-height: 330px; overflow-y: auto; padding-right: 4px; margin-bottom: 20px;">
                ${pathHtml}
                ${totalRequirementsHtml}
            </div>
            
            <div style="display: flex; justify-content: center; margin-top: auto;">
                <button id="newOptimizationBtn" style="
                    padding: 10px 24px;
                    background: #4f46e5;
                    border: none;
                    border-radius: 6px;
                    color: #fff;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                ">Reset</button>
            </div>
        `;
        
        // Add hover effects for buttons
        const newOptBtn = document.getElementById('newOptimizationBtn');
        const closeBtn = document.getElementById('closeResultBtn');
        
        if (newOptBtn) {
            newOptBtn.addEventListener('mouseenter', () => {
                newOptBtn.style.transform = 'translateY(-1px)';
                newOptBtn.style.boxShadow = '0 4px 8px rgba(79, 70, 229, 0.4)';
                newOptBtn.style.background = '#6366f1';
            });
            newOptBtn.addEventListener('mouseleave', () => {
                newOptBtn.style.transform = 'translateY(0)';
                newOptBtn.style.boxShadow = 'none';
                newOptBtn.style.background = '#4f46e5';
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.background = 'rgba(255, 255, 255, 0.15)';
            });
            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            });
        }
        
        // Add toggle animation for details
        document.querySelectorAll('details').forEach(details => {
            details.addEventListener('toggle', (e) => {
                const arrow = e.target.querySelector('span');
                if (arrow) {
                    arrow.style.transform = details.open ? 'rotate(90deg)' : 'rotate(0deg)';
                }
            });
        });
        
        // Attach button listeners
        document.getElementById('newOptimizationBtn')?.addEventListener('click', () => {
            // Reset state before starting new optimization
            this.currentSkill = null;
            this.targetLevel = null;
            this.finalItem = null;
            this.optimizationResult = null;
            
            console.log('[Optimizer] Starting new optimization');
            this.showStep1();
        });
        
        document.getElementById('closeResultBtn')?.addEventListener('click', () => {
            console.log('[Optimizer] Closing optimizer');
            this.close();
        });
        
        console.log('[Optimizer] Result display complete with requirements');
    }
};


// Expose globally for use in other modules and main script
// Note: In @require scripts, we must use window directly as unsafeWindow is not available
window.Optimizer = Optimizer;