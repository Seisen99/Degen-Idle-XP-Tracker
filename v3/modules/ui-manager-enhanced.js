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
        console.log('[UI] Initializing enhanced UI manager v4.0.0');
        
        // Create styles
        this.createStyles();
        
        // Create main UI
        this.createUI();
        
        // Setup event listeners
        this.attachEventListeners();
        
        // Setup navbar button with retry mechanism
        this.setupNavbarButton();
        
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
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .task-title svg {
                flex-shrink: 0;
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
            
            /* Tabs styling */
            .tracker-tabs {
                display: flex;
                gap: 4px;
                padding: 8px 12px;
                background: #0B0E14;
                border-bottom: 1px solid #1E2330;
            }
            
            .tracker-tab {
                flex: 1;
                padding: 8px 12px;
                background: #1E2330;
                border: 1px solid #2A3041;
                color: #8B8D91;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
                transition: all 0.2s;
                text-align: center;
            }
            
            .tracker-tab:hover {
                background: #2A3041;
                color: #fff;
            }
            
            .tracker-tab.active {
                background: #4f46e5;
                color: #fff;
                border-color: #6366f1;
            }
            
            /* Tab content */
            #tabContent {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
            }
            
            /* Task info grid (for stats in cards) */
            .task-info {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
                margin-top: 8px;
                padding: 8px;
                background: #0B0E14;
                border-radius: 4px;
            }
            
            .info-item {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            
            .info-label {
                color: #8B8D91;
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .info-value {
                color: #fff;
                font-size: 13px;
                font-weight: bold;
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
            
            /* Skills list in Stats tab */
            .skills-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 12px;
            }
            
            .skill-stat-item {
                background: #0B0E14;
                border-radius: 6px;
                padding: 10px;
                border: 1px solid #2A3041;
            }
            
            .skill-stat-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
            }
            
            .skill-stat-name {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #C5C6C9;
                font-size: 13px;
                font-weight: bold;
            }
            
            .skill-stat-name svg {
                flex-shrink: 0;
            }
            
            .skill-stat-level {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .level-text {
                color: #fff;
                font-size: 13px;
                font-weight: bold;
            }
            
            .level-progress-text {
                color: #6366f1;
                font-size: 11px;
                font-weight: bold;
            }
            
            .skill-progress-bar {
                background: #1E2330;
                border-radius: 4px;
                height: 8px;
                margin-bottom: 6px;
                overflow: hidden;
                position: relative;
            }
            
            .skill-progress-fill {
                background: linear-gradient(90deg, #4f46e5, #6366f1);
                height: 100%;
                transition: width 0.3s ease;
                border-radius: 4px;
            }
            
            .skill-stat-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 11px;
            }
            
            .xp-text {
                color: #8B8D91;
            }
            
            .next-level-text {
                color: #60a5fa;
                font-weight: bold;
            }
            
            /* Number input spin buttons styling */
            .target-input::-webkit-inner-spin-button,
            .target-input::-webkit-outer-spin-button,
            .times-input::-webkit-inner-spin-button,
            .times-input::-webkit-outer-spin-button {
                opacity: 1;
                background: #14172b;
                border-radius: 2px;
                cursor: pointer;
                width: 16px;
                height: 20px;
            }
            
            .target-input::-webkit-inner-spin-button:hover,
            .target-input::-webkit-outer-spin-button:hover,
            .times-input::-webkit-inner-spin-button:hover,
            .times-input::-webkit-outer-spin-button:hover {
                background: #1E2330;
            }
            
            /* ========================================
               STATS TAB - Collapsible Sections
               ======================================== */
            
            .stats-section {
                background: #1E2330;
                border-radius: 6px;
                margin-bottom: 8px;
                border: 1px solid #2A3041;
                overflow: hidden;
            }
            
            .stats-section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 12px;
                cursor: pointer;
                user-select: none;
                transition: background 0.2s;
            }
            
            .stats-section-header:hover {
                background: #252B3B;
            }
            
            .stats-section-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: bold;
                font-size: 13px;
                color: #C5C6C9;
            }
            
            .stats-section-toggle {
                color: #8B8D91;
                transition: transform 0.2s;
                font-size: 12px;
            }
            
            .stats-section-toggle.collapsed {
                transform: rotate(-90deg);
            }
            
            .stats-section-content {
                padding: 0 12px 12px 12px;
                overflow: hidden;
                transition: max-height 0.3s ease, padding 0.3s ease, opacity 0.2s ease;
                max-height: 2000px;
                opacity: 1;
            }
            
            .stats-section-content.collapsed {
                max-height: 0;
                padding-top: 0;
                padding-bottom: 0;
                opacity: 0;
            }
            
            /* Stats grid - responsive */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                gap: 8px;
            }
            
            .stats-grid-3 {
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            }
            
            .stat-item {
                background: #0B0E14;
                border-radius: 4px;
                padding: 8px 10px;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            
            .stat-item.highlight {
                border-left: 2px solid #4f46e5;
            }
            
            .stat-label {
                color: #8B8D91;
                font-size: 10px;
                text-transform: uppercase;
                font-weight: 600;
            }
            
            .stat-value {
                color: #fff;
                font-size: 13px;
                font-weight: bold;
            }
            
            .stat-value.positive {
                color: #5fdd5f;
            }
            
            .stat-value.negative {
                color: #ff6b6b;
            }
            
            .stat-value.zero {
                color: #6B7280;
            }
            
            /* Character info row */
            .char-info-row {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 0;
                border-bottom: 1px solid #2A3041;
            }
            
            .char-info-row:last-child {
                border-bottom: none;
            }
            
            .char-info-label {
                color: #8B8D91;
                font-size: 12px;
                min-width: 80px;
            }
            
            .char-info-value {
                color: #fff;
                font-size: 13px;
                font-weight: 500;
            }
            
            /* Talent effects list */
            .talent-effects-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-top: 8px;
            }
            
            .talent-effect-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 8px;
                background: #0B0E14;
                border-radius: 4px;
                font-size: 12px;
            }
            
            .talent-effect-name {
                color: #C5C6C9;
            }
            
            .talent-effect-value {
                font-weight: bold;
            }
            
            /* Pet skills */
            .pet-skill-item {
                display: flex;
                justify-content: space-between;
                padding: 4px 8px;
                background: #0B0E14;
                border-radius: 4px;
                font-size: 12px;
                margin-top: 4px;
            }
            
            /* Open Full Stats button */
            .open-stats-btn {
                width: 100%;
                padding: 10px 16px;
                background: linear-gradient(90deg, #4f46e5, #6366f1);
                border: none;
                color: #fff;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: bold;
                margin-bottom: 12px;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .open-stats-btn:hover {
                background: linear-gradient(90deg, #6366f1, #818cf8);
                transform: translateY(-1px);
            }
            
            /* ========================================
               STATS MODAL
               ======================================== */
            
            #statsModalOverlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.75);
                z-index: 1000000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            #statsModalOverlay.show {
                display: flex;
            }
            
            #statsModal {
                background: #0B0E14;
                border-radius: 12px;
                border: 1px solid #1E2330;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                width: 90vw;
                max-width: 900px;
                height: 85vh;
                max-height: 750px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #1E2330;
                flex-shrink: 0;
            }
            
            .modal-title {
                font-size: 18px;
                font-weight: bold;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .modal-close-btn {
                background: none;
                border: none;
                color: #8B8D91;
                cursor: pointer;
                padding: 8px;
                border-radius: 4px;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .modal-close-btn:hover {
                background: #1E2330;
                color: #fff;
            }
            
            .modal-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .modal-columns {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
            }
            
            .modal-column {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .modal-section {
                background: #1E2330;
                border-radius: 8px;
                padding: 16px;
                border: 1px solid #2A3041;
            }
            
            .modal-section-title {
                font-size: 14px;
                font-weight: bold;
                color: #C5C6C9;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
                padding-bottom: 8px;
                border-bottom: 1px solid #2A3041;
            }
            
            .modal-stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }
            
            .modal-full-width {
                grid-column: span 2;
            }
            
            /* Modal scrollbar */
            .modal-content::-webkit-scrollbar {
                width: 8px;
            }
            
            .modal-content::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
            }
            
            .modal-content::-webkit-scrollbar-thumb {
                background: #4a90e2;
                border-radius: 4px;
            }
            
            /* Mobile responsive for modal */
            @media (max-width: 768px) {
                #statsModal {
                    width: 95vw;
                    height: 90vh;
                    max-height: none;
                }
                
                .modal-columns {
                    grid-template-columns: 1fr;
                }
                
                .modal-full-width {
                    grid-column: span 1;
                }
                
                .modal-stats-grid {
                    grid-template-columns: 1fr;
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                }
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
        
        // Create content area with tabs
        const contentHtml = `
            <div class="tracker-tabs" style="display: ${State.ui.isExpanded ? 'flex' : 'none'};">
                <button class="tracker-tab active" data-tab="active">Active Tasks</button>
                <button class="tracker-tab" data-tab="preview">Preview</button>
                <button class="tracker-tab" data-tab="stats">Stats</button>
            </div>
            <div id="tabContent" style="display: ${State.ui.isExpanded ? 'block' : 'none'};">
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
        this.elements.content = document.getElementById('tabContent');
        this.elements.tabs = panel.querySelectorAll('.tracker-tab');
        
        console.log('[UI] Main UI created with v2 styling');
    },
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Header buttons
        const optimizerBtn = document.getElementById('openOptimizerBtn');
        if (optimizerBtn) {
            optimizerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('[UI] Optimizer button clicked');
                if (window.Optimizer && typeof window.Optimizer.start === 'function') {
                    console.log('[UI] Starting Optimizer...');
                    window.Optimizer.start();
                } else {
                    console.error('[UI] Optimizer not available or start() is not a function');
                }
            });
            console.log('[UI] Optimizer button event listener attached');
        } else {
            console.warn('[UI] Optimizer button not found in DOM');
        }
        
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
        
        // Tab switching
        document.querySelectorAll('.tracker-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.tracker-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.updateUI();
            });
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
        
        content.style.display = State.ui.isExpanded ? 'block' : 'none';
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
        
        // Force reflow and update UI to recalculate dimensions after expansion
        if (State.ui.isExpanded) {
            setTimeout(() => {
                this.updateUI();
            }, 50);
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
        const activeCards = document.querySelectorAll('.task-card.active');
        activeCards.forEach(card => {
            const taskKey = card.dataset.taskKey;
            if (!taskKey || !State.realTimeTracking[taskKey]) return;
            
            const tracking = State.realTimeTracking[taskKey];
            const skillName = taskKey.split('_')[0];
            const now = Date.now();
            const elapsedTime = (now - tracking.timerStartTime) / 1000;
            
            // Get current XP (from last API call + estimated XP from elapsed time)
            const estimatedActions = Math.floor(elapsedTime / tracking.actionTime);
            const estimatedXPGained = estimatedActions * tracking.expPerAction;
            const currentXP = tracking.lastApiXP + estimatedXPGained;
            
            // Calculate current level
            const currentLevel = State.calculateLevel(currentXP);
            const nextLevel = Math.min(99, currentLevel + 1);
            const currentLevelXP = State.getXPForLevel(currentLevel);
            const nextLevelXP = State.getXPForLevel(nextLevel);
            
            // Calculate progress percentage
            const xpProgress = currentXP - currentLevelXP;
            const xpNeeded = nextLevelXP - currentLevelXP;
            const percentage = (xpProgress / xpNeeded) * 100;
            
            // Calculate remaining actions and time for next level
            const xpRemainingForNext = nextLevelXP - currentXP;
            const actionsNeeded = Math.ceil(xpRemainingForNext / tracking.expPerAction);
            const timeNeeded = actionsNeeded * tracking.actionTime;
            
            // Update progress bar
            const progressBar = card.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = `${Math.min(percentage, 100)}%`;
            }
            
            // Update progress text
            const progressPercentage = card.querySelector('.progress-percentage');
            if (progressPercentage) {
                progressPercentage.textContent = `${Math.min(percentage, 100).toFixed(1)}%`;
            }
            
            // Update current XP display
            const currentXpSpan = card.querySelector('.current-xp');
            if (currentXpSpan) {
                currentXpSpan.textContent = this.formatNumber(Math.floor(currentXP));
            }
            
            // Update XP for next level
            const xpForNextSpan = card.querySelector('.xp-for-next');
            if (xpForNextSpan) {
                xpForNextSpan.textContent = this.formatNumber(nextLevelXP);
            }
            
            // Update current and next level displays
            const currentLevelSpan = card.querySelector('.current-level');
            if (currentLevelSpan) {
                currentLevelSpan.textContent = currentLevel;
            }
            
            const nextLevelSpan = card.querySelector('.next-level');
            if (nextLevelSpan) {
                nextLevelSpan.textContent = nextLevel;
            }
            
            const nextLevelIndicator = card.querySelector('.next-level-indicator');
            if (nextLevelIndicator) {
                nextLevelIndicator.textContent = nextLevel;
            }
            
            // Update actions needed
            const actionsNeededSpan = card.querySelector('.actions-needed');
            if (actionsNeededSpan) {
                actionsNeededSpan.textContent = this.formatNumber(actionsNeeded);
            }
            
            // Update time needed
            const timeNeededSpan = card.querySelector('.time-needed');
            if (timeNeededSpan) {
                timeNeededSpan.textContent = this.formatTime(timeNeeded);
            }
            
            // Update target level calculation if present
            const cardId = `active_${skillName.charAt(0).toUpperCase() + skillName.slice(1)}`;
            if (State.targetLevelCalculations[cardId]) {
                const calc = State.targetLevelCalculations[cardId];
                const targetXP = State.getXPForLevel(calc.targetLevel);
                const xpNeededForTarget = Math.max(0, targetXP - currentXP);
                const actionsForTarget = Math.ceil(xpNeededForTarget / calc.expPerAction);
                const timeForTarget = actionsForTarget * calc.actionTime;
                
                const targetActionsSpan = card.querySelector('.target-actions');
                const targetTimeSpan = card.querySelector('.target-time');
                const targetXpNeededSpan = card.querySelector('.target-xp-needed');
                
                if (targetActionsSpan) {
                    targetActionsSpan.textContent = this.formatNumber(actionsForTarget);
                }
                if (targetTimeSpan) {
                    targetTimeSpan.textContent = this.formatTime(timeForTarget);
                }
                if (targetXpNeededSpan) {
                    targetXpNeededSpan.textContent = this.formatNumber(xpNeededForTarget);
                }
            }
        });
    },
    
    /**
     * Main UI update function
     */
    updateUI() {
        if (!this.elements.content) return;
        
        // Get active tab
        const activeTab = document.querySelector('.tracker-tab.active')?.dataset.tab || 'active';
        
        let html = '';
        
        switch(activeTab) {
            case 'active':
                html = this.renderActiveTasksTab();
                break;
            case 'preview':
                html = this.renderPreviewTab();
                break;
            case 'stats':
                html = this.renderStatsTab();
                break;
            default:
                html = this.renderActiveTasksTab();
        }
        
        this.elements.content.innerHTML = html;
        
        this.attachInputListeners();
        this.attachClearPreviewListener();
    },
    
    /**
     * Render Active Tasks tab
     */
    renderActiveTasksTab() {
        if (State.activeTasks.length === 0) {
            return '<div class="empty-state">No active tasks. Start an activity in the game to track XP.</div>';
        }
        
        let html = '<div class="task-section">';
        
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
     * Render Preview tab
     */
    renderPreviewTab() {
        if (!State.previewTask || (Date.now() - State.previewTask.timestamp >= 1800000)) {
            return '<div class="empty-state">Click on an item in the game to preview it here.</div>';
        }
        
        const task = State.previewTask;
        const skillLower = task.skillName?.toLowerCase();
        const currentXP = skillLower ? (State.skills[skillLower]?.currentXP || 0) : 0;
        const currentLevel = State.calculateLevel(currentXP);
        const nextLevel = Math.min(99, currentLevel + 1);
        const currentLevelXP = State.getXPForLevel(currentLevel);
        const nextLevelXP = State.getXPForLevel(nextLevel);
        const xpNeeded = nextLevelXP - currentXP;
        const actionsNeeded = Math.ceil(xpNeeded / (task.expPerAction || 1));
        const timeNeeded = actionsNeeded * (task.modifiedActionTime || 1);
        const percentage = currentXP > 0 ? ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 : 0;
        
        let html = '<div class="task-section">';
        
        // Always render preview card with all available data
        html += this.renderPreviewCard(
            task.skillNameDisplay || task.skillName || "Unknown Skill",
            task.itemName || "Preview Task",
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
            task.expPerAction || 0,
            task.modifiedActionTime || 0,
            task.skillLevel || 1,
            task.isLevelTooLow || false,
            task.requirements || []
        );
        
        return html + '</div>';
    },
    
    /**
     * Render preview card (special version with Level Required)
     */
    renderPreviewCard(skillName, itemName, progress, expPerAction, actionTime, levelRequired, isLevelTooLow, requirements) {
        const skillIcon = this.getSkillIconSVG(skillName);
        const cardId = `preview_${skillName.replace(/\s/g, '_')}`;
        const savedValue = State.getSavedInputValue(`targetInput_${cardId}`, '');
        
        // Calculate timesToCraft based on target level calculation if available
        let timesToCraft = 1;
        if (State.targetLevelCalculations[cardId]) {
            const calc = State.targetLevelCalculations[cardId];
            const currentXP = progress.currentXP;
            const targetXP = State.getXPForLevel(calc.targetLevel);
            const xpNeeded = Math.max(0, targetXP - currentXP);
            timesToCraft = Math.ceil(xpNeeded / calc.expPerAction);
        }
        
        return `
            <div class="task-card preview">
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
                <div class="task-info">
                    <div class="info-item">
                        <span class="info-label">XP/Action:</span>
                        <span class="info-value">${expPerAction}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Time/Action:</span>
                        <span class="info-value">${actionTime.toFixed(1)}s</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Level Required:</span>
                        <span class="info-value" style="color: ${isLevelTooLow ? '#f44336' : '#4CAF50'}">
                            ${levelRequired}
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">XP/Hour:</span>
                        <span class="info-value">${Math.floor(expPerAction * 3600 / actionTime).toLocaleString()}</span>
                    </div>
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
                        data-card-type="preview"
                        class="calc-btn"
                    >Calc</button>
                </div>
                <div id="targetResult_${cardId}" class="target-result ${State.targetLevelCalculations[cardId] ? 'show' : ''}">
                    ${State.targetLevelCalculations[cardId] ? this.renderTargetResult(cardId, State.targetLevelCalculations[cardId]) : ''}
                </div>
                ${requirements && requirements.length > 0 ? this.renderRequirements(requirements, timesToCraft) : ''}
            </div>
        `;
    },
    
    /**
     * Render Stats tab (v4 - with collapsible sections)
     */
    renderStatsTab() {
        let html = '<div class="task-section">';
        
        // Open Full Stats button
        html += `
            <button id="openStatsModalBtn" class="open-stats-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
                Open Full Stats View
            </button>
        `;
        
        // Section: Character Overview
        html += this.renderCollapsibleSection('character', '👤 Character', this.renderCharacterStats());
        
        // Section: Attributes
        html += this.renderCollapsibleSection('attributes', '⚔️ Attributes', this.renderAttributesStats());
        
        // Section: Combat Stats (Base)
        html += this.renderCollapsibleSection('combatBase', '❤️ Combat Stats', this.renderCombatBaseStats());
        
        // Section: Equipment Bonuses
        html += this.renderCollapsibleSection('combatEquipment', '🛡️ Equipment Bonuses', this.renderEquipmentStats());
        
        // Section: Talents
        html += this.renderCollapsibleSection('talents', '✨ Talents', this.renderTalentStats());
        
        // Section: Pet (only if equipped)
        if (State.equippedPet) {
            html += this.renderCollapsibleSection('pet', '🐾 Pet', this.renderPetStats());
        }
        
        // Section: Player Stats
        html += this.renderCollapsibleSection('playerStats', '📈 Player Stats', this.renderPlayerStats());
        
        // Section: Skills
        html += this.renderCollapsibleSection('skills', '🎯 Skill Levels', this.renderSkillsStats());
        
        return html + '</div>';
    },
    
    /**
     * Render a collapsible section
     */
    renderCollapsibleSection(key, title, content) {
        const isCollapsed = State.isStatsSectionCollapsed(key);
        return `
            <div class="stats-section" data-section="${key}">
                <div class="stats-section-header" data-section-toggle="${key}">
                    <div class="stats-section-title">${title}</div>
                    <div class="stats-section-toggle ${isCollapsed ? 'collapsed' : ''}">▼</div>
                </div>
                <div class="stats-section-content ${isCollapsed ? 'collapsed' : ''}">
                    ${content}
                </div>
            </div>
        `;
    },
    
    /**
     * Render Character Overview stats
     */
    renderCharacterStats() {
        const char = State.characterInfo;
        if (!char) {
            return '<div class="empty-state" style="padding: 8px;">Loading character data...</div>';
        }
        
        return `
            <div class="char-info-row">
                <span class="char-info-label">Name</span>
                <span class="char-info-value">${this.escapeHtml(char.name)}</span>
            </div>
            <div class="char-info-row">
                <span class="char-info-label">Class</span>
                <span class="char-info-value" style="text-transform: capitalize;">${this.escapeHtml(char.class)}</span>
            </div>
            <div class="char-info-row">
                <span class="char-info-label">Subclass</span>
                <span class="char-info-value" style="text-transform: capitalize;">${this.escapeHtml(State.talentProgression?.selectedSubclass || 'None')}</span>
            </div>
            <div class="char-info-row">
                <span class="char-info-label">Location</span>
                <span class="char-info-value">📍 ${this.escapeHtml(char.location)}</span>
            </div>
            <div class="char-info-row">
                <span class="char-info-label">Gold</span>
                <span class="char-info-value" style="color: #ffd700;">💰 ${this.formatNumber(char.gold || 0)}</span>
            </div>
            <div class="char-info-row">
                <span class="char-info-label">Total Level</span>
                <span class="char-info-value" style="color: #6366f1;">${char.total_level || 0}</span>
            </div>
        `;
    },
    
    /**
     * Render Attributes stats
     */
    renderAttributesStats() {
        const attr = State.attributes;
        if (!attr) {
            return '<div class="empty-state" style="padding: 8px;">Loading attributes...</div>';
        }
        
        return `
            <div class="stats-grid stats-grid-3">
                <div class="stat-item highlight">
                    <span class="stat-label" style="color: #ef4444;">Strength</span>
                    <span class="stat-value">${this.formatNumber(attr.strength || 0)}</span>
                </div>
                <div class="stat-item highlight">
                    <span class="stat-label" style="color: #22c55e;">Agility</span>
                    <span class="stat-value">${this.formatNumber(attr.agility || 0)}</span>
                </div>
                <div class="stat-item highlight">
                    <span class="stat-label" style="color: #3b82f6;">Intelligence</span>
                    <span class="stat-value">${this.formatNumber(attr.intelligence || 0)}</span>
                </div>
            </div>
        `;
    },
    
    /**
     * Render Combat Base stats
     */
    renderCombatBaseStats() {
        const cs = State.combatStats;
        if (!cs) {
            return '<div class="empty-state" style="padding: 8px;">Loading combat stats...</div>';
        }
        
        return `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Health</span>
                    <span class="stat-value">${this.formatNumber(cs.current_health || 0)} / ${this.formatNumber(cs.total_max_health || 0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Energy</span>
                    <span class="stat-value">${this.formatNumber(Math.floor(cs.current_energy || 0))} / ${this.formatNumber(Math.floor(cs.total_max_energy || 0))}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Attack Power</span>
                    <span class="stat-value">${cs.attack_power || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Attack Speed</span>
                    <span class="stat-value">${cs.attack_speed || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Defense</span>
                    <span class="stat-value">${cs.defense || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Crit Chance</span>
                    <span class="stat-value">${cs.crit_chance || 0}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Crit Damage</span>
                    <span class="stat-value">${cs.crit_damage || 0}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Base Health</span>
                    <span class="stat-value">${cs.health || 0}</span>
                </div>
            </div>
        `;
    },
    
    /**
     * Render Equipment Bonuses stats
     */
    renderEquipmentStats() {
        const cs = State.combatStats;
        if (!cs) {
            return '<div class="empty-state" style="padding: 8px;">Loading equipment stats...</div>';
        }
        
        const equipStats = [
            { label: 'Attack Power', value: cs.equipment_attack_power, suffix: '' },
            { label: 'Attack Power %', value: cs.equipment_attack_power_percent, suffix: '%' },
            { label: 'Attack Speed', value: cs.equipment_attack_speed, suffix: '%' },
            { label: 'Defense %', value: cs.equipment_defense_percent, suffix: '%' },
            { label: 'Max Health', value: cs.equipment_max_health, suffix: '' },
            { label: 'Max Energy', value: cs.equipment_max_energy, suffix: '' },
            { label: 'Block Chance', value: cs.equipment_block_chance, suffix: '%' },
            { label: 'Dodge', value: cs.equipment_dodge, suffix: '%' },
            { label: 'Perfect Block', value: cs.equipment_perfect_block, suffix: '%' },
            { label: 'Damage Reflect', value: cs.equipment_damage_reflect, suffix: '%' },
            { label: 'Defense Pen.', value: cs.equipment_defense_penetration, suffix: '' },
            { label: 'Resource Eff.', value: cs.equipment_resource_efficiency, suffix: '%' },
            { label: 'Task Efficiency', value: cs.equipment_task_efficiency, suffix: '%' },
            { label: 'Health on Hit', value: cs.equipment_health_on_hit, suffix: '' },
            { label: 'Health on Block', value: cs.equipment_health_on_block, suffix: '' },
            { label: 'Health on Crit', value: cs.equipment_health_on_crit, suffix: '' },
            { label: 'Health on Dodge', value: cs.equipment_health_on_dodge, suffix: '' },
            { label: 'Energy on Hit', value: cs.equipment_energy_on_hit, suffix: '' },
            { label: 'Energy on Block', value: cs.equipment_energy_on_block, suffix: '' },
            { label: 'Energy on Crit', value: cs.equipment_energy_on_crit, suffix: '' },
            { label: 'Energy on Dodge', value: cs.equipment_energy_on_dodge, suffix: '' },
            { label: 'Combat XP', value: cs.equipment_combat_exp, suffix: '%' },
            { label: 'Pet XP', value: cs.equipment_pet_exp, suffix: '%' },
            { label: 'Drop Chance', value: cs.equipment_drop_chance, suffix: '%' },
            { label: 'Gold Find', value: cs.equipment_gold_find, suffix: '%' },
        ];
        
        let html = '<div class="stats-grid">';
        
        equipStats.forEach(stat => {
            const val = stat.value || 0;
            const displayVal = typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(2)) : val;
            const valueClass = val > 0 ? 'positive' : (val < 0 ? 'negative' : 'zero');
            
            html += `
                <div class="stat-item">
                    <span class="stat-label">${stat.label}</span>
                    <span class="stat-value ${valueClass}">${val > 0 ? '+' : ''}${displayVal}${stat.suffix}</span>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    },
    
    /**
     * Render Talent stats
     */
    renderTalentStats() {
        const tp = State.talentProgression;
        if (!tp) {
            return '<div class="empty-state" style="padding: 8px;">Loading talent data...</div>';
        }
        
        let html = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Subclass</span>
                    <span class="stat-value" style="text-transform: capitalize;">${this.escapeHtml(tp.selectedSubclass || 'None')}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Available Points</span>
                    <span class="stat-value">${tp.availableTalentPoints || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Points Spent</span>
                    <span class="stat-value">${tp.totalTalentPointsSpent || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Earned</span>
                    <span class="stat-value">${tp.totalTalentPointsEarned || 0}</span>
                </div>
            </div>
        `;
        
        // Talent effects
        if (tp.talentEffects && Object.keys(tp.talentEffects).length > 0) {
            html += `<div class="talent-effects-list">`;
            
            const effectLabels = {
                'max_energy': 'Max Energy',
                'attack_power': 'Attack Power',
                'attack_speed': 'Attack Speed',
                'health_on_hit': 'Health on Hit',
                'defense_penetration': 'Defense Penetration',
                'resource_efficiency': 'Resource Efficiency',
                'attack_power_high_energy': 'Attack Power (High Energy)',
                'crit_chance': 'Crit Chance',
                'crit_damage': 'Crit Damage',
                'defense': 'Defense',
                'max_health': 'Max Health'
            };
            
            Object.entries(tp.talentEffects).forEach(([key, value]) => {
                const label = effectLabels[key] || key.replace(/_/g, ' ');
                const valueClass = value > 0 ? 'positive' : (value < 0 ? 'negative' : '');
                const displayVal = typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(2)) : value;
                
                html += `
                    <div class="talent-effect-item">
                        <span class="talent-effect-name">${label}</span>
                        <span class="talent-effect-value ${valueClass}">${value > 0 ? '+' : ''}${displayVal}</span>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        return html;
    },
    
    /**
     * Render Pet stats
     */
    renderPetStats() {
        const pet = State.equippedPet;
        if (!pet) {
            return '<div class="empty-state" style="padding: 8px;">No pet equipped</div>';
        }
        
        const rarityColors = {
            'Common': '#9ca3af',
            'Uncommon': '#22c55e',
            'Rare': '#3b82f6',
            'Epic': '#a855f7',
            'Legendary': '#f59e0b'
        };
        
        let html = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Name</span>
                    <span class="stat-value">${this.escapeHtml(pet.name)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Type</span>
                    <span class="stat-value">${this.escapeHtml(pet.pet_type)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Level</span>
                    <span class="stat-value">${pet.level || 1}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Rarity</span>
                    <span class="stat-value" style="color: ${rarityColors[pet.rarity] || '#fff'};">${pet.rarity || 'Common'}</span>
                </div>
            </div>
        `;
        
        // Pet skills
        if (pet.skills && Object.keys(pet.skills).length > 0) {
            Object.entries(pet.skills).forEach(([skillName, value]) => {
                html += `
                    <div class="pet-skill-item">
                        <span class="talent-effect-name">${this.escapeHtml(skillName)}</span>
                        <span class="talent-effect-value positive">+${value}</span>
                    </div>
                `;
            });
        }
        
        return html;
    },
    
    /**
     * Render Player Stats
     */
    renderPlayerStats() {
        const ps = State.activePlayerStats;
        if (!ps) {
            return '<div class="empty-state" style="padding: 8px;">Loading player stats...</div>';
        }
        
        return `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Day Streak</span>
                    <span class="stat-value">${ps.consecutive_days_streak || 0} days</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Monsters Killed</span>
                    <span class="stat-value">${this.formatNumber(ps.monsters_killed || 0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Dungeons Done</span>
                    <span class="stat-value">${this.formatNumber(ps.dungeons_completed || 0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Idle Hours</span>
                    <span class="stat-value">${this.formatNumber(ps.total_idle_hours || 0)}h</span>
                </div>
            </div>
        `;
    },
    
    /**
     * Render Skills stats (existing functionality, refactored)
     */
    renderSkillsStats() {
        const skillNameMap = {
            'mining': 'Mining',
            'woodcutting': 'Woodcutting',
            'tracking': 'Tracking',
            'fishing': 'Fishing',
            'gathering': 'Gathering',
            'herbalism': 'Herbalism',
            'forging': 'Forging',
            'leatherworking': 'Leatherworking',
            'tailoring': 'Tailoring',
            'crafting': 'Crafting',
            'cooking': 'Cooking',
            'alchemy': 'Alchemy',
            'combat': 'Combat',
            'woodcrafting': 'Woodcrafting',
            'dungeoneering': 'Dungeoneering',
            'bloomtide': 'Bloomtide',
            'bossing': 'Bossing',
            'exorcism': 'Exorcism',
            'tinkering': 'Tinkering'
        };
        
        let html = '<div class="skills-list" style="gap: 8px;">';
        let hasSkills = false;
        
        Constants.SKILLS.forEach(skill => {
            const skillData = State.skills[skill];
            if (skillData && skillData.level >= 1 && skillData.currentXP > 0) {
                hasSkills = true;
                const currentXP = skillData.currentXP || 0;
                const currentLevel = skillData.level;
                const nextLevel = Math.min(99, currentLevel + 1);
                const currentLevelXP = State.getXPForLevel(currentLevel);
                const nextLevelXP = State.getXPForLevel(nextLevel);
                const xpProgress = currentXP - currentLevelXP;
                const xpNeeded = nextLevelXP - currentLevelXP;
                const percentage = (xpProgress / xpNeeded) * 100;
                
                const skillNameDisplay = skillNameMap[skill] || skill;
                const skillIcon = this.getSkillIconSVG(skillNameDisplay);
                
                html += `
                    <div class="skill-stat-item">
                        <div class="skill-stat-header">
                            <div class="skill-stat-name">
                                ${skillIcon}
                                <span>${skillNameDisplay}</span>
                            </div>
                            <div class="skill-stat-level">
                                <span class="level-text">Lv ${currentLevel}</span>
                                <span class="level-progress-text">${percentage.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div class="skill-progress-bar">
                            <div class="skill-progress-fill" style="width: ${Math.min(percentage, 100)}%;"></div>
                        </div>
                        <div class="skill-stat-footer">
                            <span class="xp-text">${this.formatNumber(Math.floor(xpProgress))} / ${this.formatNumber(xpNeeded)} XP</span>
                            <span class="next-level-text">→ ${nextLevel}</span>
                        </div>
                    </div>
                `;
            }
        });
        
        if (!hasSkills) {
            html += '<div class="empty-state" style="padding: 8px;">No skills trained yet</div>';
        }
        
        html += '</div>';
        return html;
    },
    
    /**
     * Render active tasks section (legacy)
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
        const skillIcon = this.getSkillIconSVG(skillName);
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
                <div class="task-info">
                    <div class="info-item">
                        <span class="info-label">XP/Action:</span>
                        <span class="info-value">${expPerAction}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Time/Action:</span>
                        <span class="info-value">${actionTime.toFixed(1)}s</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Current XP:</span>
                        <span class="info-value">${Math.floor(progress.currentXP).toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">XP/Hour:</span>
                        <span class="info-value">${Math.floor(expPerAction * 3600 / actionTime).toLocaleString()}</span>
                    </div>
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
                    ${this.getSkillIconSVG(State.previewTask.skillNameDisplay || State.previewTask.skillName || "Unknown")} 
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
        // Stats tab: Open modal button
        const openModalBtn = document.getElementById('openStatsModalBtn');
        if (openModalBtn) {
            openModalBtn.addEventListener('click', () => this.openStatsModal());
        }
        
        // Stats tab: Collapsible section toggles
        document.querySelectorAll('[data-section-toggle]').forEach(header => {
            header.addEventListener('click', () => {
                const sectionKey = header.dataset.sectionToggle;
                State.toggleStatsSection(sectionKey);
                
                // Update UI for this section
                const section = header.closest('.stats-section');
                const content = section.querySelector('.stats-section-content');
                const toggle = section.querySelector('.stats-section-toggle');
                
                if (State.isStatsSectionCollapsed(sectionKey)) {
                    content.classList.add('collapsed');
                    toggle.classList.add('collapsed');
                } else {
                    content.classList.remove('collapsed');
                    toggle.classList.remove('collapsed');
                }
            });
        });
        
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
                
                // Update requirements if this is a preview card with requirements
                if (btn.dataset.cardType === 'preview') {
                    this.debouncedUpdateUI(true);
                }
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
                
                // Update requirements if this is a preview card
                if (cardId.startsWith('preview_')) {
                    this.debouncedUpdateUI(true);
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
     * Get skill icon (SVG)
     */
    getSkillIconSVG(skillName) {
        const iconId = Constants.SKILL_ICONS[skillName];
        if (iconId) {
            return `<svg class="w-5 h-5" width="24" height="24" style="display: inline-block; vertical-align: middle;"><use href="#icon-${iconId}"></use></svg>`;
        }
        return '📊';
    },
    
    /**
     * Get skill icon (fallback for text-only contexts)
     */
    getSkillIcon(skillName) {
        return this.getSkillIconSVG(skillName);
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
     * Inject XP Tracker button into game navbar
     */
    injectNavbarButton() {
        const navbarContainer = document.querySelector('.flex.items-center.space-x-1');
        if (!navbarContainer) {
            console.log('[UI] Navbar container not found, retrying...');
            return false;
        }

        if (document.getElementById('levelTrackerNavBtn')) {
            return true; // Already injected
        }

        const button = document.createElement('div');
        button.id = 'levelTrackerNavBtn';
        button.className = 'bg-[#1E2330] text-[#C5C6C9] px-2 md:px-4 h-10 rounded-lg flex items-center hover:bg-[#252B3B] transition-colors cursor-pointer';
        button.innerHTML = `
            <div class="relative flex items-center gap-2">
                <span class="hidden md:inline font-medium">XP Tracker</span>
                <span class="md:hidden font-medium">XP</span>
            </div>
        `;

        button.addEventListener('click', () => this.toggleOpen());

        // Insert before profile button if found
        const profileButton = navbarContainer.querySelector('.relative');
        if (profileButton && profileButton.parentElement === navbarContainer) {
            navbarContainer.insertBefore(button, profileButton);
        } else {
            navbarContainer.appendChild(button);
        }

        console.log('✅ [UI] Navbar button injected');
        return true;
    },
    
    /**
     * Create and show stats modal
     */
    openStatsModal() {
        // Remove existing modal if any
        this.closeStatsModal();
        
        const overlay = document.createElement('div');
        overlay.id = 'statsModalOverlay';
        overlay.className = 'show';
        
        overlay.innerHTML = `
            <div id="statsModal">
                <div class="modal-header">
                    <div class="modal-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="9" y1="21" x2="9" y2="9"></line>
                        </svg>
                        Full Character Stats
                    </div>
                    <button class="modal-close-btn" id="closeStatsModal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6 6 18"></path>
                            <path d="m6 6 12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="modal-content">
                    ${this.renderStatsModalContent()}
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Close button listener
        document.getElementById('closeStatsModal').addEventListener('click', () => this.closeStatsModal());
        
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeStatsModal();
            }
        });
        
        // ESC key to close
        this._modalEscHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeStatsModal();
            }
        };
        document.addEventListener('keydown', this._modalEscHandler);
        
        State.toggleStatsModal(true);
        console.log('[UI] Stats modal opened');
    },
    
    /**
     * Close stats modal
     */
    closeStatsModal() {
        const overlay = document.getElementById('statsModalOverlay');
        if (overlay) {
            overlay.remove();
        }
        
        if (this._modalEscHandler) {
            document.removeEventListener('keydown', this._modalEscHandler);
            this._modalEscHandler = null;
        }
        
        State.toggleStatsModal(false);
    },
    
    /**
     * Render stats modal content (2-column layout)
     */
    renderStatsModalContent() {
        const char = State.characterInfo;
        const attr = State.attributes;
        const cs = State.combatStats;
        const tp = State.talentProgression;
        const pet = State.equippedPet;
        const ps = State.activePlayerStats;
        
        return `
            <div class="modal-columns">
                <!-- Left Column -->
                <div class="modal-column">
                    <!-- Character -->
                    <div class="modal-section">
                        <div class="modal-section-title">👤 Character</div>
                        ${char ? `
                            <div class="modal-stats-grid">
                                <div class="stat-item"><span class="stat-label">Name</span><span class="stat-value">${this.escapeHtml(char.name)}</span></div>
                                <div class="stat-item"><span class="stat-label">Class</span><span class="stat-value" style="text-transform:capitalize;">${this.escapeHtml(char.class)}</span></div>
                                <div class="stat-item"><span class="stat-label">Subclass</span><span class="stat-value" style="text-transform:capitalize;">${this.escapeHtml(tp?.selectedSubclass || 'None')}</span></div>
                                <div class="stat-item"><span class="stat-label">Location</span><span class="stat-value">${this.escapeHtml(char.location)}</span></div>
                                <div class="stat-item"><span class="stat-label">Gold</span><span class="stat-value" style="color:#ffd700;">${this.formatNumber(char.gold || 0)}</span></div>
                                <div class="stat-item"><span class="stat-label">Total Level</span><span class="stat-value" style="color:#6366f1;">${char.total_level || 0}</span></div>
                            </div>
                        ` : '<div class="empty-state">Loading...</div>'}
                    </div>
                    
                    <!-- Attributes -->
                    <div class="modal-section">
                        <div class="modal-section-title">⚔️ Attributes</div>
                        ${attr ? `
                            <div class="modal-stats-grid">
                                <div class="stat-item highlight"><span class="stat-label" style="color:#ef4444;">Strength</span><span class="stat-value">${this.formatNumber(attr.strength || 0)}</span></div>
                                <div class="stat-item highlight"><span class="stat-label" style="color:#22c55e;">Agility</span><span class="stat-value">${this.formatNumber(attr.agility || 0)}</span></div>
                                <div class="stat-item highlight"><span class="stat-label" style="color:#3b82f6;">Intelligence</span><span class="stat-value">${this.formatNumber(attr.intelligence || 0)}</span></div>
                            </div>
                        ` : '<div class="empty-state">Loading...</div>'}
                    </div>
                    
                    <!-- Combat Stats -->
                    <div class="modal-section">
                        <div class="modal-section-title">❤️ Combat Stats</div>
                        ${cs ? `
                            <div class="modal-stats-grid">
                                <div class="stat-item"><span class="stat-label">Health</span><span class="stat-value">${this.formatNumber(cs.current_health || 0)} / ${this.formatNumber(cs.total_max_health || 0)}</span></div>
                                <div class="stat-item"><span class="stat-label">Energy</span><span class="stat-value">${this.formatNumber(Math.floor(cs.current_energy || 0))} / ${this.formatNumber(Math.floor(cs.total_max_energy || 0))}</span></div>
                                <div class="stat-item"><span class="stat-label">Attack Power</span><span class="stat-value">${cs.attack_power || 0}</span></div>
                                <div class="stat-item"><span class="stat-label">Attack Speed</span><span class="stat-value">${cs.attack_speed || 0}</span></div>
                                <div class="stat-item"><span class="stat-label">Defense</span><span class="stat-value">${cs.defense || 0}</span></div>
                                <div class="stat-item"><span class="stat-label">Crit Chance</span><span class="stat-value">${cs.crit_chance || 0}%</span></div>
                                <div class="stat-item"><span class="stat-label">Crit Damage</span><span class="stat-value">${cs.crit_damage || 0}%</span></div>
                                <div class="stat-item"><span class="stat-label">Base Health</span><span class="stat-value">${cs.health || 0}</span></div>
                                <div class="stat-item"><span class="stat-label">Base Energy</span><span class="stat-value">${cs.energy || 0}</span></div>
                            </div>
                        ` : '<div class="empty-state">Loading...</div>'}
                    </div>
                    
                    <!-- Talents -->
                    <div class="modal-section">
                        <div class="modal-section-title">✨ Talents</div>
                        ${tp ? `
                            <div class="modal-stats-grid">
                                <div class="stat-item"><span class="stat-label">Subclass</span><span class="stat-value" style="text-transform:capitalize;">${this.escapeHtml(tp.selectedSubclass || 'None')}</span></div>
                                <div class="stat-item"><span class="stat-label">Available</span><span class="stat-value">${tp.availableTalentPoints || 0}</span></div>
                                <div class="stat-item"><span class="stat-label">Spent</span><span class="stat-value">${tp.totalTalentPointsSpent || 0}</span></div>
                                <div class="stat-item"><span class="stat-label">Total Earned</span><span class="stat-value">${tp.totalTalentPointsEarned || 0}</span></div>
                            </div>
                            ${tp.talentEffects ? this.renderTalentEffectsForModal(tp.talentEffects) : ''}
                        ` : '<div class="empty-state">Loading...</div>'}
                    </div>
                </div>
                
                <!-- Right Column -->
                <div class="modal-column">
                    <!-- Equipment Bonuses -->
                    <div class="modal-section">
                        <div class="modal-section-title">🛡️ Equipment Bonuses</div>
                        ${cs ? this.renderEquipmentStatsForModal(cs) : '<div class="empty-state">Loading...</div>'}
                    </div>
                    
                    <!-- Pet -->
                    ${pet ? `
                        <div class="modal-section">
                            <div class="modal-section-title">🐾 Pet</div>
                            ${this.renderPetStatsForModal(pet)}
                        </div>
                    ` : ''}
                    
                    <!-- Player Stats -->
                    <div class="modal-section">
                        <div class="modal-section-title">📈 Player Stats</div>
                        ${ps ? `
                            <div class="modal-stats-grid">
                                <div class="stat-item"><span class="stat-label">Day Streak</span><span class="stat-value">${ps.consecutive_days_streak || 0} days</span></div>
                                <div class="stat-item"><span class="stat-label">Monsters Killed</span><span class="stat-value">${this.formatNumber(ps.monsters_killed || 0)}</span></div>
                                <div class="stat-item"><span class="stat-label">Dungeons Done</span><span class="stat-value">${this.formatNumber(ps.dungeons_completed || 0)}</span></div>
                                <div class="stat-item"><span class="stat-label">Idle Hours</span><span class="stat-value">${this.formatNumber(ps.total_idle_hours || 0)}h</span></div>
                            </div>
                        ` : '<div class="empty-state">Loading...</div>'}
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Render talent effects for modal
     */
    renderTalentEffectsForModal(effects) {
        if (!effects || Object.keys(effects).length === 0) return '';
        
        const effectLabels = {
            'max_energy': 'Max Energy',
            'attack_power': 'Attack Power',
            'attack_speed': 'Attack Speed',
            'health_on_hit': 'Health on Hit',
            'defense_penetration': 'Defense Penetration',
            'resource_efficiency': 'Resource Efficiency',
            'attack_power_high_energy': 'Attack Power (High Energy)',
            'crit_chance': 'Crit Chance',
            'crit_damage': 'Crit Damage',
            'defense': 'Defense',
            'max_health': 'Max Health'
        };
        
        let html = '<div style="margin-top: 8px;">';
        
        Object.entries(effects).forEach(([key, value]) => {
            const label = effectLabels[key] || key.replace(/_/g, ' ');
            const valueClass = value > 0 ? 'positive' : (value < 0 ? 'negative' : '');
            const displayVal = typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(2)) : value;
            
            html += `
                <div class="talent-effect-item">
                    <span class="talent-effect-name">${label}</span>
                    <span class="talent-effect-value ${valueClass}">${value > 0 ? '+' : ''}${displayVal}</span>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    },
    
    /**
     * Render equipment stats for modal
     */
    renderEquipmentStatsForModal(cs) {
        const equipStats = [
            { label: 'Attack Power', value: cs.equipment_attack_power, suffix: '' },
            { label: 'Attack Power %', value: cs.equipment_attack_power_percent, suffix: '%' },
            { label: 'Attack Speed', value: cs.equipment_attack_speed, suffix: '%' },
            { label: 'Defense %', value: cs.equipment_defense_percent, suffix: '%' },
            { label: 'Max Health', value: cs.equipment_max_health, suffix: '' },
            { label: 'Max Energy', value: cs.equipment_max_energy, suffix: '' },
            { label: 'Block Chance', value: cs.equipment_block_chance, suffix: '%' },
            { label: 'Dodge', value: cs.equipment_dodge, suffix: '%' },
            { label: 'Perfect Block', value: cs.equipment_perfect_block, suffix: '%' },
            { label: 'Damage Reflect', value: cs.equipment_damage_reflect, suffix: '%' },
            { label: 'Defense Pen.', value: cs.equipment_defense_penetration, suffix: '' },
            { label: 'Resource Eff.', value: cs.equipment_resource_efficiency, suffix: '%' },
            { label: 'Task Efficiency', value: cs.equipment_task_efficiency, suffix: '%' },
            { label: 'Health on Hit', value: cs.equipment_health_on_hit, suffix: '' },
            { label: 'Health on Block', value: cs.equipment_health_on_block, suffix: '' },
            { label: 'Health on Crit', value: cs.equipment_health_on_crit, suffix: '' },
            { label: 'Health on Dodge', value: cs.equipment_health_on_dodge, suffix: '' },
            { label: 'Energy on Hit', value: cs.equipment_energy_on_hit, suffix: '' },
            { label: 'Energy on Block', value: cs.equipment_energy_on_block, suffix: '' },
            { label: 'Energy on Crit', value: cs.equipment_energy_on_crit, suffix: '' },
            { label: 'Energy on Dodge', value: cs.equipment_energy_on_dodge, suffix: '' },
            { label: 'Combat XP', value: cs.equipment_combat_exp, suffix: '%' },
            { label: 'Pet XP', value: cs.equipment_pet_exp, suffix: '%' },
            { label: 'Drop Chance', value: cs.equipment_drop_chance, suffix: '%' },
            { label: 'Gold Find', value: cs.equipment_gold_find, suffix: '%' },
        ];
        
        let html = '<div class="modal-stats-grid">';
        
        equipStats.forEach(stat => {
            const val = stat.value || 0;
            const displayVal = typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(2)) : val;
            const valueClass = val > 0 ? 'positive' : (val < 0 ? 'negative' : 'zero');
            
            html += `
                <div class="stat-item">
                    <span class="stat-label">${stat.label}</span>
                    <span class="stat-value ${valueClass}">${val > 0 ? '+' : ''}${displayVal}${stat.suffix}</span>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    },
    
    /**
     * Render pet stats for modal
     */
    renderPetStatsForModal(pet) {
        const rarityColors = {
            'Common': '#9ca3af',
            'Uncommon': '#22c55e',
            'Rare': '#3b82f6',
            'Epic': '#a855f7',
            'Legendary': '#f59e0b'
        };
        
        let html = `
            <div class="modal-stats-grid">
                <div class="stat-item"><span class="stat-label">Name</span><span class="stat-value">${this.escapeHtml(pet.name)}</span></div>
                <div class="stat-item"><span class="stat-label">Type</span><span class="stat-value">${this.escapeHtml(pet.pet_type)}</span></div>
                <div class="stat-item"><span class="stat-label">Level</span><span class="stat-value">${pet.level || 1}</span></div>
                <div class="stat-item"><span class="stat-label">Rarity</span><span class="stat-value" style="color: ${rarityColors[pet.rarity] || '#fff'};">${pet.rarity || 'Common'}</span></div>
            </div>
        `;
        
        if (pet.skills && Object.keys(pet.skills).length > 0) {
            html += '<div style="margin-top: 8px;">';
            Object.entries(pet.skills).forEach(([skillName, value]) => {
                html += `
                    <div class="pet-skill-item">
                        <span class="talent-effect-name">${this.escapeHtml(skillName)}</span>
                        <span class="talent-effect-value positive">+${value}</span>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        return html;
    },
    
    /**
     * Setup navbar button injection with retry mechanism
     */
    setupNavbarButton() {
        // Initial injection attempts
        let injectionAttempts = 0;
        const maxAttempts = 20;
        const injectionInterval = setInterval(() => {
            injectionAttempts++;
            if (this.injectNavbarButton() || injectionAttempts >= maxAttempts) {
                clearInterval(injectionInterval);
                if (injectionAttempts >= maxAttempts) {
                    console.warn('[UI] Failed to inject navbar button after max attempts');
                } else {
                    console.log(`[UI] Navbar button injected after ${injectionAttempts} attempt(s)`);
                }
            }
        }, 500);

        // Re-inject button on navigation (for SPA)
        setInterval(() => {
            if (!document.getElementById('levelTrackerNavBtn')) {
                console.log('[UI] Navbar button missing, re-injecting...');
                this.injectNavbarButton();
            }
        }, 2000);
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
        
        // Remove navbar button
        const navbarButton = document.getElementById('levelTrackerNavBtn');
        if (navbarButton) {
            navbarButton.remove();
        }
        
        console.log('[UI] Cleaned up');
    }
};

// Expose globally for use in other modules and main script
window.UI = UI;
