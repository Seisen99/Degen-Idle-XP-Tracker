// ====================
// MODULE 7: UI MANAGER
// ====================

import Constants from './constants.js';
import State from './state-manager.js';
import ItemDataEngine from './item-data-engine.js';

const UI = {
    elements: {},
    updateInterval: null,
    isMobile: false,
    
    /**
     * Initialize UI
     */
    init() {
        console.log('[UI] Initializing UI manager');
        
        // Detect mobile
        this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Create styles
        this.createStyles();
        
        // Create main UI
        this.createUI();
        
        // Setup event listeners
        this.attachEventListeners();
        
        // Start real-time updates
        this.startRealTimeUpdates();
        
        // Register state update callback
        State.onUpdate(() => this.update());
        
        console.log('[UI] UI manager initialized');
    },
    
    /**
     * Create CSS styles
     */
    createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Main Panel Styles */
            #degenLevelTracker {
                position: fixed;
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid #4a90e2;
                border-radius: 8px;
                color: #fff;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                z-index: 10000;
                transition: all 0.3s ease;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            }
            
            #degenLevelTracker.collapsed {
                height: 45px !important;
                overflow: hidden;
            }
            
            #degenLevelTracker .header {
                background: linear-gradient(135deg, #4a90e2, #357abd);
                padding: 10px;
                cursor: move;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 6px 6px 0 0;
            }
            
            #degenLevelTracker .header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            #degenLevelTracker .header-buttons {
                display: flex;
                gap: 8px;
            }
            
            #degenLevelTracker .header button {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: #fff;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s;
            }
            
            #degenLevelTracker .header button:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            #degenLevelTracker .content {
                padding: 10px;
                max-height: calc(100% - 45px);
                overflow-y: auto;
            }
            
            /* Tabs */
            .tracker-tabs {
                display: flex;
                gap: 5px;
                margin-bottom: 10px;
                border-bottom: 2px solid #333;
            }
            
            .tracker-tab {
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: #fff;
                cursor: pointer;
                border-radius: 4px 4px 0 0;
                transition: background 0.2s;
            }
            
            .tracker-tab:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .tracker-tab.active {
                background: #4a90e2;
            }
            
            /* Task Card */
            .task-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 10px;
            }
            
            .task-card.active {
                border-color: #4CAF50;
                background: rgba(76, 175, 80, 0.1);
            }
            
            .task-card.preview {
                border-color: #FFC107;
                background: rgba(255, 193, 7, 0.1);
            }
            
            .task-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .task-title {
                font-weight: 600;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .skill-icon {
                font-size: 16px;
            }
            
            .task-status {
                font-size: 12px;
                padding: 2px 6px;
                border-radius: 3px;
                background: rgba(255, 255, 255, 0.1);
            }
            
            /* Progress Bar */
            .progress-container {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
                height: 20px;
                position: relative;
                overflow: hidden;
                margin: 5px 0;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #66BB6A);
                transition: width 0.3s ease;
                border-radius: 4px;
            }
            
            .progress-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 11px;
                font-weight: 600;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            }
            
            /* Task Info */
            .task-info {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
                margin-top: 8px;
                font-size: 12px;
            }
            
            .info-item {
                display: flex;
                justify-content: space-between;
                padding: 4px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
            }
            
            .info-label {
                color: #aaa;
            }
            
            .info-value {
                font-weight: 600;
                color: #fff;
            }
            
            /* Requirements */
            .requirements-section {
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .requirements-title {
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 5px;
                color: #aaa;
            }
            
            .requirement-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
                margin-bottom: 4px;
                font-size: 11px;
            }
            
            .requirement-icon {
                width: 20px;
                height: 20px;
                object-fit: contain;
            }
            
            .requirement-info {
                flex: 1;
                display: flex;
                justify-content: space-between;
            }
            
            .requirement-name {
                color: #fff;
            }
            
            .requirement-quantity {
                color: #4CAF50;
            }
            
            .requirement-quantity.insufficient {
                color: #f44336;
            }
            
            /* Target Level Input */
            .target-level-section {
                margin-top: 10px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
            }
            
            .target-level-input {
                display: flex;
                gap: 8px;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .target-level-input label {
                font-size: 12px;
                color: #aaa;
            }
            
            .target-level-input input {
                width: 60px;
                padding: 4px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 3px;
                color: #fff;
                font-size: 12px;
            }
            
            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 20px;
                color: #aaa;
                font-size: 13px;
            }
            
            /* Scrollbar */
            #degenLevelTracker .content::-webkit-scrollbar {
                width: 8px;
            }
            
            #degenLevelTracker .content::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
            }
            
            #degenLevelTracker .content::-webkit-scrollbar-thumb {
                background: #4a90e2;
                border-radius: 4px;
            }
            
            #degenLevelTracker .content::-webkit-scrollbar-thumb:hover {
                background: #357abd;
            }
            
            /* Mobile Styles */
            @media (max-width: 768px) {
                #degenLevelTracker {
                    width: 100% !important;
                    height: auto !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    top: auto !important;
                    border-radius: 12px 12px 0 0;
                    max-height: 70vh;
                }
                
                #degenLevelTracker .header {
                    cursor: default;
                }
                
                .task-info {
                    grid-template-columns: 1fr;
                }
            }
            
            /* Resize Handle */
            .resize-handle {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 20px;
                height: 20px;
                cursor: nwse-resize;
                opacity: 0.3;
            }
            
            .resize-handle::after {
                content: '';
                position: absolute;
                bottom: 3px;
                right: 3px;
                width: 10px;
                height: 10px;
                border-right: 2px solid #fff;
                border-bottom: 2px solid #fff;
            }
        `;
        document.head.appendChild(style);
    },
    
    /**
     * Create main UI
     */
    createUI() {
        // Remove existing panel if any
        const existing = document.getElementById('degenLevelTracker');
        if (existing) {
            existing.remove();
        }
        
        // Create main container
        const panel = document.createElement('div');
        panel.id = 'degenLevelTracker';
        panel.className = State.ui.isExpanded ? '' : 'collapsed';
        panel.style.display = State.ui.isOpen ? 'block' : 'none';
        
        // Set position
        if (!this.isMobile) {
            panel.style.top = `${State.ui.position.top}px`;
            panel.style.left = `${State.ui.position.left}px`;
            panel.style.width = `${State.ui.position.width}px`;
            panel.style.height = `${State.ui.position.height}px`;
        }
        
        // Create header
        const header = document.createElement('div');
        header.className = 'header';
        header.innerHTML = `
            <h3>🎯 XP Tracker v3.0</h3>
            <div class="header-buttons">
                <button id="optimizerBtn">⚡ Optimizer</button>
                <button id="clearCacheBtn">🗑️ Clear</button>
                <button id="expandBtn">${State.ui.isExpanded ? '▼' : '▲'}</button>
                <button id="closeBtn">✕</button>
            </div>
        `;
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'content';
        content.innerHTML = `
            <div class="tracker-tabs">
                <button class="tracker-tab active" data-tab="active">Active Tasks</button>
                <button class="tracker-tab" data-tab="preview">Preview</button>
                <button class="tracker-tab" data-tab="stats">Stats</button>
            </div>
            <div id="tabContent">
                <!-- Content will be dynamically updated -->
            </div>
        `;
        
        // Add resize handle for desktop
        if (!this.isMobile) {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            panel.appendChild(resizeHandle);
        }
        
        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);
        
        // Store element references
        this.elements.panel = panel;
        this.elements.header = header;
        this.elements.content = content;
        this.elements.tabContent = content.querySelector('#tabContent');
        
        console.log('[UI] Main UI created');
    },
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Header buttons
        document.getElementById('optimizerBtn')?.addEventListener('click', () => {
            console.log('[UI] Opening optimizer');
            // Optimizer will be implemented in the next module
        });
        
        document.getElementById('clearCacheBtn')?.addEventListener('click', () => {
            if (confirm('Clear all cached data?')) {
                localStorage.clear();
                location.reload();
            }
        });
        
        document.getElementById('expandBtn')?.addEventListener('click', () => {
            State.toggleExpanded();
            this.elements.panel.classList.toggle('collapsed');
            document.getElementById('expandBtn').textContent = State.ui.isExpanded ? '▼' : '▲';
        });
        
        document.getElementById('closeBtn')?.addEventListener('click', () => {
            State.togglePanel();
            this.elements.panel.style.display = 'none';
        });
        
        // Tab switching
        document.querySelectorAll('.tracker-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.tracker-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.update();
            });
        });
        
        // Keyboard shortcut (Alt+X)
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'x') {
                State.togglePanel();
                this.elements.panel.style.display = State.ui.isOpen ? 'block' : 'none';
            }
        });
        
        // Make panel draggable (desktop only)
        if (!this.isMobile) {
            this.makeDraggable();
            this.makeResizable();
        }
    },
    
    /**
     * Make panel draggable
     */
    makeDraggable() {
        const header = this.elements.header;
        const panel = this.elements.panel;
        
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = panel.offsetLeft;
            initialTop = panel.offsetTop;
            
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            panel.style.left = `${initialLeft + deltaX}px`;
            panel.style.top = `${initialTop + deltaY}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                
                State.updatePosition({
                    left: panel.offsetLeft,
                    top: panel.offsetTop
                });
            }
        });
    },
    
    /**
     * Make panel resizable
     */
    makeResizable() {
        const panel = this.elements.panel;
        const handle = panel.querySelector('.resize-handle');
        
        if (!handle) return;
        
        let isResizing = false;
        let startX, startY, initialWidth, initialHeight;
        
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            initialWidth = panel.offsetWidth;
            initialHeight = panel.offsetHeight;
            
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            panel.style.width = `${Math.max(300, initialWidth + deltaX)}px`;
            panel.style.height = `${Math.max(200, initialHeight + deltaY)}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.userSelect = '';
                
                State.updatePosition({
                    width: panel.offsetWidth,
                    height: panel.offsetHeight
                });
            }
        });
    },
    
    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            if (State.ui.isOpen && State.ui.isExpanded && State.activeTasks.length > 0) {
                this.updateActiveTasks();
            }
        }, Constants.UI_CONFIG.UPDATE_INTERVAL);
    },
    
    /**
     * Update UI
     */
    update() {
        const activeTab = document.querySelector('.tracker-tab.active')?.dataset.tab || 'active';
        
        switch(activeTab) {
            case 'active':
                this.renderActiveTasks();
                break;
            case 'preview':
                this.renderPreview();
                break;
            case 'stats':
                this.renderStats();
                break;
        }
    },
    
    /**
     * Render active tasks
     */
    renderActiveTasks() {
        if (!this.elements.tabContent) return;
        
        if (State.activeTasks.length === 0) {
            this.elements.tabContent.innerHTML = `
                <div class="empty-state">
                    No active tasks. Start crafting something in the game!
                </div>
            `;
            return;
        }
        
        let html = '';
        
        State.activeTasks.forEach(task => {
            const currentXP = State.calculateCurrentXP(task.skillName);
            const currentLevel = State.calculateLevel(currentXP);
            const nextLevel = Math.min(99, currentLevel + 1);
            const currentLevelXP = State.getXPForLevel(currentLevel);
            const nextLevelXP = State.getXPForLevel(nextLevel);
            const progress = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
            
            html += `
                <div class="task-card active">
                    <div class="task-header">
                        <div class="task-title">
                            <span class="skill-icon">${Constants.SKILL_ICONS[task.skillName] || '📊'}</span>
                            ${task.skillNameDisplay} - ${task.itemName}
                        </div>
                        <div class="task-status">ACTIVE</div>
                    </div>
                    
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                        <div class="progress-text">
                            Level ${currentLevel} → ${nextLevel} (${progress.toFixed(1)}%)
                        </div>
                    </div>
                    
                    <div class="task-info">
                        <div class="info-item">
                            <span class="info-label">XP/Action:</span>
                            <span class="info-value">${task.expPerAction}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Time/Action:</span>
                            <span class="info-value">${task.modifiedActionTime.toFixed(1)}s</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Current XP:</span>
                            <span class="info-value">${Math.floor(currentXP).toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">XP/Hour:</span>
                            <span class="info-value">${Math.floor(task.expPerAction * 3600 / task.modifiedActionTime).toLocaleString()}</span>
                        </div>
                    </div>
                    
                    ${this.renderTargetLevelInput(task.skillName)}
                </div>
            `;
        });
        
        this.elements.tabContent.innerHTML = html;
        
        // Attach target level input listeners
        this.attachTargetLevelListeners();
    },
    
    /**
     * Render target level input
     */
    renderTargetLevelInput(skillName) {
        const savedTarget = State.getSavedInputValue(`target_${skillName}`, '');
        const calculation = savedTarget ? State.calculateTimeToLevel(skillName, parseInt(savedTarget)) : null;
        
        return `
            <div class="target-level-section">
                <div class="target-level-input">
                    <label>Target Level:</label>
                    <input type="number" 
                           class="target-input" 
                           data-skill="${skillName}"
                           value="${savedTarget}"
                           min="1" 
                           max="99" 
                           placeholder="99">
                </div>
                ${calculation && calculation.possible ? `
                    <div class="task-info">
                        <div class="info-item">
                            <span class="info-label">XP Needed:</span>
                            <span class="info-value">${calculation.xpNeeded.toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Actions:</span>
                            <span class="info-value">${calculation.actionsNeeded.toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Time:</span>
                            <span class="info-value">${calculation.hoursNeeded}h ${calculation.minutesNeeded}m</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    /**
     * Attach target level listeners
     */
    attachTargetLevelListeners() {
        document.querySelectorAll('.target-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const skill = e.target.dataset.skill;
                const value = e.target.value;
                State.saveInputValue(`target_${skill}`, value);
                
                // Debounce update
                clearTimeout(this.targetUpdateTimeout);
                this.targetUpdateTimeout = setTimeout(() => {
                    this.update();
                }, 300);
            });
        });
    },
    
    /**
     * Update active tasks (real-time)
     */
    updateActiveTasks() {
        const activeTab = document.querySelector('.tracker-tab.active')?.dataset.tab;
        if (activeTab === 'active') {
            this.renderActiveTasks();
        }
    },
    
    /**
     * Render preview
     */
    renderPreview() {
        if (!this.elements.tabContent) return;
        
        if (!State.previewTask) {
            this.elements.tabContent.innerHTML = `
                <div class="empty-state">
                    Click on an item in the game to preview it here.
                </div>
            `;
            return;
        }
        
        const task = State.previewTask;
        
        let html = `
            <div class="task-card preview">
                <div class="task-header">
                    <div class="task-title">
                        <span class="skill-icon">${Constants.SKILL_ICONS[task.skillName] || '📊'}</span>
                        ${task.skillNameDisplay} - ${task.itemName}
                    </div>
                    <div class="task-status">PREVIEW</div>
                </div>
                
                <div class="task-info">
                    <div class="info-item">
                        <span class="info-label">XP/Action:</span>
                        <span class="info-value">${task.expPerAction}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Time/Action:</span>
                        <span class="info-value">${task.modifiedActionTime.toFixed(1)}s</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Level Required:</span>
                        <span class="info-value" style="color: ${task.isLevelTooLow ? '#f44336' : '#4CAF50'}">
                            ${task.skillLevel}
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">XP/Hour:</span>
                        <span class="info-value">${Math.floor(task.expPerAction * 3600 / task.modifiedActionTime).toLocaleString()}</span>
                    </div>
                </div>
                
                ${task.requirements && task.requirements.length > 0 ? this.renderRequirements(task.requirements) : ''}
            </div>
        `;
        
        this.elements.tabContent.innerHTML = html;
    },
    
    /**
     * Render requirements
     */
    renderRequirements(requirements) {
        let html = `
            <div class="requirements-section">
                <div class="requirements-title">Requirements:</div>
        `;
        
        requirements.forEach(req => {
            const sufficient = req.hasEnough;
            html += `
                <div class="requirement-item">
                    ${req.img ? `<img class="requirement-icon" src="${req.img}" alt="${req.itemName}">` : ''}
                    <div class="requirement-info">
                        <span class="requirement-name">${req.itemName}</span>
                        <span class="requirement-quantity ${sufficient ? '' : 'insufficient'}">
                            ${req.available} / ${req.required}
                        </span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    },
    
    /**
     * Render stats
     */
    renderStats() {
        if (!this.elements.tabContent) return;
        
        const inventoryStats = ItemDataEngine.getInventoryStats();
        
        let html = `
            <div class="task-card">
                <div class="task-header">
                    <div class="task-title">📊 Statistics</div>
                </div>
                
                <div class="task-info">
                    <div class="info-item">
                        <span class="info-label">Total Items:</span>
                        <span class="info-value">${inventoryStats.totalItems}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Quantity:</span>
                        <span class="info-value">${inventoryStats.totalQuantity.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add skill levels
        html += `
            <div class="task-card">
                <div class="task-header">
                    <div class="task-title">🎯 Skill Levels</div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px;">
        `;
        
        Constants.SKILLS.forEach(skill => {
            const skillData = State.skills[skill];
            if (skillData && skillData.level > 1) {
                html += `
                    <div class="info-item">
                        <span class="info-label">${skill}:</span>
                        <span class="info-value">Lv ${skillData.level}</span>
                    </div>
                `;
            }
        });
        
        html += `
                </div>
            </div>
        `;
        
        this.elements.tabContent.innerHTML = html;
    },
    
    /**
     * Cleanup
     */
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        if (this.elements.panel) {
            this.elements.panel.remove();
        }
        
        console.log('[UI] Cleaned up');
    }
};

export default UI;