// ====================
// MODULE 7: UI MANAGER (ENHANCED WITH V2 STYLING)
// ====================

// Dependencies: Constants, State, ItemDataEngine (loaded via @require)

const UI = {
    elements: {},
    updateInterval: null,
    realTimeInterval: null,
    updateUITimeout: null,
    targetUpdateTimeout: null,
    isDragging: false,
    isResizing: false,
    
    /**
     * Initialize UI
     */
    init() {
        console.log('[UI] Initializing enhanced UI manager');
        
        // Create styles
        this.createStyles();
        
        // Create main UI
        this.createUI();
        
        // Setup event listeners
        this.attachEventListeners();
        
        // Start real-time updates
        this.manageRealTimeUpdates();
        
        // Register state update callback
        State.onUpdate(() => this.debouncedUpdateUI());
        
        console.log('[UI] Enhanced UI manager initialized');
    },
    
    /**
     * Check if mobile
     */
    isMobile() {
        return window.matchMedia('(max-width: 768px)').matches;
    },
    
    /**
     * Debounced UI update
     */
    debouncedUpdateUI(immediate = false) {
        if (immediate) {
            clearTimeout(this.updateUITimeout);
            this.updateUI();
            return;
        }

        clearTimeout(this.updateUITimeout);
        this.updateUITimeout = setTimeout(() => {
            this.updateUI();
        }, 150);
    },
    
    /**
     * Create CSS styles matching v2 appearance
     */
    createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Main Panel Styles - Dark theme from v2 */
            #degenLevelTracker {
                position: fixed;
                background: #0B0E14;
                color: #e0e0e0;
                font-family: monospace;
                font-size: 13px;
                border-radius: 8px;
                z-index: 999999;
                border: 1px solid #1E2330;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                transition: opacity 0.3s ease;
                display: flex;
                flex-direction: column;
                resize: none;
            }
            
            /* Header styles matching v2 */
            #trackerHeader {
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
            }
            
            #trackerHeader.no-drag {
                cursor: default;
            }
            
            #trackerHeader h3 {
                margin: 0;
                color: white;
                font-size: 16px;
                font-weight: bold;
            }
            
            /* Header buttons */
            .header-buttons {
                display: flex;
                gap: 12px;
                align-items: center;
            }
            
            .tracker-btn {
                cursor: pointer;
                background: none;
                border: none;
                padding: 0;
                color: #8B8D91;
                transition: color 0.2s, opacity 0.2s;
                display: flex;
                align-items: center;
                opacity: 0.7;
            }
            
            .tracker-btn:hover {
                color: white !important;
                opacity: 1 !important;
            }
            
            #openOptimizerBtn {
                cursor: pointer;
                background: #2A3041;
                border: 1px solid #3A4051;
                padding: 6px 12px;
                color: #ffffff;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                transition: all 0.2s;
            }
            
            #openOptimizerBtn:hover {
                background: #3A4051 !important;
                border-color: #4A5061 !important;
                color: #ffffff !important;
            }
            
            /* Content area */
            #trackerContent {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                flex-direction: column;
                align-content: flex-start;
                min-width: 0;
            }
            
            /* Task sections */
            .task-section {
                padding: 12px;
                min-width: 0;
                box-sizing: border-box;
                flex-shrink: 0;
            }
            
            .section-title {
                font-weight: bold;
                margin-bottom: 8px;
                font-size: 13px;
            }
            
            .section-title.active {
                color: #5fdd5f;
            }
            
            .section-title.preview {
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            /* Task cards matching v2 */
            .task-card {
                background: #1E2330;
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 10px;
                border: 1px solid #2A3041;
                min-width: 0;
                box-sizing: border-box;
            }
            
            .task-card.active {
                border-left: 3px solid #5fdd5f;
            }
            
            .task-card.preview {
                border-left: 3px solid #ffd700;
            }
            
            /* Task header */
            .task-title {
                font-weight: bold;
                margin-bottom: 6px;
                color: white;
                word-wrap: break-word;
                overflow-wrap: break-word;
                font-size: 14px;
            }
            
            .task-title .item-name {
                color: #a78bfa;
            }
            
            /* Level info */
            .level-info {
                color: #8B8D91;
                font-size: 12px;
                margin-bottom: 4px;
            }
            
            /* Progress bar from v2 */
            .progress-container {
                background: #0B0E14;
                border-radius: 4px;
                height: 18px;
                margin-bottom: 6px;
                overflow: hidden;
                position: relative;
            }
            
            .progress-bar {
                background: linear-gradient(90deg, #4f46e5, #6366f1);
                height: 100%;
                transition: width 0.3s;
            }
            
            .progress-text {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 11px;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            }
            
            /* XP display */
            .xp-display {
                color: #C5C6C9;
                font-size: 12px;
                margin-bottom: 8px;
            }
            
            /* Next level info */
            .next-level-info {
                color: #60a5fa;
                font-size: 12px;
                margin-bottom: 8px;
            }
            
            /* Target level section */
            .target-level-section {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-top: 8px;
            }
            
            .target-level-section label {
                color: #6366f1;
                font-size: 12px;
            }
            
            .target-input {
                width: 50px;
                padding: 6px;
                background: #2A3041;
                border: 1px solid #1E2330;
                color: #fff;
                border-radius: 4px;
                font-size: 12px;
            }
            
            .calc-btn {
                padding: 6px 12px;
                background: #4f46e5;
                border: none;
                color: #fff;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s;
            }
            
            .calc-btn:hover {
                background: #6366f1 !important;
            }
            
            /* Target result */
            .target-result {
                margin-top: 8px;
                padding: 8px;
                background: #0B0E14;
                border-radius: 4px;
                font-size: 12px;
                color: #6366f1;
                display: none;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .target-result.show {
                display: flex;
            }
            
            .close-btn {
                padding: 4px;
                background: none;
                border: none;
                color: #8B8D91;
                cursor: pointer;
                font-size: 16px;
                transition: color 0.2s;
                display: flex;
                align-items: center;
                line-height: 1;
                flex-shrink: 0;
            }
            
            .close-btn:hover {
                color: white !important;
            }
            
            /* Requirements section */
            .requirements-section {
                margin-top: 12px;
                padding: 10px;
                background: #1E2330;
                border-radius: 6px;
                border: 1px solid #2A3041;
                min-width: 0;
                max-width: 100%;
                box-sizing: border-box;
                overflow: hidden;
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                max-height: 300px;
            }
            
            .requirements-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                flex-wrap: wrap;
                flex-shrink: 0;
            }
            
            .requirements-title {
                color: #a78bfa;
                font-weight: bold;
                font-size: 14px;
                white-space: nowrap;
            }
            
            #requirementsList {
                display: flex;
                flex-direction: column;
                gap: 6px;
                overflow-y: auto;
                overflow-x: hidden;
                flex: 1;
                min-height: 0;
            }
            
            .requirement-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px;
                background: #2A3041;
                border-radius: 4px;
                font-size: 11px;
                min-width: 0;
            }
            
            .requirement-icon {
                width: 24px;
                height: 24px;
                border-radius: 3px;
                flex-shrink: 0;
                object-fit: contain;
            }
            
            .requirement-info {
                flex: 1;
                min-width: 0;
                overflow: hidden;
            }
            
            .requirement-name {
                font-weight: bold;
                margin-bottom: 2px;
                color: #C5C6C9;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
            }
            
            .requirement-quantity {
                font-size: 11px;
            }
            
            .requirement-quantity.sufficient {
                color: #5fdd5f;
            }
            
            .requirement-quantity.insufficient {
                color: #ff6b6b;
            }
            
            /* Empty state */
            .empty-state {
                padding: 20px;
                text-align: center;
                color: #8B8D91;
            }
            
            .empty-state small {
                font-size: 11px;
            }
            
            /* Loading state */
            .loading-state {
                margin-top: 12px;
                padding: 16px;
                background: #1E2330;
                border-radius: 6px;
                border: 1px solid #2A3041;
                text-align: center;
            }
            
            .loading-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid #2A3041;
                border-top-color: #ffd700;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                display: inline-block;
                margin-right: 8px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            /* Resize handle */
            #resizeHandle {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 16px;
                height: 16px;
                cursor: nwse-resize;
            }
            
            #resizeHandle svg {
                position: absolute;
                bottom: 2px;
                right: 2px;
            }
            
            /* Column layout */
            .column-layout {
                display: flex;
                gap: 12px;
                height: 100%;
                min-width: 0;
            }
            
            .column {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                min-width: 0;
            }
            
            .column:first-child {
                border-right: 1px solid #1E2330;
            }
            
            /* Mobile specific */
            @media (max-width: 768px) {
                #trackerHeader {
                    cursor: default;
                }
                
                .column-layout {
                    flex-direction: column;
                }
                
                .column:first-child {
                    border-right: none;
                    border-bottom: 1px solid #1E2330;
                }
            }
            
            /* Scrollbar styling */
            #trackerContent::-webkit-scrollbar {
                width: 8px;
            }
            
            #trackerContent::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
            }
            
            #trackerContent::-webkit-scrollbar-thumb {
                background: #4a90e2;
                border-radius: 4px;
            }
            
            #trackerContent::-webkit-scrollbar-thumb:hover {
                background: #357abd;
            }
        `;
        document.head.appendChild(style);
    },
    
    /**
     * Create main UI matching v2 structure
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
        
        const pos = State.ui.position;
        const mobile = this.isMobile();
        
        // Apply positioning
        if (mobile) {
            Object.assign(panel.style, {
                top: State.ui.isExpanded ? '10px' : 'auto',
                bottom: State.ui.isExpanded ? 'auto' : '10px',
                left: '50%',
                right: 'auto',
                transform: 'translateX(-50%)',
                width: State.ui.isExpanded ? 'calc(100vw - 20px)' : '240px',
                maxWidth: State.ui.isExpanded ? '100%' : '240px',
                height: State.ui.isExpanded ? 'auto' : 'auto',
                minHeight: 'auto',
                maxHeight: State.ui.isExpanded ? 'calc(100vh - 20px)' : 'none'
            });
        } else {
            Object.assign(panel.style, {
                top: pos.top !== null ? `${pos.top}px` : 'auto',
                left: pos.left !== null ? `${pos.left}px` : 'auto',
                right: pos.right !== null ? `${pos.right}px` : 'auto',
                width: State.ui.isExpanded ? `${pos.width || 380}px` : '240px',
                height: State.ui.isExpanded ? (pos.height ? `${pos.height}px` : 'auto') : 'auto',
                minHeight: State.ui.isExpanded && !pos.height ? '200px' : 'auto',
                maxHeight: State.ui.isExpanded && !pos.height ? '80vh' : 'none',
                display: State.ui.isOpen ? 'flex' : 'none',
                opacity: State.ui.isOpen ? '1' : '0'
            });
        }
        
        // Create header
        const headerHtml = `
            <div id="trackerHeader" class="${mobile ? 'no-drag' : ''}">
                <h3>XP Tracker</h3>
                <div class="header-buttons">
                    <button id="openOptimizerBtn" title="Open XP Optimizer" style="display: ${State.ui.isExpanded ? 'block' : 'none'};">
                        Optimizer
                    </button>
                    <button id="trackerReset" title="Reset position & size" class="tracker-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                    </button>
                    <span id="trackerToggle" class="tracker-btn">${State.ui.isExpanded ? '−' : '+'}</span>
                    <button id="trackerClose" class="tracker-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 6 6 18"></path>
                            <path d="m6 6 12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Create content area
        const contentHtml = `
            <div id="trackerContent" style="display: ${State.ui.isExpanded ? 'flex' : 'none'};">
                <!-- Content will be dynamically updated -->
            </div>
        `;
        
        // Create resize handle for desktop
        const resizeHtml = !mobile && State.ui.isExpanded ? `
            <div id="resizeHandle">
                <svg style="position: absolute; bottom: 2px; right: 2px;" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 11L1 1M11 6L6 11" stroke="#8B8D91" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </div>
        ` : '';
        
        panel.innerHTML = headerHtml + contentHtml + resizeHtml;
        document.body.appendChild(panel);
        
        // Store element references
        this.elements.panel = panel;
        this.elements.header = document.getElementById('trackerHeader');
        this.elements.content = document.getElementById('trackerContent');
        
        console.log('[UI] Main UI created with v2 styling');
    },
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Header buttons
        document.getElementById('openOptimizerBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('[UI] Opening optimizer');
            if (window.Optimizer) {
                window.Optimizer.start();
            }
        });
        
        document.getElementById('trackerReset')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.resetPanelPosition();
        });
        
        document.getElementById('trackerToggle')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel();
        });
        
        document.getElementById('trackerClose')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closePanel();
        });
        
        // Keyboard shortcut (Alt+X)
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'x') {
                this.toggleOpen();
            }
        });
        
        // Setup drag and resize (desktop only)
        if (!this.isMobile()) {
            this.setupDraggable();
            this.setupResizable();
        }
    },
    
    /**
     * Setup draggable functionality matching v2
     */
    setupDraggable() {
        const header = this.elements.header;
        const panel = this.elements.panel;
        
        let isDragging = false;
        let initialX = 0;
        let initialY = 0;
        let xOffset = 0;
        let yOffset = 0;
        
        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        
        function dragStart(e) {
            if (e.target.closest('#trackerToggle') ||
                e.target.closest('#trackerClose') ||
                e.target.closest('#trackerReset') ||
                e.target.closest('#openOptimizerBtn')) {
                return;
            }
            
            // Convert centered position to fixed position before dragging
            if (panel.style.transform && panel.style.transform !== 'none') {
                const rect = panel.getBoundingClientRect();
                panel.style.left = `${rect.left}px`;
                panel.style.transform = 'none';
            }
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            
            if (e.target === header || e.target.parentElement === header) {
                isDragging = true;
            }
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            
            const currentX = e.clientX - initialX;
            const currentY = e.clientY - initialY;
            
            xOffset = currentX;
            yOffset = currentY;
            
            setTranslate(currentX, currentY, panel);
        }
        
        function dragEnd(e) {
            if (!isDragging) return;
            
            isDragging = false;
            
            const rect = panel.getBoundingClientRect();
            
            const minTop = 0;
            const minLeft = 0;
            const maxTop = window.innerHeight - 60;
            const maxLeft = window.innerWidth - panel.offsetWidth;
            
            const finalTop = Math.max(minTop, Math.min(rect.top, maxTop));
            const finalLeft = Math.max(minLeft, Math.min(rect.left, maxLeft));
            
            panel.style.top = `${finalTop}px`;
            panel.style.left = `${finalLeft}px`;
            panel.style.right = 'auto';
            panel.style.transform = 'none';
            
            State.updatePosition({
                top: finalTop,
                left: finalLeft,
                right: null
            });
            
            xOffset = 0;
            yOffset = 0;
            initialX = 0;
            initialY = 0;
        }
        
        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate(${xPos}px, ${yPos}px)`;
        }
    },
    
    /**
     * Setup resizable functionality matching v2
     */
    setupResizable() {
        const panel = this.elements.panel;
        const resizeHandle = document.getElementById('resizeHandle');
        if (!resizeHandle) return;
        
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        resizeHandle.addEventListener('mousedown', resizeStart);
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', resizeEnd);
        
        function resizeStart(e) {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            
            // Convert centered position to fixed position before resizing
            const rect = panel.getBoundingClientRect();
            if (panel.style.transform && panel.style.transform !== 'none') {
                panel.style.left = `${rect.left}px`;
                panel.style.transform = 'none';
            }
            
            startX = e.clientX;
            startY = e.clientY;
            startWidth = panel.offsetWidth;
            startHeight = panel.offsetHeight;
            
            panel.style.height = `${startHeight}px`;
            panel.style.minHeight = 'auto';
            panel.style.maxHeight = 'none';
            panel.style.transition = 'none';
        }
        
        function resize(e) {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newWidth = Math.max(300, startWidth + deltaX);
            const newHeight = Math.max(200, startHeight + deltaY);
            
            panel.style.width = `${newWidth}px`;
            panel.style.height = `${newHeight}px`;
        }
        
        function resizeEnd(e) {
            if (!isResizing) return;
            
            isResizing = false;
            panel.style.transition = 'opacity 0.3s ease';
            
            State.updatePosition({
                width: panel.offsetWidth,
                height: panel.offsetHeight
            });
            
            UI.debouncedUpdateUI(true);
        }
    },
    
    /**
     * Toggle panel expanded/collapsed
     */
    togglePanel() {
        State.toggleExpanded();
        
        const panel = this.elements.panel;
        const content = this.elements.content;
        const toggle = document.getElementById('trackerToggle');
        const optimizerBtn = document.getElementById('openOptimizerBtn');
        const resizeHandle = document.getElementById('resizeHandle');
        const mobile = this.isMobile();
        
        content.style.display = State.ui.isExpanded ? 'flex' : 'none';
        toggle.innerHTML = State.ui.isExpanded ? '−' : '+';
        
        if (optimizerBtn) {
            optimizerBtn.style.display = State.ui.isExpanded ? 'block' : 'none';
        }
        
        if (resizeHandle) {
            resizeHandle.style.display = State.ui.isExpanded && !mobile ? 'block' : 'none';
        }
        
        const hasCustomHeight = State.ui.position.height !== null && State.ui.position.height !== undefined;
        
        if (mobile) {
            // Mobile styles
            if (State.ui.isExpanded) {
                Object.assign(panel.style, {
                    top: '10px',
                    bottom: 'auto',
                    width: 'calc(100vw - 20px)',
                    maxWidth: '100%',
                    height: 'auto',
                    minHeight: 'auto',
                    maxHeight: 'calc(100vh - 20px)'
                });
            } else {
                Object.assign(panel.style, {
                    top: 'auto',
                    bottom: '10px',
                    width: '240px',
                    maxWidth: '240px',
                    height: 'auto',
                    minHeight: 'auto',
                    maxHeight: 'none'
                });
            }
        } else {
            // Desktop styles
            if (State.ui.isExpanded) {
                panel.style.width = `${State.ui.position.width || 380}px`;
                panel.style.height = hasCustomHeight ? `${State.ui.position.height}px` : 'auto';
                panel.style.minHeight = hasCustomHeight ? 'auto' : '200px';
                panel.style.maxHeight = hasCustomHeight ? 'none' : '80vh';
            } else {
                panel.style.width = '240px';
                panel.style.height = 'auto';
                panel.style.minHeight = 'auto';
                panel.style.maxHeight = 'none';
            }
        }
        
        // Manage real-time updates
        this.manageRealTimeUpdates();
    },
    
    /**
     * Open panel
     */
    openPanel() {
        State.togglePanel(true);
        
        const panel = this.elements.panel;
        if (panel) {
            panel.style.display = 'flex';
            setTimeout(() => {
                panel.style.opacity = '1';
            }, 10);
        }
        
        // Start real-time updates if needed
        this.manageRealTimeUpdates();
        console.log('📊 [UI] Panel opened');
    },
    
    /**
     * Close panel
     */
    closePanel() {
        State.togglePanel(false);
        
        const panel = this.elements.panel;
        if (panel) {
            panel.style.opacity = '0';
            setTimeout(() => {
                panel.style.display = 'none';
            }, 300);
        }
        
        // Stop real-time updates
        this.stopRealTimeUpdates();
        console.log('📊 [UI] Panel closed');
    },
    
    /**
     * Toggle open/close
     */
    toggleOpen() {
        if (State.ui.isOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    },
    
    /**
     * Reset panel position
     */
    resetPanelPosition() {
        const mobile = this.isMobile();
        const panel = this.elements.panel;
        
        if (mobile) {
            if (panel) {
                panel.style.left = '50%';
                panel.style.right = 'auto';
                panel.style.transform = 'translateX(-50%)';
                if (State.ui.isExpanded) {
                    panel.style.top = '10px';
                    panel.style.bottom = 'auto';
                } else {
                    panel.style.top = 'auto';
                    panel.style.bottom = '10px';
                }
            }
            console.log('🔄 [UI] Panel position reset (mobile)');
            return;
        }
        
        // Desktop default position
        const defaultPosition = {
            top: 100,
            left: null,
            right: 10,
            width: 380,
            height: null
        };
        
        State.updatePosition(defaultPosition);
        
        if (panel) {
            Object.assign(panel.style, {
                top: '100px',
                left: 'auto',
                right: '10px',
                width: State.ui.isExpanded ? '380px' : '240px',
                height: 'auto',
                minHeight: State.ui.isExpanded ? '200px' : 'auto',
                maxHeight: State.ui.isExpanded ? '80vh' : 'none',
                transform: 'none'
            });
        }
        
        console.log('🔄 [UI] Panel position reset to default');
    },
    
    /**
     * Manage real-time updates
     */
    manageRealTimeUpdates() {
        if (State.ui.isOpen && State.ui.isExpanded && State.activeTasks.length > 0) {
            this.startRealTimeUpdates();
        } else {
            this.stopRealTimeUpdates();
        }
    },
    
    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        if (this.realTimeInterval) return;
        
        this.realTimeInterval = setInterval(() => {
            this.updateRealTimeProgress();
        }, 100);
        
        console.log('[UI] Real-time updates started');
    },
    
    /**
     * Stop real-time updates
     */
    stopRealTimeUpdates() {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
            this.realTimeInterval = null;
            console.log('[UI] Real-time updates stopped');
        }
    },
    
    /**
     * Update real-time progress
     */
    updateRealTimeProgress() {
        // Update progress bars and time estimates in real-time
        // This will be implemented with actual progress tracking
        const activeCards = document.querySelectorAll('.task-card.active');
        activeCards.forEach(card => {
            const taskKey = card.dataset.taskKey;
            if (!taskKey || !State.realTimeTracking[taskKey]) return;
            
            const tracking = State.realTimeTracking[taskKey];
            const now = Date.now();
            const elapsedTime = (now - tracking.timerStartTime) / 1000;
            
            // Update progress bar, XP, time remaining, etc.
            // This matches the v2 real-time tracking behavior
        });
    },
    
    /**
     * Main UI update function
     */
    updateUI() {
        if (!this.elements.content) return;
        
        const activeTasksHTML = this.renderActiveTasks();
        const previewHTML = this.renderPreviewSection();
        const html = this.buildFinalLayout(activeTasksHTML, previewHTML);
        
        this.elements.content.innerHTML = html;
        
        this.attachInputListeners();
        this.attachClearPreviewListener();
    },
    
    /**
     * Render active tasks section
     */
    renderActiveTasks() {
        if (State.activeTasks.length === 0) return '';
        
        let html = `<div class="task-section">
            <div class="section-title active">🟢 ACTIVE TASK</div>`;
        
        State.activeTasks.forEach(task => {
            const currentXP = State.calculateCurrentXP(task.skillName);
            const currentLevel = State.calculateLevel(currentXP);
            const nextLevel = Math.min(99, currentLevel + 1);
            const currentLevelXP = State.getXPForLevel(currentLevel);
            const nextLevelXP = State.getXPForLevel(nextLevel);
            const xpNeeded = nextLevelXP - currentXP;
            const actionsNeeded = Math.ceil(xpNeeded / task.expPerAction);
            const timeNeeded = actionsNeeded * task.modifiedActionTime;
            const percentage = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
            
            html += this.renderTaskCard(
                task.skillNameDisplay,
                task.itemName,
                {
                    currentLevel,
                    nextLevel,
                    currentXP,
                    xpForNext: nextLevelXP,
                    xpNeeded,
                    actionsNeeded,
                    timeNeeded,
                    percentage
                },
                task.expPerAction,
                task.modifiedActionTime,
                'active',
                task.taskKey
            );
        });
        
        return html + '</div>';
    },
    
    /**
     * Render preview section
     */
    renderPreviewSection() {
        if (!State.previewTask || (Date.now() - State.previewTask.timestamp >= 1800000)) {
            return '';
        }
        
        let html = `<div class="task-section">
            <div class="section-title preview">
                <span>💡 PREVIEW</span>
                <button id="clearPreview" class="tracker-btn" style="
                    padding: 4px 8px;
                    font-size: 11px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18"></path>
                        <path d="m6 6 12 12"></path>
                    </svg>
                    Clear
                </button>
            </div>`;
        
        const skillLower = State.previewTask.skillName?.toLowerCase();
        const currentXP = skillLower ? (State.skills[skillLower]?.currentXP || 0) : 0;
        
        if (currentXP > 0 && State.previewTask.expPerAction > 0) {
            const currentLevel = State.calculateLevel(currentXP);
            const nextLevel = Math.min(99, currentLevel + 1);
            const currentLevelXP = State.getXPForLevel(currentLevel);
            const nextLevelXP = State.getXPForLevel(nextLevel);
            const xpNeeded = nextLevelXP - currentXP;
            const actionsNeeded = Math.ceil(xpNeeded / State.previewTask.expPerAction);
            const timeNeeded = actionsNeeded * State.previewTask.modifiedActionTime;
            const percentage = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
            
            html += this.renderTaskCard(
                State.previewTask.skillNameDisplay || State.previewTask.skillName || "Unknown Skill",
                State.previewTask.itemName || "Preview Task",
                {
                    currentLevel,
                    nextLevel,
                    currentXP,
                    xpForNext: nextLevelXP,
                    xpNeeded,
                    actionsNeeded,
                    timeNeeded,
                    percentage
                },
                State.previewTask.expPerAction,
                State.previewTask.modifiedActionTime,
                'preview'
            );
        } else {
            html += this.renderPreviewPlaceholder();
        }
        
        if (State.previewTask.hasCraftingRequirements) {
            if (State.previewTask.requirementsComplete && State.previewTask.requirements && State.previewTask.requirements.length > 0) {
                html += this.renderRequirements(State.previewTask.requirements, State.previewTask.timesToCraft);
            } else {
                html += this.renderRequirementsLoading();
            }
        }
        
        return html + '</div>';
    },
    
    /**
     * Render task card matching v2 style
     */
    renderTaskCard(skillName, itemName, progress, expPerAction, actionTime, type, taskKey = null) {
        const skillIcon = Constants.SKILL_ICONS[skillName] || '📊';
        const cardId = `${type}_${skillName.replace(/\s/g, '_')}`;
        const savedValue = State.getSavedInputValue(`targetInput_${cardId}`, '');
        
        return `
            <div class="task-card ${type}" data-task-key="${taskKey || ''}">
                <div class="task-title">
                    ${skillIcon} ${this.escapeHtml(skillName)} ${itemName ? `- <span class="item-name">${this.escapeHtml(itemName)}</span>` : ''}
                </div>
                <div class="level-info">
                    Lvl <span class="current-level">${progress.currentLevel}</span> → <span class="next-level">${progress.nextLevel}</span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${Math.min(progress.percentage, 100)}%;"></div>
                    <div class="progress-text">
                        <span class="progress-percentage">${Math.min(progress.percentage, 100).toFixed(1)}%</span>
                    </div>
                </div>
                <div class="xp-display">
                    <span class="current-xp">${this.formatNumber(progress.currentXP)}</span> / <span class="xp-for-next">${this.formatNumber(progress.xpForNext)}</span> XP
                </div>
                <div class="next-level-info">
                    📍 Next lvl (<span class="next-level-indicator">${progress.nextLevel}</span>): <span class="actions-needed">${this.formatNumber(progress.actionsNeeded)}</span> actions • <span class="time-needed">${this.formatTime(progress.timeNeeded)}</span>
                </div>
                <div class="target-level-section">
                    <label>🎯 Target Lvl:</label>
                    <input
                        type="number"
                        id="targetInput_${cardId}"
                        min="${progress.nextLevel}"
                        max="99"
                        placeholder="${progress.nextLevel}"
                        value="${savedValue}"
                        class="target-input"
                    />
                    <button
                        id="targetBtn_${cardId}"
                        data-skill="${skillName}"
                        data-xp="${progress.currentXP}"
                        data-exp-per-action="${expPerAction}"
                        data-action-time="${actionTime}"
                        data-task-key="${taskKey || ''}"
                        data-card-type="${type}"
                        class="calc-btn"
                    >Calc</button>
                </div>
                <div id="targetResult_${cardId}" class="target-result ${State.targetLevelCalculations[cardId] ? 'show' : ''}">
                    ${State.targetLevelCalculations[cardId] ? this.renderTargetResult(cardId, State.targetLevelCalculations[cardId]) : ''}
                </div>
            </div>
        `;
    },
    
    /**
     * Render target result
     */
    renderTargetResult(cardId, calc) {
        const currentXP = State.skills[calc.taskKey?.split('_')[0]?.toLowerCase()]?.currentXP || calc.initialXP;
        const targetLevel = calc.targetLevel;
        const targetXP = State.getXPForLevel(targetLevel);
        const xpNeeded = Math.max(0, targetXP - currentXP);
        const actionsNeeded = Math.ceil(xpNeeded / calc.expPerAction);
        const timeNeeded = actionsNeeded * calc.actionTime;
        
        return `
            <span style="flex: 1; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span>→ Lvl ${targetLevel}:</span>
                <strong><span class="target-actions">${this.formatNumber(actionsNeeded)}</span> actions</strong>
                <span>•</span>
                <strong class="target-time">${this.formatTime(timeNeeded)}</strong>
                <span style="color: #8B8D91;">|</span>
                <span><span class="target-xp-needed">${this.formatNumber(xpNeeded)}</span> XP needed</span>
            </span>
            <button id="closeTarget_${cardId}" class="close-btn">✕</button>
        `;
    },
    
    /**
     * Render preview placeholder
     */
    renderPreviewPlaceholder() {
        const isLevelTooLow = State.previewTask.isLevelTooLow || false;
        const skillLower = State.previewTask.skillName?.toLowerCase();
        const skillData = skillLower ? State.skills[skillLower] : null;
        const hasSkillData = skillData !== null && skillData !== undefined;
        const isZeroXP = hasSkillData && (skillData.currentXP === 0 || !skillData.currentXP);
        
        let message = 'Loading XP data...';
        let icon = '';
        let borderColor = '#ffd700';
        let textColor = '#8B8D91';
        
        if (isLevelTooLow) {
            message = 'Skill level too low to craft this item';
            icon = '⚠️';
            borderColor = '#ff6b6b';
            textColor = '#ff6b6b';
        } else if (isZeroXP) {
            message = 'This skill has 0 XP - start training to track your progress!';
            icon = '💡';
            borderColor = '#ffa500';
            textColor = '#ffa500';
        }
        
        return `
            <div class="task-card preview" style="border-left-color: ${borderColor};">
                <div class="task-title">
                    ${this.getSkillIcon(State.previewTask.skillNameDisplay || State.previewTask.skillName || "Unknown")} 
                    ${this.escapeHtml(State.previewTask.skillNameDisplay || State.previewTask.skillName || "Unknown Skill")} 
                    ${State.previewTask.itemName ? `- <span class="item-name">${this.escapeHtml(State.previewTask.itemName)}</span>` : ''}
                </div>
                <div style="color: ${textColor}; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                    ${icon}
                    <small>${message}</small>
                </div>
            </div>
        `;
    },
    
    /**
     * Render requirements section
     */
    renderRequirements(requirements, timesToCraft = 1) {
        if (!requirements || requirements.length === 0) return '';
        
        let html = `
            <div class="requirements-section">
                <div class="requirements-header">
                    <span class="requirements-title">📦 Craft Requirements</span>
                    <span style="color: #8B8D91; font-size: 11px;">Actions:</span>
                    <input
                        type="number"
                        id="timesToCraftInput"
                        min="1"
                        value="${timesToCraft}"
                        style="
                            width: 60px;
                            padding: 4px 6px;
                            background: #2A3041;
                            border: 1px solid #1E2330;
                            color: #fff;
                            border-radius: 4px;
                            font-size: 11px;
                        "
                        class="times-input"
                    />
                </div>
                <div id="requirementsList">
        `;
        
        requirements.forEach(req => {
            const totalRequired = req.required * timesToCraft;
            const hasEnough = req.available >= totalRequired;
            const statusIcon = hasEnough ? '✅' : '❌';
            
            html += `
                <div class="requirement-item">
                    ${req.img ? `<img class="requirement-icon" src="${req.img}" alt="${req.itemName}">` : ''}
                    <div class="requirement-info">
                        <div class="requirement-name">${req.itemName}</div>
                        <div class="requirement-quantity ${hasEnough ? 'sufficient' : 'insufficient'}">
                            Need: <span class="req-total">${totalRequired}</span> | Have: ${req.available} ${statusIcon}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    },
    
    /**
     * Render requirements loading state
     */
    renderRequirementsLoading() {
        return `
            <div class="loading-state">
                <div style="color: #8B8D91; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <div class="loading-spinner"></div>
                    <span>Loading craft requirements...</span>
                </div>
            </div>
        `;
    },
    
    /**
     * Build final layout
     */
    buildFinalLayout(activeTasksHTML, previewHTML) {
        if (activeTasksHTML === '' && previewHTML === '') {
            return this.renderEmptyState();
        }
        
        if (this.shouldUseColumnLayout() && activeTasksHTML !== '' && previewHTML !== '') {
            return `
                <div class="column-layout">
                    <div class="column">${activeTasksHTML}</div>
                    <div class="column">${previewHTML}</div>
                </div>
            `;
        }
        
        return `${activeTasksHTML}${previewHTML}`;
    },
    
    /**
     * Render empty state
     */
    renderEmptyState() {
        return `<div class="empty-state">
            Waiting for API data...<br>
            <small>Start a task or click on a resource</small>
        </div>`;
    },
    
    /**
     * Check if should use column layout
     */
    shouldUseColumnLayout() {
        const panel = this.elements.panel;
        return panel && panel.offsetWidth >= 600;
    },
    
    /**
     * Attach input listeners
     */
    attachInputListeners() {
        // Target level inputs
        document.querySelectorAll('.target-input').forEach(input => {
            input.addEventListener('focus', () => {
                State.ui.inputLocked = true;
                State.ui.updateLockUntil = Date.now() + 3000;
            });
            
            input.addEventListener('blur', () => {
                State.ui.inputLocked = false;
                State.saveInputValue(input.id, input.value);
            });
        });
        
        // Calc buttons
        document.querySelectorAll('.calc-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const input = btn.previousElementSibling;
                const targetLevel = parseInt(input.value);
                
                if (!targetLevel || targetLevel <= State.calculateLevel(parseFloat(btn.dataset.xp))) {
                    return;
                }
                
                const cardId = btn.id.replace('targetBtn_', '');
                State.targetLevelCalculations[cardId] = {
                    targetLevel,
                    expPerAction: parseFloat(btn.dataset.expPerAction),
                    actionTime: parseFloat(btn.dataset.actionTime),
                    taskKey: btn.dataset.taskKey,
                    initialXP: parseFloat(btn.dataset.xp)
                };
                
                const resultDiv = document.getElementById(`targetResult_${cardId}`);
                if (resultDiv) {
                    resultDiv.innerHTML = this.renderTargetResult(cardId, State.targetLevelCalculations[cardId]);
                    resultDiv.classList.add('show');
                }
                
                State.saveInputValue(`targetInput_${cardId}`, targetLevel);
            });
        });
        
        // Close target results
        document.querySelectorAll('[id^="closeTarget_"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const cardId = btn.id.replace('closeTarget_', '');
                delete State.targetLevelCalculations[cardId];
                
                const resultDiv = document.getElementById(`targetResult_${cardId}`);
                if (resultDiv) {
                    resultDiv.classList.remove('show');
                    resultDiv.innerHTML = '';
                }
                
                const input = document.getElementById(`targetInput_${cardId}`);
                if (input) {
                    input.value = '';
                    State.saveInputValue(`targetInput_${cardId}`, '');
                }
            });
        });
        
        // Times to craft input
        const timesInput = document.getElementById('timesToCraftInput');
        if (timesInput) {
            timesInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) || 1;
                if (State.previewTask) {
                    State.previewTask.timesToCraft = value;
                }
                
                // Update requirement quantities
                document.querySelectorAll('.req-total').forEach((el, index) => {
                    if (State.previewTask && State.previewTask.requirements && State.previewTask.requirements[index]) {
                        el.textContent = State.previewTask.requirements[index].required * value;
                    }
                });
                
                State.saveInputValue('timesToCraftInput', value);
            });
        }
    },
    
    /**
     * Attach clear preview listener
     */
    attachClearPreviewListener() {
        const clearPreviewBtn = document.getElementById('clearPreview');
        if (clearPreviewBtn) {
            clearPreviewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                State.previewTask = null;
                State.targetLevelCalculations = {};
                this.debouncedUpdateUI(true);
                console.log('🔄 [UI] Preview cleared');
            });
        }
    },
    
    /**
     * Get skill icon
     */
    getSkillIcon(skillName) {
        return Constants.SKILL_ICONS[skillName] || '📊';
    },
    
    /**
     * Format number
     */
    formatNumber(num) {
        return num.toLocaleString('en-US');
    },
    
    /**
     * Format time
     */
    formatTime(seconds) {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.round(seconds % 60);
            return `${mins}m ${secs}s`;
        }
        if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.round((seconds % 3600) / 60);
            return `${hours}h ${mins}m`;
        }
        const days = Math.floor(seconds / 86400);
        const hours = Math.round((seconds % 86400) / 3600);
        return `${days}d ${hours}h`;
    },
    
    /**
     * Escape HTML
     */
    escapeHtml(str) {
        if (!str) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        return String(str).replace(/[&<>"'\/]/g, s => map[s]);
    },
    
    /**
     * Cleanup
     */
    cleanup() {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
        }
        
        if (this.updateUITimeout) {
            clearTimeout(this.updateUITimeout);
        }
        
        if (this.targetUpdateTimeout) {
            clearTimeout(this.targetUpdateTimeout);
        }
        
        if (this.elements.panel) {
            this.elements.panel.remove();
        }
        
        console.log('[UI] Cleaned up');
    }
};

// Expose globally for use in other modules and main script
window.UI = UI;
