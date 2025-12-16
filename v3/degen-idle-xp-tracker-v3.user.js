// ==UserScript==
// @name         Degen Idle - XP Tracker
// @namespace    http://tampermonkey.net/
// @version      3.2.0
// @description  Advanced XP tracking and crafting optimization for Degen Idle
// @author       Seisen
// @match        https://degenidle.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=degenidle.com
// @grant        none
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@35b8a63e19c2e006dfb0844f0c654615529f8423/v3/modules/constants.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@35b8a63e19c2e006dfb0844f0c654615529f8423/v3/modules/game-database.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@35b8a63e19c2e006dfb0844f0c654615529f8423/v3/modules/database-loader.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@35b8a63e19c2e006dfb0844f0c654615529f8423/v3/modules/item-data-engine.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@35b8a63e19c2e006dfb0844f0c654615529f8423/v3/modules/api-handler.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@35b8a63e19c2e006dfb0844f0c654615529f8423/v3/modules/state-manager-enhanced.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@35b8a63e19c2e006dfb0844f0c654615529f8423/v3/modules/ui-manager-enhanced.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@35b8a63e19c2e006dfb0844f0c654615529f8423/v3/modules/optimizer.js
// ==/UserScript==

// ============================================
// MAIN INITIALIZATION
// ============================================

(function() {
    'use strict';

    console.log('═══════════════════════════════════════════════════════');
    console.log('Degen Idle XP Tracker v3.2.0');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Loading modules from CDN...');
    console.log('═══════════════════════════════════════════════════════');
    
    async function init() {
        console.log('[INIT] Starting XP Tracker v3.2.0...');

        // Verify modules are loaded
        if (!GAME_DATABASE_DATA) {
            console.error('[INIT] Game database not loaded from CDN!');
            return;
        }

        // Initialize game database with CDN data
        GameDB.data = GAME_DATABASE_DATA;
        console.log(`[GameDB] Loaded ${GameDB.data.total_items} items (v${GameDB.data.version})`);

        // Initialize API handler (sets up token capture + polling)
        APIHandler.init();

        // Initialize state
        State.init();

        // Initialize UI (includes navbar button injection)
        UI.init();

        console.log('[INIT] XP Tracker v3.2.0 ready!');
        console.log('[INIT] Navbar button "XP Tracker" added to game interface');
        console.log('[INIT] Waiting for token capture to start data polling...');
        console.log('[INIT] Press Alt+X to toggle panel or click navbar button');
    }

    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
