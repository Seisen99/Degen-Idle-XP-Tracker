// ==UserScript==
// @name         Degen Idle - XP Tracker v3.0
// @namespace    http://tampermonkey.net/
// @version      3.0.38
// @description  Advanced XP tracker with autonomous calculations using static game database
// @author       DegenIdle Community
// @match        https://degenidle.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=degenidle.com
// @grant        none
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@a1c5a54/v3/modules/constants.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@a1c5a54/v3/modules/game-database.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@a1c5a54/v3/modules/database-loader.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@a1c5a54/v3/modules/efficiency-calculator.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@a1c5a54/v3/modules/item-data-engine.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@a1c5a54/v3/modules/api-handler.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@a1c5a54/v3/modules/state-manager-enhanced.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@a1c5a54/v3/modules/ui-manager-enhanced.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@a1c5a54/v3/modules/optimizer.js
// ==/UserScript==

// ============================================
// API INTERCEPTORS
// ============================================

const API_ROOT = "https://api.degenidle.com/api/";

// Hook fetch
const _originalFetch = window.fetch;
window.fetch = async function(input, init) {
    const response = await _originalFetch.apply(this, arguments);
    
    try {
        const url = (typeof input === 'string') ? input : (input?.url || '');
        
        if (url.startsWith(API_ROOT)) {
            const clone = response.clone();
            clone.json()
                .then(json => {
                    if (APIHandler) {
                        APIHandler.handleResponse(url, json);
                    }
                })
                .catch(() => {});
        }
    } catch(e) {}
    
    return response;
};

// Hook XMLHttpRequest
(function() {
    const XHR = XMLHttpRequest;
    function newXHR() {
        const realXHR = new XHR();
        
        realXHR.addEventListener('readystatechange', function() {
            try {
                if (realXHR.readyState === 4 && realXHR.responseURL?.startsWith(API_ROOT)) {
                    try {
                        const json = JSON.parse(realXHR.responseText);
                        if (APIHandler) {
                            APIHandler.handleResponse(realXHR.responseURL, json);
                        }
                    } catch(e) {}
                }
            } catch(e) {}
        }, false);
        
        return realXHR;
    }
    
    newXHR.prototype = XHR.prototype;
    window.XMLHttpRequest = newXHR;
})();

    console.log('[Interceptors] API hooks installed');

// ============================================
// MAIN INITIALIZATION
// ============================================

(function() {
    'use strict';
    
    console.log('=================================');
    console.log('Degen Idle XP Tracker v3.0.38');
    console.log('Loading modules from CDN...');
    console.log('=================================');
    
    async function init() {
        console.log('[INIT] Starting XP Tracker v3.0.38...');
        
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
        
        // Initialize UI (includes navbar button injection)
        UI.init();
        
        console.log('[INIT] XP Tracker v3.0.38 ready!');
        console.log('[INIT] Navbar button "XP Tracker" added to game interface');
        console.log('[INIT] Press Alt+X to toggle panel or click navbar button');
        console.log('[INIT] Type "Optimizer.start()" in console to open crafting optimizer');
    }
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
