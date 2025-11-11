// ==UserScript==
// @name         Degen Idle XP Optimizer
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  Calculate optimal crafting paths with minimum XP overshoot and fastest completion time
// @author       Seisen
// @license      MIT
// @icon         https://degenidle.com/favicon.ico
// @match        https://degenidle.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  const API_ROOT = "https://api.degenidle.com/api/";

  // XP Table (same as main tracker)
  const XP_TABLE = {
    "1": 0, "2": 84, "3": 192, "4": 324, "5": 480, "6": 645, "7": 820, "8": 1005,
    "9": 1200, "10": 1407, "11": 1735, "12": 2082, "13": 2449, "14": 2838, "15": 3249,
    "16": 3684, "17": 4144, "18": 4631, "19": 5146, "20": 5691, "21": 6460, "22": 7281,
    "23": 8160, "24": 9101, "25": 10109, "26": 11191, "27": 12353, "28": 13603, "29": 14949,
    "30": 16400, "31": 18455, "32": 20675, "33": 23076, "34": 25675, "35": 28492, "36": 31549,
    "37": 34870, "38": 38482, "39": 42415, "40": 46702, "41": 52583, "42": 58662, "43": 64933,
    "44": 71390, "45": 78026, "46": 84833, "47": 91802, "48": 98923, "49": 106186, "50": 114398,
    "51": 123502, "52": 132734, "53": 142077, "54": 151515, "55": 161029, "56": 170602, "57": 180216,
    "58": 189852, "59": 199491, "60": 209115, "61": 220417, "62": 232945, "63": 246859, "64": 262341,
    "65": 279598, "66": 298871, "67": 320434, "68": 344603, "69": 371744, "70": 402278, "71": 441971,
    "72": 486789, "73": 537487, "74": 594941, "75": 660170, "76": 734360, "77": 818896, "78": 915396,
    "79": 1025752, "80": 1152182, "81": 1316749, "82": 1492835, "83": 1681248, "84": 1882849,
    "85": 2098562, "86": 2329375, "87": 2576345, "88": 2840603, "89": 3123359, "90": 3425908,
    "91": 3749636, "92": 4269287, "93": 4827911, "94": 5428432, "95": 6073992, "96": 6767969,
    "97": 7513995, "98": 8315973, "99": 9178099
  };

  const SORTED_LEVELS = Object.keys(XP_TABLE).map(Number).sort((a, b) => a - b);

  // Skills that have intermediate crafts (Bar, Leather, Cloth)
  const SKILLS_WITH_INTERMEDIATE_CRAFTS = ['forging', 'leatherworking', 'tailoring'];

  // Patterns for craftable materials by skill
  const CRAFTABLE_MATERIAL_PATTERNS = {
    'forging': /bar$/i,
    'leatherworking': /leather$/i,
    'tailoring': /cloth$/i
  };

  // State
  let wizardState = {
    active: false,
    step: 0,
    targetLevel: null,
    currentSkill: null,
    skills: {},  // Store all skills XP
    finalItem: null,
    materials: [],
    craftingCache: loadCache(),
    waitingForClick: false,
    pendingMaterials: [],
    position: safeLoadPosition()
  };

  function safeLoadPosition() {
    try {
      const stored = localStorage.getItem('degenOptimizerPosition');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('[CraftingOptimizer] Failed to load position:', e);
    }
    return { top: 100, left: null, right: 10, width: 500, height: null };
  }

  function savePosition() {
    try {
      localStorage.setItem('degenOptimizerPosition', JSON.stringify(wizardState.position));
    } catch (e) {
      console.error('[CraftingOptimizer] Failed to save position:', e);
    }
  }

  // === UTILITY FUNCTIONS ===

  function loadCache() {
    try {
      const cached = localStorage.getItem('degenCraftingPathCache');
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      console.error('[CraftingOptimizer] Failed to load cache:', e);
      return {};
    }
  }

  function saveCache() {
    try {
      localStorage.setItem('degenCraftingPathCache', JSON.stringify(wizardState.craftingCache));
    } catch (e) {
      console.error('[CraftingOptimizer] Failed to save cache:', e);
    }
  }

  function clearCache() {
    if (confirm('Are you sure you want to clear the crafting cache? You will need to click on items again to rebuild the cache.')) {
      wizardState.craftingCache = {};
      localStorage.removeItem('degenCraftingPathCache');
      console.log('[CraftingOptimizer] Cache cleared');
      alert('Cache cleared successfully!');
    }
  }

  function getLevelFromXP(xp) {
    let left = 0;
    let right = SORTED_LEVELS.length - 1;
    let result = 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const level = SORTED_LEVELS[mid];

      if (XP_TABLE[level] <= xp) {
        result = level;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return result;
  }

  function getXPForLevel(level) {
    return XP_TABLE[level] || 0;
  }

  function formatNumber(num) {
    return num.toLocaleString('en-US');
  }

  function formatTime(seconds) {
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
  }

  function escapeHtml(str) {
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
  }

  // === API HOOKS ===

  function handleApiResponse(url, json) {
    try {
      // Skills endpoint - get ALL skills XP (always listen, even when inactive)
      if (url.includes('/skills')) {
        Object.keys(json).forEach(skill => {
          wizardState.skills[skill] = json[skill];
        });
        console.log('[CraftingOptimizer] Updated all skills XP:', wizardState.skills);
      }

      // Only handle these if wizard is active and waiting for click
      if (!wizardState.active || !wizardState.waitingForClick) return;

      // Calculate endpoint - item clicked
      if (url.includes('/tasks/calculate')) {
        handleItemClick(json);
      }

      // Requirements endpoint
      if (url.includes('/tasks/requirements/') && !url.includes('/tasks/requirements?')) {
        handleRequirementsClick(json, url);
      }
    } catch (e) {
      console.error('[CraftingOptimizer] Error handling API response:', e);
    }
  }

  function handleItemClick(calcData) {
    if (!calcData) return;

    const itemName = detectCurrentItem();
    const skillName = detectCurrentSkill();

    if (!itemName || !skillName) {
      console.warn('[CraftingOptimizer] Could not detect item or skill');
      return;
    }

    const skillLower = skillName.toLowerCase();
    const cacheKey = `${skillLower}_${itemName}`;

    // Check if data changed
    const cached = wizardState.craftingCache[cacheKey];
    if (cached) {
      const changes = [];
      if (cached.actionTime !== calcData.modifiedActionTime) {
        changes.push(`actionTime: ${cached.actionTime}s → ${calcData.modifiedActionTime}s`);
      }
      if (cached.xp !== calcData.expPerAction) {
        changes.push(`xp: ${cached.xp} → ${calcData.expPerAction}`);
      }
      if (changes.length > 0) {
        console.log(`[CraftingOptimizer] Data changed for ${itemName}:`);
        changes.forEach(change => console.log(`  ${change}`));
      }
    }

    // Always overwrite with fresh data
    wizardState.craftingCache[cacheKey] = {
      itemName: itemName,
      skill: skillLower,
      xp: calcData.expPerAction,
      actionTime: calcData.modifiedActionTime,
      requirements: calcData.requirements || [],
      timestamp: Date.now()
    };

    saveCache();
    console.log(`[CraftingOptimizer] Cached data for ${itemName}:`, wizardState.craftingCache[cacheKey]);

    // Handle based on wizard step
    if (wizardState.step === 2) {
      // Final item clicked
      wizardState.finalItem = wizardState.craftingCache[cacheKey];
      wizardState.currentSkill = skillLower;
      wizardState.waitingForClick = false;

      // Check for missing materials
      checkMissingMaterials();
    } else if (wizardState.step === 3) {
      // Material clicked
      const materialIndex = wizardState.pendingMaterials.findIndex(m => m === itemName);
      if (materialIndex !== -1) {
        wizardState.pendingMaterials.splice(materialIndex, 1);
      }

      if (wizardState.pendingMaterials.length === 0) {
        // All materials collected, calculate path
        wizardState.waitingForClick = false;
        calculateCraftingPath();
      } else {
        // Update UI to show remaining materials
        updateWizardUI();
      }
    }
  }

  function handleRequirementsClick(data, url) {
    // Similar to handleItemClick but for requirements endpoint
    const match = url.match(/\/tasks\/requirements\/([^\/]+)\/([^?]+)/);
    if (!match) return;

    const skillFromUrl = match[1].toLowerCase();
    const itemNameEncoded = match[2];
    const itemName = decodeURIComponent(itemNameEncoded);

    const cacheKey = `${skillFromUrl}_${itemName}`;

    wizardState.craftingCache[cacheKey] = {
      itemName: itemName,
      skill: skillFromUrl,
      xp: 0, // Will be updated when user clicks on the item
      actionTime: 0,
      requirements: data.requirements || [],
      timestamp: Date.now()
    };

    saveCache();
  }

  function detectCurrentSkill() {
    const h1 = document.querySelector('h1.text-4xl.font-bold.text-white');
    if (h1) {
      return h1.textContent.trim();
    }
    return null;
  }

  function detectCurrentItem() {
    const h2 = document.querySelector('h2.text-xl.font-bold.text-white');
    if (h2) {
      return h2.textContent.trim();
    }
    return null;
  }

  // Hook fetch
  const _fetch = window.fetch;
  window.fetch = async function(input, init) {
    const resp = await _fetch.apply(this, arguments);
    try {
      const url = (typeof input === "string") ? input : (input?.url) || "";
      if (url.startsWith(API_ROOT)) {
        const clone = resp.clone();
        clone.json()
          .then(json => handleApiResponse(url, json))
          .catch(() => {});
      }
    } catch(e) {}
    return resp;
  };

  // Hook XHR
  (function() {
    const XHR = window.XMLHttpRequest;
    function newXHR() {
      const real = new XHR();
      real.addEventListener("readystatechange", function() {
        try {
          if (real.readyState === 4 && real.responseURL?.startsWith(API_ROOT)) {
            try {
              const json = JSON.parse(real.responseText);
              handleApiResponse(real.responseURL, json);
            } catch(_) {}
          }
        } catch(e) {}
      }, false);
      return real;
    }
    window.XMLHttpRequest = newXHR;
  })();

  // === WIZARD UI ===

  function createWizardUI() {
    const panel = document.createElement('div');
    panel.id = 'craftingWizardModal';
    
    const pos = wizardState.position;
    const hasCustomHeight = pos.height !== null && pos.height !== undefined;
    
    // Build style object
    const styles = {
      position: 'fixed',
      top: pos.top !== null ? `${pos.top}px` : 'auto',
      left: pos.left !== null ? `${pos.left}px` : 'auto',
      right: pos.right !== null ? `${pos.right}px` : 'auto',
      width: `${pos.width || 500}px`,
      height: hasCustomHeight ? `${pos.height}px` : 'auto',
      minHeight: hasCustomHeight ? 'auto' : '200px',
      maxHeight: hasCustomHeight ? 'none' : '80vh',
      maxWidth: '90vw',
      background: '#0B0E14',
      color: '#e0e0e0',
      fontFamily: 'monospace',
      fontSize: '13px',
      borderRadius: '8px',
      zIndex: '999998',
      border: '1px solid #1E2330',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      resize: 'none'
    };
    
    Object.assign(panel.style, styles);

    panel.innerHTML = `
      <div id="wizardHeader" style="
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
      ">
        <span style="color: white; font-size: 16px; font-weight: bold;">XP Optimizer</span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button id="wizardReset" title="Reset position & size" class="wizard-btn" style="cursor: pointer; background: none; border: none; padding: 0; color: #8B8D91; transition: color 0.2s, opacity 0.2s; display: flex; align-items: center; opacity: 0.7;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
          </button>
          <button id="clearCacheBtn" style="
            cursor: pointer;
            background: #2A3041;
            border: 1px solid #3A4051;
            padding: 6px 12px;
            color: #ffa500;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            transition: all 0.2s;
          " title="Clear crafting cache">
            Clear Cache
          </button>
          <button id="closeWizard" style="
            cursor: pointer;
            background: none;
            border: none;
            padding: 0;
            color: #8B8D91;
            transition: color 0.2s;
            display: flex;
            align-items: center;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>
      </div>
      <div id="wizardContent" style="
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 20px;
        min-width: 0;
      "></div>
      <div id="resizeHandle" style="
        position: absolute;
        bottom: 0;
        right: 0;
        width: 16px;
        height: 16px;
        cursor: nwse-resize;
        display: block;
      ">
        <svg style="position: absolute; bottom: 2px; right: 2px;" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 11L1 1M11 6L6 11" stroke="#8B8D91" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
    `;

    document.body.appendChild(panel);

    document.getElementById('closeWizard').addEventListener('click', closeWizard);
    document.getElementById('clearCacheBtn').addEventListener('click', clearCache);
    document.getElementById('wizardReset').addEventListener('click', function(e) {
      e.stopPropagation();
      resetWizardPosition();
    });
    
    // Make draggable and resizable
    setupDraggable(panel);
    setupResizable(panel);

    updateWizardUI();
  }

  function setupDraggable(panel) {
    const header = document.getElementById('wizardHeader');
    let isDragging = false;
    let initialX = 0;
    let initialY = 0;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      if (e.target.closest('#closeWizard') || 
          e.target.closest('#clearCacheBtn') ||
          e.target.closest('#wizardReset')) {
        return;
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

      // Save position
      wizardState.position = {
        ...wizardState.position,
        top: finalTop,
        left: finalLeft,
        right: null
      };
      savePosition();

      xOffset = 0;
      yOffset = 0;
      initialX = 0;
      initialY = 0;
    }

    function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }
  }

  function setupResizable(panel) {
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

      wizardState.position.width = panel.offsetWidth;
      wizardState.position.height = panel.offsetHeight;
      savePosition();

      updateWizardUI();
    }
  }

  function updateWizardUI() {
    const content = document.getElementById('wizardContent');
    if (!content) return;

    switch (wizardState.step) {
      case 1:
        content.innerHTML = renderStep1();
        document.getElementById('wizardNextBtn').addEventListener('click', handleStep1Next);
        break;
      case 2:
        content.innerHTML = renderStep2();
        break;
      case 3:
        content.innerHTML = renderStep3();
        break;
      case 4:
        content.innerHTML = renderStep4();
        break;
      default:
        content.innerHTML = '<p>Loading...</p>';
    }
  }

  function renderStep1() {
    return `
      <div style="text-align: center;">
        <p style="color: #8B8D91; margin-bottom: 20px;">
          This tool will help you calculate the optimal crafting path to reach your target level,
          including XP from intermediate crafts.
        </p>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: white; font-weight: bold;">
            Enter Target Level (1-99):
          </label>
          <input
            type="number"
            id="targetLevelInput"
            min="1"
            max="99"
            placeholder="e.g., 40"
            style="
              width: 100px;
              padding: 12px;
              background: #1E2330;
              border: 1px solid #2A3041;
              color: white;
              border-radius: 6px;
              font-size: 16px;
              text-align: center;
            "
          />
        </div>
        <button id="wizardNextBtn" style="
          padding: 12px 24px;
          background: #4f46e5;
          border: none;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: background 0.2s;
        " onmouseover="this.style.background='#6366f1'" onmouseout="this.style.background='#4f46e5'">
          Next Step →
        </button>
      </div>
    `;
  }

  function renderStep2() {
    return `
      <div style="text-align: center;">
        <div style="
          background: #1E2330;
          border: 2px dashed #4f46e5;
          border-radius: 8px;
          padding: 30px;
          margin-bottom: 20px;
        ">
          <div style="font-size: 48px; margin-bottom: 12px;">👆</div>
          <p style="color: white; font-size: 16px; font-weight: bold; margin-bottom: 8px;">
            Click on the item you want to craft
          </p>
          <p style="color: #8B8D91; font-size: 14px;">
            Navigate to the skill page and click on your target craft item.<br>
            The optimizer will automatically detect it.
          </p>
        </div>
        <p style="color: #6366f1; font-size: 12px;">
          Target Level: ${wizardState.targetLevel}
        </p>
      </div>
    `;
  }

  function renderStep3() {
    const remaining = wizardState.pendingMaterials.map(m => `<li style="color: #ffd700;">• ${escapeHtml(m)}</li>`).join('');

    return `
      <div style="text-align: center;">
        <div style="
          background: #1E2330;
          border: 2px dashed #ffd700;
          border-radius: 8px;
          padding: 30px;
          margin-bottom: 20px;
        ">
          <div style="font-size: 48px; margin-bottom: 12px;">📦</div>
          <p style="color: white; font-size: 16px; font-weight: bold; margin-bottom: 8px;">
            Click on these materials to load their XP data:
          </p>
          <ul style="list-style: none; padding: 0; text-align: left; display: inline-block; margin: 16px 0;">
            ${remaining}
          </ul>
          <p style="color: #8B8D91; font-size: 14px;">
            Navigate to each material and click on it.<br>
            The optimizer will collect their crafting data.
          </p>
        </div>
        <p style="color: #6366f1; font-size: 12px;">
          Final Item: ${escapeHtml(wizardState.finalItem?.itemName || 'Unknown')}<br>
          Remaining: ${wizardState.pendingMaterials.length} material(s)
        </p>
      </div>
    `;
  }

  function renderStep4() {
    return `
      <div id="craftingPathResults"></div>
    `;
  }

  function handleStep1Next() {
    const input = document.getElementById('targetLevelInput');
    const targetLevel = parseInt(input.value);

    if (isNaN(targetLevel) || targetLevel < 1 || targetLevel > 99) {
      alert('Please enter a valid level between 1 and 99');
      return;
    }

    wizardState.targetLevel = targetLevel;
    wizardState.step = 2;
    wizardState.waitingForClick = true;
    updateWizardUI();
  }

  function checkMissingMaterials() {
    // Check if this skill has intermediate crafts (Bar/Leather/Cloth)
    if (!SKILLS_WITH_INTERMEDIATE_CRAFTS.includes(wizardState.currentSkill)) {
      // No intermediate crafts for this skill, skip to calculation
      console.log(`[CraftingOptimizer] Skill ${wizardState.currentSkill} has no intermediate crafts, skipping to calculation`);
      wizardState.step = 4;
      calculateCraftingPath();
      return;
    }

    if (!wizardState.finalItem || !wizardState.finalItem.requirements) {
      // No materials needed, go straight to calculation
      wizardState.step = 4;
      calculateCraftingPath();
      return;
    }

    const missing = [];
    const pattern = CRAFTABLE_MATERIAL_PATTERNS[wizardState.currentSkill];

    wizardState.finalItem.requirements.forEach(req => {
      // Check if this requirement matches the craftable material pattern
      if (!pattern || !pattern.test(req.itemName)) {
        console.log(`[CraftingOptimizer] Skipping raw material: ${req.itemName}`);
        return; // Skip raw materials (ore, coal, etc.)
      }

      // This is a craftable intermediate material (Bar/Leather/Cloth)
      const cacheKey = `${wizardState.currentSkill}_${req.itemName}`;
      const cached = wizardState.craftingCache[cacheKey];

      if (!cached || cached.xp === 0 || !cached.actionTime) {
        missing.push(req.itemName);
      }
    });

    if (missing.length === 0) {
      // All craftable materials are cached, go to calculation
      wizardState.step = 4;
      calculateCraftingPath();
    } else {
      // Need to collect material data
      wizardState.step = 3;
      wizardState.pendingMaterials = missing;
      wizardState.waitingForClick = true;
      updateWizardUI();
    }
  }

  function calculateCraftingPath() {
    wizardState.step = 4;
    updateWizardUI();

    // Get current XP for the selected skill
    const currentSkillXP = wizardState.skills[wizardState.currentSkill] || 0;
    const currentLevel = getLevelFromXP(currentSkillXP);
    const targetXP = getXPForLevel(wizardState.targetLevel);
    const xpNeeded = targetXP - currentSkillXP;

    if (xpNeeded <= 0) {
      document.getElementById('craftingPathResults').innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <p style="color: #5fdd5f; font-size: 18px; font-weight: bold;">✅ Already at target level!</p>
          <p style="color: #8B8D91;">Current Level: ${currentLevel}</p>
        </div>
      `;
      return;
    }

    // Calculate crafting path
    const path = [];
    let remainingXP = xpNeeded;
    let currentXP = currentSkillXP;

    // Step 1: Calculate material crafts
    const materialCrafts = [];
    if (wizardState.finalItem.requirements && wizardState.finalItem.requirements.length > 0) {
      wizardState.finalItem.requirements.forEach(req => {
        const cacheKey = `${wizardState.currentSkill}_${req.itemName}`;
        const matData = wizardState.craftingCache[cacheKey];

        if (matData && matData.xp > 0) {
          // This material gives XP when crafted
          materialCrafts.push({
            name: req.itemName,
            xpPerCraft: matData.xp,
            actionTime: matData.actionTime,
            requiredPerFinalCraft: req.required
          });
        }
      });
    }

    // Calculate exact number of crafts needed with minimum overshoot
    let finalCraftsNeeded = 0;
    let totalMatCraftsNeeded = 0;

    if (materialCrafts.length > 0 && materialCrafts[0]) {
      const mat = materialCrafts[0]; // Assuming single material type (Bar/Leather/Cloth)
      const matXPPerCraft = mat.xpPerCraft;
      const matPerItem = mat.requiredPerFinalCraft;
      const itemXP = wizardState.finalItem.xp;

      let bestSolution = null;
      let smallestOvershoot = Infinity;
      let fastestTime = Infinity;

      // Calculate max possible items to test
      const maxPossibleItems = Math.ceil(remainingXP / itemXP) + 10;

      // Start from numItems = 1 to ensure we craft at least 1 item
      for (let numItems = 1; numItems <= maxPossibleItems; numItems++) {
        const barsForItems = numItems * matPerItem;
        const xpFromBars = barsForItems * matXPPerCraft;
        const xpFromItems = numItems * itemXP;
        const xpSoFar = xpFromBars + xpFromItems;

        let bars = barsForItems;
        let totalXP = xpSoFar;

        // If not enough XP, complete with extra bars
        if (xpSoFar < remainingXP) {
          const xpMissing = remainingXP - xpSoFar;
          const extraBars = Math.ceil(xpMissing / matXPPerCraft);
          bars = barsForItems + extraBars;
          totalXP = xpSoFar + extraBars * matXPPerCraft;
        }

        const overshoot = totalXP - remainingXP;
        const totalTime = bars * mat.actionTime + numItems * wizardState.finalItem.actionTime;

        // Keep the solution with smallest overshoot, or if equal overshoot then fastest time
        const isBetter =
          overshoot < smallestOvershoot ||
          (overshoot === smallestOvershoot && totalTime < fastestTime);

        if (isBetter) {
          smallestOvershoot = overshoot;
          fastestTime = totalTime;
          bestSolution = { items: numItems, bars: bars };
        }

        // Perfect match with fastest time, no need to continue
        if (overshoot === 0 && totalTime <= fastestTime) break;

        // If we're overshooting by more than one full item cycle, stop
        if (overshoot > itemXP + matPerItem * matXPPerCraft) break;
      }

      if (bestSolution) {
        finalCraftsNeeded = bestSolution.items;
        totalMatCraftsNeeded = bestSolution.bars;
      } else {
        // Fallback (should never happen)
        finalCraftsNeeded = 1;
        totalMatCraftsNeeded = matPerItem;
      }

      console.log(`[CraftingOptimizer] Optimal solution: ${finalCraftsNeeded} items + ${totalMatCraftsNeeded} bars (overshoot: ${smallestOvershoot} XP, time: ${formatTime(fastestTime)})`);
    } else {
      // No intermediate crafts, just final items
      finalCraftsNeeded = Math.ceil(remainingXP / wizardState.finalItem.xp);
    }

    // Build the path
    let stepXP = currentXP;

    // Add material crafting steps
    if (totalMatCraftsNeeded > 0) {
      materialCrafts.forEach(mat => {
        const totalMatXP = totalMatCraftsNeeded * mat.xpPerCraft;
        const totalMatTime = totalMatCraftsNeeded * mat.actionTime;
        const endLevel = getLevelFromXP(stepXP + totalMatXP);

        // Get requirements for this material
        const cacheKey = `${wizardState.currentSkill}_${mat.name}`;
        const matData = wizardState.craftingCache[cacheKey];
        const requirements = [];

        if (matData && matData.requirements) {
          matData.requirements.forEach(req => {
            requirements.push({
              itemName: req.itemName,
              quantity: req.required * totalMatCraftsNeeded
            });
          });
        }

        path.push({
          itemName: mat.name,
          crafts: totalMatCraftsNeeded,
          xpGained: totalMatXP,
          time: totalMatTime,
          startLevel: getLevelFromXP(stepXP),
          endLevel: endLevel,
          requirements: requirements
        });

        stepXP += totalMatXP;
      });
    }

    // Add final item crafting step (if needed)
    if (finalCraftsNeeded > 0) {
      const finalItemXP = finalCraftsNeeded * wizardState.finalItem.xp;
      const finalItemTime = finalCraftsNeeded * wizardState.finalItem.actionTime;
      const finalEndLevel = getLevelFromXP(stepXP + finalItemXP);

      // Get requirements for final item
      const finalRequirements = [];
      if (wizardState.finalItem.requirements) {
        wizardState.finalItem.requirements.forEach(req => {
          finalRequirements.push({
            itemName: req.itemName,
            quantity: req.required * finalCraftsNeeded
          });
        });
      }

      path.push({
        itemName: wizardState.finalItem.itemName,
        crafts: finalCraftsNeeded,
        xpGained: finalItemXP,
        time: finalItemTime,
        startLevel: getLevelFromXP(stepXP),
        endLevel: Math.min(finalEndLevel, wizardState.targetLevel),
        requirements: finalRequirements
      });
    }

    // Render results
    renderCraftingPathResults(path, currentLevel, xpNeeded);
  }

  function calculateTotalMaterials(path) {
    const intermediateCrafts = [];
    const rawMaterials = {};

    path.forEach((step, index) => {
      // If this is not the last step, it's an intermediate craft
      if (index < path.length - 1) {
        intermediateCrafts.push({
          itemName: step.itemName,
          quantity: step.crafts
        });
      }

      // Aggregate all raw materials
      if (step.requirements) {
        step.requirements.forEach(req => {
          // Check if this requirement is an intermediate craft (appears in previous steps)
          const isIntermediate = intermediateCrafts.some(ic => ic.itemName === req.itemName);

          if (!isIntermediate) {
            // This is a raw material
            if (rawMaterials[req.itemName]) {
              rawMaterials[req.itemName] += req.quantity;
            } else {
              rawMaterials[req.itemName] = req.quantity;
            }
          }
        });
      }
    });

    return {
      intermediate: intermediateCrafts,
      raw: Object.entries(rawMaterials).map(([name, qty]) => ({ itemName: name, quantity: qty }))
    };
  }

  function renderCraftingPathResults(path, currentLevel, xpNeeded) {
    const totalTime = path.reduce((sum, step) => sum + step.time, 0);
    const totalCrafts = path.reduce((sum, step) => sum + step.crafts, 0);
    const totalMaterials = calculateTotalMaterials(path);

    let stepsHTML = '';
    path.forEach((step, index) => {
      // Build requirements string
      let requirementsHTML = '';
      if (step.requirements && step.requirements.length > 0) {
        const reqList = step.requirements
          .map(req => `${formatNumber(req.quantity)}x ${escapeHtml(req.itemName)}`)
          .join(', ');
        requirementsHTML = `
          <div style="color: #8B8D91; font-size: 13px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #2A3041;">
            📦 Requires: <strong style="color: #ffa500;">${reqList}</strong>
          </div>
        `;
      }

      stepsHTML += `
        <div style="
          background: #1E2330;
          border-left: 3px solid ${index === path.length - 1 ? '#ffd700' : '#4f46e5'};
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 12px;
        ">
          <div style="color: white; font-weight: bold; font-size: 16px; margin-bottom: 8px;">
            Step ${index + 1}: ${escapeHtml(step.itemName)}
          </div>
          <div style="color: #8B8D91; font-size: 13px; margin-bottom: 4px;">
            • Craft: <strong style="color: #6366f1;">${formatNumber(step.crafts)}x</strong>
          </div>
          <div style="color: #8B8D91; font-size: 13px; margin-bottom: 4px;">
            • XP Gained: <strong style="color: #5fdd5f;">${formatNumber(step.xpGained)} XP</strong>
          </div>
          <div style="color: #8B8D91; font-size: 13px; margin-bottom: 4px;">
            • Time: <strong style="color: #60a5fa;">${formatTime(step.time)}</strong>
          </div>
          <div style="color: #8B8D91; font-size: 13px;">
            • Level: <strong style="color: #ffd700;">${step.startLevel} → ${step.endLevel}</strong>
          </div>
          ${requirementsHTML}
        </div>
      `;
    });

    const currentSkillXP = wizardState.skills[wizardState.currentSkill] || 0;

    const results = `
      <div style="text-align: center; margin-bottom: 24px;">
        <h3 style="color: white; margin-bottom: 12px;">📊 Crafting Path to Level ${wizardState.targetLevel}</h3>
        <div style="color: #8B8D91; font-size: 14px;">
          <p>Current Level: ${currentLevel} (${formatNumber(currentSkillXP)} XP)</p>
          <p>Target Level: ${wizardState.targetLevel} (${formatNumber(getXPForLevel(wizardState.targetLevel))} XP)</p>
          <p style="color: #6366f1; font-weight: bold;">Total XP Needed: ${formatNumber(xpNeeded)} XP</p>
        </div>
      </div>

      <div style="
        border-top: 2px solid #2A3041;
        border-bottom: 2px solid #2A3041;
        padding: 16px 0;
        margin-bottom: 20px;
      ">
        ${stepsHTML}
      </div>

      <div style="
        background: #1E2330;
        border: 2px solid #4f46e5;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
      ">
        <div style="color: white; font-size: 16px; font-weight: bold; margin-bottom: 12px;">
          ⏱️ Total Summary
        </div>
        <div style="color: #8B8D91; font-size: 14px;">
          <p><strong style="color: #60a5fa;">${formatTime(totalTime)}</strong> total crafting time</p>
          <p><strong style="color: #6366f1;">${formatNumber(totalCrafts)}</strong> total crafts</p>
        </div>
      </div>

      ${totalMaterials.intermediate.length > 0 || totalMaterials.raw.length > 0 ? `
        <div style="
          background: #1E2330;
          border: 2px solid #ffa500;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        ">
          <div style="color: white; font-size: 16px; font-weight: bold; margin-bottom: 12px; text-align: center;">
            📦 Total Materials Needed
          </div>

          ${totalMaterials.intermediate.length > 0 ? `
            <div style="margin-bottom: 16px;">
              <div style="color: #6366f1; font-weight: bold; font-size: 14px; margin-bottom: 8px;">
                Intermediate Crafts (will grant XP):
              </div>
              <div style="color: #8B8D91; font-size: 13px; padding-left: 8px;">
                ${totalMaterials.intermediate.map(mat =>
                  `• ${formatNumber(mat.quantity)}x ${escapeHtml(mat.itemName)}`
                ).join('<br>')}
              </div>
            </div>
          ` : ''}

          ${totalMaterials.raw.length > 0 ? `
            <div>
              <div style="color: #5fdd5f; font-weight: bold; font-size: 14px; margin-bottom: 8px;">
                Raw Materials (collect these):
              </div>
              <div style="color: #8B8D91; font-size: 13px; padding-left: 8px;">
                ${totalMaterials.raw.map(mat =>
                  `• ${formatNumber(mat.quantity)}x ${escapeHtml(mat.itemName)}`
                ).join('<br>')}
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <button id="closeOptimizerBtn" style="
        width: 100%;
        padding: 12px;
        background: #4f46e5;
        border: none;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        margin-top: 20px;
        transition: background 0.2s;
      " onmouseover="this.style.background='#6366f1'" onmouseout="this.style.background='#4f46e5'">
        Close Optimizer
      </button>
    `;

    document.getElementById('craftingPathResults').innerHTML = results;
    document.getElementById('closeOptimizerBtn').addEventListener('click', closeWizard);
  }

  function startWizard() {
    wizardState.active = true;
    wizardState.step = 1;
    wizardState.targetLevel = null;
    wizardState.finalItem = null;
    wizardState.materials = [];
    wizardState.waitingForClick = false;
    wizardState.pendingMaterials = [];

    createWizardUI();
  }

  function closeWizard() {
    wizardState.active = false;
    wizardState.waitingForClick = false;
    const modal = document.getElementById('craftingWizardModal');
    if (modal) {
      modal.remove();
    }
  }

  function resetWizardPosition() {
    const defaultPosition = {
      top: 100,
      left: null,
      right: 10,
      width: 500,
      height: null
    };

    wizardState.position = defaultPosition;
    savePosition();

    const panel = document.getElementById('craftingWizardModal');
    if (panel) {
      Object.assign(panel.style, {
        top: '100px',
        left: 'auto',
        right: '10px',
        width: '500px',
        height: 'auto',
        minHeight: '200px',
        maxHeight: '80vh',
        transform: 'none'
      });
    }

    console.log('🔄 [CraftingOptimizer] Panel position reset to default');
  }

  // === NAVBAR BUTTON ===

  function injectNavbarButton() {
    const navbarContainer = document.querySelector('.flex.items-center.space-x-1');
    if (!navbarContainer) {
      return false;
    }

    if (document.getElementById('craftingWizardNavBtn')) {
      return true;
    }

    const button = document.createElement('div');
    button.id = 'craftingWizardNavBtn';
    button.className = 'bg-[#1E2330] text-[#C5C6C9] px-2 md:px-4 h-10 rounded-lg flex items-center hover:bg-[#252B3B] transition-colors cursor-pointer';
    button.innerHTML = `
      <div class="relative flex items-center gap-2">
        <span class="hidden md:inline font-medium">XP Optimizer</span>
        <span class="md:hidden font-medium">XP Opt</span>
      </div>
    `;

    button.addEventListener('click', startWizard);

    const profileButton = navbarContainer.querySelector('.relative');
    if (profileButton && profileButton.parentElement === navbarContainer) {
      navbarContainer.insertBefore(button, profileButton);
    } else {
      navbarContainer.appendChild(button);
    }

    console.log('[CraftingOptimizer] Navbar button injected');
    return true;
  }

  // === INITIALIZATION ===

  function init() {
    console.log('[CraftingOptimizer] v0.2.1 loaded');

    // Add CSS for hover effects
    const style = document.createElement('style');
    style.textContent = `
      .wizard-btn:hover { color: white !important; opacity: 1 !important; }
      #closeWizard:hover { color: white !important; }
      #clearCacheBtn:hover {
        background: #3A4051 !important;
        border-color: #4A5061 !important;
        color: #ffb733 !important;
      }
    `;
    document.head.appendChild(style);

    // Inject navbar button
    let injectionAttempts = 0;
    const maxAttempts = 20;
    const injectionInterval = setInterval(() => {
      injectionAttempts++;
      if (injectNavbarButton() || injectionAttempts >= maxAttempts) {
        clearInterval(injectionInterval);
      }
    }, 500);

    // Re-inject on navigation
    setInterval(() => {
      if (!document.getElementById('craftingWizardNavBtn')) {
        injectNavbarButton();
      }
    }, 2000);
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    init();
  } else {
    window.addEventListener("DOMContentLoaded", init);
  }

})();
