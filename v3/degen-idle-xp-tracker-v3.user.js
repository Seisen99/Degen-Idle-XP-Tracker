// ==UserScript==
// @name         Degen Idle - XP Tracker v3.0
// @namespace    http://tampermonkey.net/
// @version      3.0.1
// @description  Advanced XP tracker with autonomous calculations using static game database
// @author       DegenIdle Community
// @match        https://degenidle.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=degenidle.com
// @grant        unsafeWindow
// @run-at       document-idle
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@04be420/v3/modules/constants.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@04be420/v3/modules/game-database.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@04be420/v3/modules/database-loader.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@04be420/v3/modules/efficiency-calculator.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@04be420/v3/modules/item-data-engine.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@04be420/v3/modules/api-handler.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@04be420/v3/modules/state-manager.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@04be420/v3/modules/ui-manager.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@04be420/v3/modules/optimizer.js
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=================================');
    console.log('Degen Idle XP Tracker v3.0.1');
    console.log('Loading modules from CDN...');
    console.log('=================================');
    
    // ============================================
    // INITIALIZATION
    // ============================================
    // All modules including game database are loaded via @require CDN
    // This keeps the userscript Greasyfork-compliant (no minified code)
    
    async function init() {
        console.log('[INIT] Starting XP Tracker v3.0.1...');
        
        // Verify modules are loaded
        if (!GAME_DATABASE_DATA) {
            console.error('[INIT] Game database not loaded from CDN!');
            return;
        }
        
        // Initialize game database with CDN data
        GameDB.data = GAME_DATABASE_DATA;
        console.log(`[GameDB] Loaded ${GameDB.data.total_items} items (v${GameDB.data.version})`);
        
        // Initialize state
        State.init();
        
        // Setup API interceptors
        APIHandler.setupInterceptors();
        
        // Initialize UI
        UI.init();
        
        console.log('[INIT] XP Tracker v3.0.1 ready!');
        console.log('[INIT] Press Alt+X to toggle panel');
        console.log('[INIT] Type "Optimizer.start()" in console to open crafting optimizer');
    }
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 1000); // Give the game time to load
    }
    
})();
