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
                
                // POST-OPTIMIZATION: Check if we can reduce final items by 1 and still reach target
                // This minimizes overshoot by keeping materials but crafting fewer final items
                // IMPORTANT: Weapon components must be recalculated proportionally to final items
                // CRITICAL: Skip post-optimization if we used extra materials (they could be lost in recalculation)
                if (finalCraftsNeeded > 1 && !usedExtraMaterials) {
                    let testXP = 0;
                    const testItems = finalCraftsNeeded - 1;
                    
                    // Calculate XP with adjusted material quantities for test
                    materialCrafts.forEach(mat => {
                        let matCount;
                        if (mat.isWeaponComponent) {
                            // Weapon components must be proportional to final items
                            const neededForTest = testItems * mat.requiredPerFinalCraft;
                            const available = mat.available || 0;
                            matCount = Math.max(0, neededForTest - available);
                        } else {
                            // Generic materials keep same quantity (they provide extra XP)
                            matCount = materialCraftsNeeded[mat.name] || 0;
                        }
                        testXP += matCount * mat.xpPerCraft;
                    });
                    
                    testXP += testItems * itemXP;
                    
                    // If we still reach the target with 1 fewer item, use that instead
                    if (testXP >= xpNeeded) {
                        const newOvershoot = testXP - xpNeeded;
                        console.log(`[Optimizer] Post-optimization: reducing to ${testItems} items (XP: ${testXP}, overshoot: ${newOvershoot})`);
                        finalCraftsNeeded = testItems;
                        
                        // Recalculate weapon components proportionally
                        materialCrafts.forEach(mat => {
                            if (mat.isWeaponComponent) {
                                const newQuantity = testItems * mat.requiredPerFinalCraft;
                                const available = mat.available || 0;
                                materialCraftsNeeded[mat.name] = Math.max(0, newQuantity - available);
                                console.log(`[Optimizer] Adjusted weapon component ${mat.name}: ${materialCraftsNeeded[mat.name]} (for ${testItems} items)`);
                            }
                        });
                    } else {
                        console.log(`[Optimizer] Post-optimization: keeping ${finalCraftsNeeded} items (reducing would give ${testXP} < ${xpNeeded} needed)`);
                    }
                } else if (usedExtraMaterials) {
                    console.log(`[Optimizer] Post-optimization: SKIPPED (extra materials were used, must preserve exact quantities)`);
                }
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
        const totalXP = path.reduce((sum, step) => sum + step.totalXp, 0);
        const totalTime = path.reduce((sum, step) => sum + step.totalTime, 0);
        
        // CRITICAL VALIDATION: Ensure we reach the target XP
        if (totalXP < xpNeeded) {
            console.error(`[Optimizer] VALIDATION FAILED: totalXP (${totalXP}) < xpNeeded (${xpNeeded})`);
            this.showResult({
                error: `Optimization failed: Path only provides ${totalXP.toLocaleString()} XP but ${xpNeeded.toLocaleString()} XP is needed. Deficit: ${(xpNeeded - totalXP).toLocaleString()} XP. This is a bug - please report it.`
            });
            return;
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