// ==UserScript==
// @name         Degen Idle - XP Tracker v3.0
// @namespace    http://tampermonkey.net/
// @version      3.0.4
// @description  Advanced XP tracker with autonomous calculations using static game database
// @author       DegenIdle Community
// @match        https://degenidle.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=degenidle.com
// @grant        unsafeWindow
// @run-at       document-start
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@1d6bbf2/v3/modules/constants.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@1d6bbf2/v3/modules/game-database.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@1d6bbf2/v3/modules/database-loader.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@1d6bbf2/v3/modules/efficiency-calculator.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@1d6bbf2/v3/modules/item-data-engine.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@1d6bbf2/v3/modules/api-handler.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@1d6bbf2/v3/modules/state-manager.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@1d6bbf2/v3/modules/ui-manager.js
// @require      https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@1d6bbf2/v3/modules/optimizer.js
// ==/UserScript==

// ============================================
// EARLY API INTERCEPTORS (Installed IMMEDIATELY)
// ============================================
// This ensures NO API calls are missed during module loading

const API_ROOT = "https://api.degenidle.com/api/";
const apiCallBuffer = [];
let handlersReady = false;

// Hook fetch IMMEDIATELY at document-start
const _originalFetch = window.fetch;
window.fetch = async function(input, init) {
    const response = await _originalFetch.apply(this, arguments);
    
    try {
        const url = (typeof input === 'string') ? input : (input?.url || '');
        
        if (url.startsWith(API_ROOT)) {
            const clone = response.clone();
            clone.json()
                .then(json => {
                    if (handlersReady && window.APIHandler) {
                        window.APIHandler.handleResponse(url, json);
                    } else {
                        // Buffer API call for processing after initialization
                        apiCallBuffer.push({ url, json, timestamp: Date.now() });
                        console.log(`[Buffer] Stored API call: ${url.split('/').pop()}`);
                    }
                })
                .catch(() => {});
        }
    } catch(e) {}
    
    return response;
};

// Hook XMLHttpRequest IMMEDIATELY
(function() {
    const XHR = window.XMLHttpRequest;
    function newXHR() {
        const realXHR = new XHR();
        
        realXHR.addEventListener('readystatechange', function() {
            try {
                if (realXHR.readyState === 4 && realXHR.responseURL?.startsWith(API_ROOT)) {
                    try {
                        const json = JSON.parse(realXHR.responseText);
                        if (handlersReady && window.APIHandler) {
                            window.APIHandler.handleResponse(realXHR.responseURL, json);
                        } else {
                            // Buffer API call for processing after initialization
                            apiCallBuffer.push({ 
                                url: realXHR.responseURL, 
                                json, 
                                timestamp: Date.now() 
                            });
                            console.log(`[Buffer] Stored API call: ${realXHR.responseURL.split('/').pop()}`);
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

console.log('[Interceptors] API hooks installed at document-start');

// ============================================
// MAIN INITIALIZATION
// ============================================

(function() {
    'use strict';
    
    console.log('=================================');
    console.log('Degen Idle XP Tracker v3.0.4');
    console.log('Loading modules from CDN...');
    console.log('=================================');
    
    async function init() {
        console.log('[INIT] Starting XP Tracker v3.0.4...');
        
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
        
        // Initialize UI
        UI.init();
        
        // Mark handlers as ready
        handlersReady = true;
        
        // Process buffered API calls
        if (apiCallBuffer.length > 0) {
            console.log(`[Buffer] Processing ${apiCallBuffer.length} buffered API calls`);
            apiCallBuffer.forEach(({ url, json }) => {
                APIHandler.handleResponse(url, json);
            });
            apiCallBuffer.length = 0; // Clear buffer
        } else {
            console.log('[Buffer] No buffered API calls to process');
        }
        
        console.log('[INIT] XP Tracker v3.0.4 ready!');
        console.log('[INIT] Press Alt+X to toggle panel');
        console.log('[INIT] Type "Optimizer.start()" in console to open crafting optimizer');
    }
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init(); // No setTimeout - initialize immediately
    }
    
})();
