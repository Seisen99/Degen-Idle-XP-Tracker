// ====================
// MODULE 8: XP OPTIMIZER (SIMPLIFIED V2)
// ====================

import Constants from './constants.js';
import State from './state-manager.js';
import ItemDataEngine from './item-data-engine.js';
import GameDB from './database-loader.js';

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
            background: rgba(0, 0, 0, 0.98);
            border: 2px solid #FF6B6B;
            border-radius: 8px;
            color: #fff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            z-index: 10001;
            box-shadow: 0 8px 32px rgba(255, 107, 107, 0.3);
            display: flex;
            flex-direction: column;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #FF6B6B, #FF5252);
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 6px 6px 0 0;
            cursor: move;
        `;
        header.innerHTML = `
            <h3 style="margin: 0; font-size: 18px; font-weight: 600;">
                ⚡ XP Optimizer v2.0
            </h3>
            <button id="closeOptimizerBtn" style="
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: #fff;
                padding: 4px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            ">✕</button>
        `;
        
        // Create content area
        const content = document.createElement('div');
        content.id = 'optimizerContent';
        content.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        `;
        
        modal.appendChild(header);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        this.modalElement = modal;
        
        // Attach close button
        document.getElementById('closeOptimizerBtn').addEventListener('click', () => this.close());
        
        // Make draggable
        this.makeDraggable(modal, header);
    },
    
    /**
     * Make modal draggable
     */
    makeDraggable(modal, header) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            
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
     * Show Step 1: Select target level
     */
    showStep1() {
        const content = document.getElementById('optimizerContent');
        if (!content) return;
        
        // Get list of skills with levels
        const skillOptions = Constants.SKILLS_WITH_INTERMEDIATE_CRAFTS.map(skill => {
            const skillData = State.skills[skill] || { level: 1 };
            return `
                <div class="skill-option" style="
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 6px;
                    padding: 15px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                " data-skill="${skill}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-size: 20px; margin-right: 10px;">
                                ${Constants.SKILL_ICONS[skill] || '📊'}
                            </span>
                            <span style="font-size: 16px; font-weight: 600;">
                                ${skill.charAt(0).toUpperCase() + skill.slice(1)}
                            </span>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: #4CAF50; font-size: 14px;">Level ${skillData.level}</div>
                            <div style="color: #aaa; font-size: 12px;">${skillData.currentXP || 0} XP</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #FF6B6B; margin-bottom: 10px;">Step 1: Select Skill & Target Level</h2>
                <p style="color: #aaa; font-size: 14px;">
                    Choose the skill you want to optimize and your target level
                </p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; color: #aaa;">Select Skill:</label>
                ${skillOptions}
            </div>
            
            <div style="margin-top: 20px; display: none;" id="levelInputSection">
                <label style="display: block; margin-bottom: 10px; color: #aaa;">Target Level:</label>
                <input type="number" id="targetLevelInput" min="1" max="99" placeholder="Enter target level" style="
                    width: 100%;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 6px;
                    color: #fff;
                    font-size: 16px;
                ">
                
                <button id="step1NextBtn" style="
                    width: 100%;
                    padding: 12px;
                    margin-top: 20px;
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    border: none;
                    border-radius: 6px;
                    color: #fff;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                " disabled>Continue to Step 2 →</button>
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
                option.style.border = '1px solid #FF6B6B';
                option.style.background = 'rgba(255, 107, 107, 0.1)';
                
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
                    option.style.background = 'rgba(255, 255, 255, 0.1)';
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
        
        // Sort by level required
        finalItems.sort((a, b) => b.levelRequired - a.levelRequired);
        
        const itemOptions = finalItems.map(item => {
            const itemData = ItemDataEngine.getItemData(item.name);
            const canCraft = itemData && State.skills[this.currentSkill].level >= item.levelRequired;
            
            return `
                <div class="item-option" style="
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid ${canCraft ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 0, 0, 0.3)'};
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 8px;
                    cursor: ${canCraft ? 'pointer' : 'not-allowed'};
                    opacity: ${canCraft ? '1' : '0.5'};
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                " data-item="${item.name}" data-can-craft="${canCraft}">
                    ${item.img ? `<img src="${item.img}" style="width: 32px; height: 32px; object-fit: contain;">` : ''}
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 14px;">${item.name}</div>
                        <div style="color: #aaa; font-size: 12px;">
                            Level ${item.levelRequired} • ${item.baseXp} XP • ${itemData?.modifiedTime.toFixed(1)}s
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #4CAF50; font-size: 12px;">
                            ${itemData ? `${itemData.xpPerHour.toLocaleString()} XP/h` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #FF6B6B; margin-bottom: 10px;">Step 2: Select Final Item to Craft</h2>
                <p style="color: #aaa; font-size: 14px;">
                    Choose the item you want to craft to reach level ${this.targetLevel}
                </p>
                <div style="margin-top: 10px; padding: 10px; background: rgba(255, 107, 107, 0.1); border-radius: 6px;">
                    <strong>${this.currentSkill.charAt(0).toUpperCase() + this.currentSkill.slice(1)}</strong>
                    → Level ${this.targetLevel}
                </div>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto;">
                ${itemOptions}
            </div>
            
            <button id="backToStep1Btn" style="
                width: 100%;
                padding: 12px;
                margin-top: 20px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                color: #fff;
                font-size: 14px;
                cursor: pointer;
            ">← Back to Step 1</button>
        `;
        
        // Attach item selection listeners
        document.querySelectorAll('.item-option').forEach(option => {
            const canCraft = option.dataset.canCraft === 'true';
            
            if (canCraft) {
                option.addEventListener('click', () => {
                    this.finalItem = option.dataset.item;
                    this.calculateOptimalPath();
                });
                
                // Hover effect
                option.addEventListener('mouseenter', () => {
                    option.style.background = 'rgba(255, 107, 107, 0.1)';
                    option.style.border = '1px solid #FF6B6B';
                });
                
                option.addEventListener('mouseleave', () => {
                    option.style.background = 'rgba(255, 255, 255, 0.05)';
                    option.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                });
            }
        });
        
        // Back button
        document.getElementById('backToStep1Btn')?.addEventListener('click', () => {
            this.showStep1();
        });
    },
    
    /**
     * Calculate optimal crafting path
     */
    calculateOptimalPath() {
        console.log('[Optimizer] Calculating optimal path...');
        
        const currentXP = State.skills[this.currentSkill]?.currentXP || 0;
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
        
        // Calculate base quantities needed
        const finalItemsNeeded = Math.ceil(xpNeeded / itemData.baseXp);
        
        // Get crafting path
        const craftingPath = ItemDataEngine.calculateCraftingPath(this.finalItem, finalItemsNeeded);
        
        // Try to optimize by reducing overshoot
        let optimizedQuantity = finalItemsNeeded;
        let bestOvershoot = (finalItemsNeeded * itemData.baseXp) - xpNeeded;
        
        // Check if we can craft fewer items
        for (let qty = finalItemsNeeded - 1; qty > 0; qty--) {
            const totalXP = qty * itemData.baseXp;
            
            // Add XP from intermediate crafts
            let intermediateXP = 0;
            if (craftingPath.path.length > 1) {
                const scale = qty / finalItemsNeeded;
                craftingPath.path.forEach(step => {
                    if (step.itemName !== this.finalItem) {
                        intermediateXP += Math.floor(step.totalXp * scale);
                    }
                });
            }
            
            const totalCraftingXP = totalXP + intermediateXP;
            
            if (totalCraftingXP >= xpNeeded) {
                const overshoot = totalCraftingXP - xpNeeded;
                if (overshoot < bestOvershoot) {
                    optimizedQuantity = qty;
                    bestOvershoot = overshoot;
                }
            } else {
                break; // Can't reduce further
            }
        }
        
        // Recalculate path with optimized quantity
        const finalPath = ItemDataEngine.calculateCraftingPath(this.finalItem, optimizedQuantity);
        
        // Store result
        this.optimizationResult = {
            currentXP,
            targetXP,
            xpNeeded,
            finalItem: this.finalItem,
            finalQuantity: optimizedQuantity,
            path: finalPath.path,
            totalXP: finalPath.totalXp,
            totalTime: finalPath.totalTime,
            overshoot: finalPath.totalXp - xpNeeded,
            materialNeeds: finalPath.materialNeeds
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
                            ${step.totalXp} XP • ${Math.floor(stepTime / 60)}m ${stepTime % 60}s
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