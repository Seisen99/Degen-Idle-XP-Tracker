#!/usr/bin/env node

/**
 * Build script for Degen Idle XP Tracker v3
 * Combines all modules into a single userscript file
 */

const fs = require('fs');
const path = require('path');

// Read game database
const gameDatabase = JSON.parse(fs.readFileSync(path.join(__dirname, 'game_database.json'), 'utf8'));

// Minify game database (remove whitespace)
const minifiedDB = JSON.stringify(gameDatabase);

// Read all module files
const modules = {
    constants: fs.readFileSync(path.join(__dirname, 'modules/constants.js'), 'utf8'),
    databaseLoader: fs.readFileSync(path.join(__dirname, 'modules/database-loader.js'), 'utf8'),
    efficiencyCalculator: fs.readFileSync(path.join(__dirname, 'modules/efficiency-calculator.js'), 'utf8'),
    itemDataEngine: fs.readFileSync(path.join(__dirname, 'modules/item-data-engine.js'), 'utf8'),
    apiHandler: fs.readFileSync(path.join(__dirname, 'modules/api-handler.js'), 'utf8'),
    stateManager: fs.readFileSync(path.join(__dirname, 'modules/state-manager.js'), 'utf8'),
    uiManager: fs.readFileSync(path.join(__dirname, 'modules/ui-manager.js'), 'utf8'),
    optimizer: fs.readFileSync(path.join(__dirname, 'modules/optimizer.js'), 'utf8')
};

// Remove import/export statements and combine modules
function processModule(moduleCode) {
    return moduleCode
        .replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '')
        .replace(/export\s+default\s+/g, 'const ')
        .replace(/export\s+{[^}]*};?\s*/g, '')
        .replace(/export\s+/g, '');
}

// Build the final userscript
const userscript = `// ==UserScript==
// @name         Degen Idle - XP Tracker v3.0
// @namespace    http://tampermonkey.net/
// @version      3.0.0
// @description  Advanced XP tracker with autonomous calculations using static game database
// @author       DegenIdle Community
// @match        https://degenidle.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=degenidle.com
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=================================');
    console.log('Degen Idle XP Tracker v3.0');
    console.log('Initializing with static database...');
    console.log('=================================');
    
    // ============================================
    // EMBEDDED GAME DATABASE
    // ============================================
    const GAME_DATABASE = ${minifiedDB};
    
    // ============================================
    // MODULE DEFINITIONS
    // ============================================
    
${Object.entries(modules).map(([name, code]) => {
    const processedCode = processModule(code);
    return `    // MODULE: ${name.toUpperCase()}\n${processedCode.split('\n').map(line => '    ' + line).join('\n')}`;
}).join('\n\n')}
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    async function init() {
        console.log('[INIT] Starting XP Tracker v3.0...');
        
        // Initialize game database with embedded data
        GameDB.data = GAME_DATABASE;
        console.log(\`[GameDB] Loaded \${GameDB.data.total_items} items (v\${GameDB.data.version})\`);
        
        // Initialize state
        State.init();
        
        // Setup API interceptors
        APIHandler.setupInterceptors();
        
        // Initialize UI
        UI.init();
        
        // Make Optimizer globally available
        window.Optimizer = Optimizer;
        
        console.log('[INIT] XP Tracker v3.0 ready!');
        console.log('[INIT] Press Alt+X to toggle panel');
    }
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 1000); // Give the game time to load
    }
    
})();`;

// Write the built file
const outputPath = path.join(__dirname, 'degen-idle-xp-tracker-v3.built.user.js');
fs.writeFileSync(outputPath, userscript);

console.log('✅ Build complete!');
console.log(`📦 Output: ${outputPath}`);
console.log(`📏 Size: ${(userscript.length / 1024).toFixed(2)} KB`);
console.log(`📊 Database items: ${gameDatabase.total_items}`);