// ==UserScript==
// @name         Degen Idle XP Tracker & Optimizer
// @namespace    http://tampermonkey.net/
// @version      1.3.0
// @description  Track XP progression and optimize crafting paths
// @author       Seisen
// @license      MIT
// @icon         https://degenidle.com/favicon.ico
// @match        https://degenidle.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  const API_ROOT = "https://api.degenidle.com/api/";

  // Skills list - centralized constant
  const SKILLS = [
    'mining', 'woodcutting', 'tracking', 'fishing', 'gathering',
    'herbalism', 'forging', 'leatherworking', 'tailoring', 'crafting',
    'cooking', 'alchemy', 'combat', 'woodcrafting', 'dungeoneering',
    'bloomtide', 'bossing', 'exorcism'
  ];

  const GATHERING_SKILLS = ['mining', 'woodcutting', 'tracking', 'fishing', 'gathering', 'herbalism'];

  const SKILL_ICONS = {
    'Mining': '⛏️',
    'Woodcutting': '🌲',
    'Fishing': '🎣',
    'Gathering': '🌿',
    'Herbalism': '🌺',
    'Tracking': '👣',
    'Forging': '🔨',
    'Leatherworking': '🦌',
    'Tailoring': '🧵',
    'Crafting': '⚒️',
    'Cooking': '🍳',
    'Alchemy': '⚗️',
    'Combat': '⚔️',
    'Woodcrafting': '🪵',
    'Dungeoneering': '🏰',
    'Bloomtide': '🌸',
    'Bossing': '👹',
    'Exorcism': '👻'
  };

  // Skills that have intermediate crafts (Bar, Leather, Cloth)
  const SKILLS_WITH_INTERMEDIATE_CRAFTS = ['forging', 'leatherworking', 'tailoring'];

  // Patterns for craftable materials by skill
  const CRAFTABLE_MATERIAL_PATTERNS = {
    'forging': /bar$/i,
    'leatherworking': /leather$/i,
    'tailoring': /cloth$/i
  };

  // XP Table embedded
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

  // Pre-computed sorted levels for binary search
  const SORTED_LEVELS = Object.keys(XP_TABLE).map(Number).sort((a, b) => a - b);

  // Unified state management
  let state = {
    // Tracker state
    characterId: null,
    skills: {},
    activeTasks: [],
    previewTask: null,
    currentPageSkill: null,
    isOpen: safeLoadFromStorage('degenLevelTracker_open', 'false') === 'true',
    isExpanded: safeLoadFromStorage('degenLevelTracker_expanded', 'true') !== 'false',
    targetLevelCalculations: {},
    realTimeTracking: {},
    position: safeLoadFromStorage('degenLevelTracker_position', {"top": 100, "left": null, "right": 10, "width": 380}),
    savedInputValues: {},
    updateLockUntil: 0,
    requirementsCache: {},
    realTimeInterval: null,
    
    // Optimizer state
    optimizer: {
      active: false,
      step: 0,
      targetLevel: null,
      currentSkill: null,
      finalItem: null,
      materials: [],
      craftingCache: loadOptimizerCache(),
      waitingForClick: false,
      pendingMaterials: [],
      position: safeLoadOptimizerPosition()
    }
  };

  // === SHARED UTILITY FUNCTIONS ===

  // Mobile detection
  function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  // Debounce function for updateUI
  let updateUITimeout = null;
  function debouncedUpdateUI(immediate = false) {
    if (immediate) {
      clearTimeout(updateUITimeout);
      updateUI();
      return;
    }

    clearTimeout(updateUITimeout);
    updateUITimeout = setTimeout(() => {
      updateUI();
    }, 150);
  }

  // HTML escaping for security
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

  // Safe localStorage loading with validation
  function safeLoadFromStorage(key, defaultValue) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;

      const parsed = JSON.parse(stored);

      // Basic type validation
      if (typeof parsed !== typeof defaultValue) {
        return defaultValue;
      }

      return parsed;
    } catch (e) {
      console.warn(`[XP Tracker & Optimizer] Failed to load ${key} from storage:`, e);
      return defaultValue;
    }
  }

  // === SHARED LEVEL CALCULATION FUNCTIONS ===

  // Optimized binary search for level calculation
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

  function calculateProgress(currentXP, expPerAction, actionTime) {
    const currentLevel = getLevelFromXP(currentXP);
    const nextLevel = Math.min(currentLevel + 1, 99);
    const xpForNext = getXPForLevel(nextLevel);
    const xpForCurrent = getXPForLevel(currentLevel);
    const xpNeeded = xpForNext - currentXP;
    const actionsNeeded = Math.ceil(xpNeeded / expPerAction);
    const timeNeeded = actionsNeeded * actionTime;

    return {
      currentLevel,
      nextLevel,
      currentXP,
      xpForNext,
      xpNeeded,
      actionsNeeded,
      timeNeeded,
      percentage: ((currentXP - xpForCurrent) / (xpForNext - xpForCurrent) * 100)
    };
  }

  function calculateToTargetLevel(currentXP, targetLevel, expPerAction, actionTime) {
    const xpForTarget = getXPForLevel(targetLevel);
    const xpNeeded = Math.max(0, xpForTarget - currentXP);
    const actionsNeeded = Math.ceil(xpNeeded / expPerAction);
    const timeNeeded = actionsNeeded * actionTime;

    return {
      targetLevel,
      xpForTarget,
      xpNeeded,
      actionsNeeded,
      timeNeeded
    };
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

  function formatNumber(num) {
    return num.toLocaleString('en-US');
  }

  // === DETECT CURRENT SKILL/ITEM FROM PAGE ===

  function detectCurrentSkill() {
    const h1 = document.querySelector('h1.text-4xl.font-bold.text-white');
    if (h1) {
      const skillName = h1.textContent.trim();
      const skillLower = skillName.toLowerCase();

      if (SKILLS.includes(skillLower)) {
        state.currentPageSkill = skillLower;
        return skillName;
      }
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

  // === OPTIMIZER SPECIFIC FUNCTIONS ===

  function safeLoadOptimizerPosition() {
    try {
      const stored = localStorage.getItem('degenOptimizerPosition');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('[Optimizer] Failed to load position:', e);
    }
    return { top: 100, left: 10, right: null, width: 500, height: null };
  }

  function saveOptimizerPosition() {
    try {
      localStorage.setItem('degenOptimizerPosition', JSON.stringify(state.optimizer.position));
    } catch (e) {
      console.error('[Optimizer] Failed to save position:', e);
    }
  }

  function loadOptimizerCache() {
    try {
      const cached = localStorage.getItem('degenCraftingPathCache');
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      console.error('[Optimizer] Failed to load cache:', e);
      return {};
    }
  }

  function saveOptimizerCache() {
    try {
      localStorage.setItem('degenCraftingPathCache', JSON.stringify(state.optimizer.craftingCache));
    } catch (e) {
      console.error('[Optimizer] Failed to save cache:', e);
    }
  }

  function clearOptimizerCache() {
    if (confirm('Are you sure you want to clear the crafting cache? You will need to click on items again to rebuild the cache.')) {
      state.optimizer.craftingCache = {};
      localStorage.removeItem('degenCraftingPathCache');
      console.log('[Optimizer] Cache cleared');
      alert('Cache cleared successfully!');
    }
  }

  // === API HOOKS ===

  function handleApiResponse(url, json) {
    try {
      // Extract character ID ONLY from own character endpoints
      const charIdMatch = url.match(/\/([a-f0-9-]{36})\//);
      if (charIdMatch) {
        const isPersonalEndpoint = url.includes('/skills') ||
                                   url.includes('/tasks/active/') ||
                                   url.includes('/batch/periodic-status/');

        if (isPersonalEndpoint) {
          const newCharId = charIdMatch[1];

          // Detect character change - clean up old character data
          if (state.characterId && state.characterId !== newCharId) {
            console.log(`[Tracker] Character changed: ${state.characterId} → ${newCharId}`);

            // Reset character-specific data in one operation
            Object.assign(state, {
              characterId: newCharId,
              activeTasks: [],
              realTimeTracking: {},
              targetLevelCalculations: {},
              previewTask: null,
              savedInputValues: {}
            });

            console.log('[Tracker] Character data reset');
          } else if (!state.characterId) {
            state.characterId = newCharId;
          }
        }
      }

      // Skills endpoint - update ALL skills XP (shared between tracker and optimizer)
      if (url.includes('/skills')) {
        updateSkills(json);
      }

      // Active tasks (Tracker)
      if (url.includes('/tasks/active/') || url.includes('/batch/periodic-status/')) {
        if (url.includes('/batch/periodic-status/')) {
          if (json.data?.activeTasks) {
            updateActiveTasks(json.data.activeTasks);
          }
        } else if (Array.isArray(json)) {
          updateActiveTasks(json);
        }
      }

      // Calculate endpoint (both Tracker preview and Optimizer)
      if (url.includes('/tasks/calculate')) {
        updatePreviewTask(json);
        
        // Handle optimizer if active
        if (state.optimizer.active && state.optimizer.waitingForClick) {
          handleOptimizerItemClick(json);
        }
      }

      // Requirements endpoint
      if (url.includes('/tasks/requirements/') && !url.includes('/tasks/requirements?')) {
        updatePreviewRequirements(json, url);
        
        // Handle optimizer if active
        if (state.optimizer.active && state.optimizer.waitingForClick) {
          handleOptimizerRequirementsClick(json, url);
        }
      }
    } catch (e) {
      console.error('[API] Error handling response:', e);
    }
  }

  function updateSkills(skillData) {
    if (!skillData) return;

    SKILLS.forEach(skill => {
      if (skillData[skill] !== undefined) {
        if (!state.skills[skill]) state.skills[skill] = {};
        state.skills[skill].currentXP = skillData[skill];
      }
    });

    console.log('[Tracker] Updated all skills XP:', state.skills);
    debouncedUpdateUI();
  }

  function updateActiveTasks(tasks) {
    if (!Array.isArray(tasks)) return;

    const now = Date.now();
    state.activeTasks = tasks.map(task => {
      const taskKey = `${task.skill_name}_${task.item_name}`;
      const currentXP = state.skills[task.skill_name.toLowerCase()]?.currentXP || 0;

      // Initialize or update real-time tracking
      if (!state.realTimeTracking[taskKey]) {
        const progress = calculateProgress(currentXP, task.exp_per_action, task.action_time);

        state.realTimeTracking[taskKey] = {
          startTime: now,
          baseXP: currentXP,
          lastApiXP: currentXP,
          lastApiTime: now,
          actionTime: task.action_time,
          initialTimeRemaining: progress.timeNeeded,
          initialActionsRemaining: progress.actionsNeeded,
          initialXP: currentXP,
          timerStartTime: now
        };
      } else {
        const tracking = state.realTimeTracking[taskKey];
        const xpGainedSinceLastApi = currentXP - tracking.lastApiXP;

        if (xpGainedSinceLastApi > 0) {
          const progress = calculateProgress(currentXP, task.exp_per_action, task.action_time);

          tracking.lastApiXP = currentXP;
          tracking.lastApiTime = now;
          tracking.baseXP = currentXP;
          tracking.startTime = now;
          tracking.initialTimeRemaining = progress.timeNeeded;
          tracking.initialActionsRemaining = progress.actionsNeeded;
          tracking.initialXP = currentXP;
          tracking.timerStartTime = now;
        }

        tracking.actionTime = task.action_time;
      }

      return {
        skillName: task.skill_name,
        itemName: task.item_name,
        expPerAction: task.exp_per_action,
        actionTime: task.action_time,
        expEarned: task.exp_earned,
        taskKey: taskKey
      };
    });

    // Start or stop real-time updates based on active tasks
    manageRealTimeUpdates();
    debouncedUpdateUI();
  }

  function updatePreviewTask(calcData) {
    if (!calcData) return;

    const currentSkill = detectCurrentSkill();
    const skillName = state.currentPageSkill || state.previewTask?.skillName || null;
    const skillNameDisplay = currentSkill || state.previewTask?.skillNameDisplay || null;

    const hasNewRequirements = calcData.requirements && calcData.requirements.length > 0;
    const hadOldRequirements = state.previewTask?.requirements && state.previewTask.requirements.length > 0;
    const isNewGatheringItem = hadOldRequirements && !hasNewRequirements;
    const isGatheringSkill = GATHERING_SKILLS.includes(skillName?.toLowerCase());

    let mergedRequirements = [];
    let itemName = null;
    let timesToCraft = 1;
    let requirementsComplete = false;
    let hasCraftingRequirements = hasNewRequirements;

    if (isNewGatheringItem) {
      requirementsComplete = true;
      hasCraftingRequirements = false;
    } else {
      // For gathering skills without requirements, always detect from DOM
      // since we have no other way to know if the item changed
      if (isGatheringSkill && !hasNewRequirements) {
        itemName = detectCurrentItem();
      } else {
        // For crafts, preserve old name if skill hasn't changed
        const oldItemName = state.previewTask?.itemName || null;
        const oldSkillName = state.previewTask?.skillName || null;
        const skillChanged = oldSkillName && oldSkillName !== skillName;
        
        if (skillChanged) {
          itemName = detectCurrentItem();
        } else {
          itemName = oldItemName;
          if (!itemName) {
            itemName = detectCurrentItem();
          }
        }
      }
      timesToCraft = 1;

      delete state.savedInputValues['timesToCraftInput'];
      Object.keys(state.savedInputValues).forEach(key => {
        if (key.startsWith('targetInput_preview_')) {
          delete state.savedInputValues[key];
        }
      });

      if (hasNewRequirements && isGatheringSkill) {
        mergedRequirements = calcData.requirements;
        requirementsComplete = true;
        hasCraftingRequirements = true;
        console.log(`[Tracker] Gathering skill with consumables detected (${skillName})`);
      }

      // Simplified cache logic
      if (!requirementsComplete && skillName && itemName) {
        const cacheKey = `${skillName}_${itemName}`;
        const cached = state.requirementsCache[cacheKey];

        if (cached && (Date.now() - cached.timestamp) < 1800000) {
          mergedRequirements = cached.requirements;
          requirementsComplete = true;
          console.log(`[Tracker] Using cached requirements for ${itemName}`);
        }
      }

      if (!requirementsComplete && state.previewTask?.requirements) {
        mergedRequirements = state.previewTask.requirements;
        requirementsComplete = state.previewTask.requirementsComplete || false;
      }
    }

    state.previewTask = {
      skillName: skillName,
      skillNameDisplay: skillNameDisplay,
      itemName: itemName,
      expPerAction: calcData.expPerAction,
      modifiedActionTime: calcData.modifiedActionTime,
      skillLevel: calcData.skillLevel,
      requirements: mergedRequirements,
      materialRequirements: calcData.materialRequirements || null,
      timesToCraft: timesToCraft,
      requirementsComplete: requirementsComplete,
      hasCraftingRequirements: hasCraftingRequirements,
      isLevelTooLow: false,
      timestamp: Date.now()
    };

    debouncedUpdateUI();
  }

  function updatePreviewRequirements(data, url) {
    if (!data || !data.requirements) return;

    const match = url.match(/\/tasks\/requirements\/([^\/]+)\/([^?]+)/);
    if (!match) return;

    const skillFromUrl = match[1].toLowerCase();
    const itemNameEncoded = match[2];
    const itemName = decodeURIComponent(itemNameEncoded);

    // Simplified cache storage
    const cacheKey = `${skillFromUrl}_${itemName}`;
    state.requirementsCache[cacheKey] = {
      requirements: data.requirements,
      skillName: skillFromUrl,
      itemName: itemName,
      timestamp: Date.now()
    };

    console.log(`[Tracker] Cached requirements for ${itemName} with ${data.requirements.length} items`);

    if (!state.previewTask) {
      const skillNameDisplay = skillFromUrl.charAt(0).toUpperCase() + skillFromUrl.slice(1);

      state.previewTask = {
        skillName: skillFromUrl,
        skillNameDisplay: skillNameDisplay,
        itemName: itemName,
        expPerAction: 0,
        modifiedActionTime: 0,
        skillLevel: 0,
        requirements: data.requirements,
        materialRequirements: null,
        timesToCraft: 1,
        requirementsComplete: true,
        hasCraftingRequirements: true,
        isLevelTooLow: true,
        timestamp: Date.now()
      };

      debouncedUpdateUI();
    } else {
      const isNewCraft = state.previewTask.skillName !== skillFromUrl ||
                         state.previewTask.itemName !== itemName;

      if (isNewCraft) {
        state.previewTask.skillName = skillFromUrl;
        state.previewTask.skillNameDisplay = skillFromUrl.charAt(0).toUpperCase() + skillFromUrl.slice(1);
        state.previewTask.itemName = itemName;
        state.previewTask.timesToCraft = 1;
        state.previewTask.isLevelTooLow = true;
        state.previewTask.expPerAction = 0;
        state.previewTask.modifiedActionTime = 0;

        delete state.savedInputValues['timesToCraftInput'];

        Object.keys(state.targetLevelCalculations).forEach(key => {
          if (key.startsWith('preview_')) {
            delete state.targetLevelCalculations[key];
          }
        });

        Object.keys(state.savedInputValues).forEach(key => {
          if (key.startsWith('targetInput_preview_')) {
            delete state.savedInputValues[key];
          }
        });
      } else {
        if (!state.previewTask.itemName) {
          state.previewTask.itemName = itemName;
        }
        state.previewTask.isLevelTooLow = true;
      }

      state.previewTask.requirements = data.requirements;
      state.previewTask.requirementsComplete = true;
      state.previewTask.hasCraftingRequirements = true;

      console.log(`[Tracker] Requirements loaded for ${itemName} with ${data.requirements.length} items`);

      debouncedUpdateUI();
    }
  }

  // Optimizer specific API handlers
  function handleOptimizerItemClick(calcData) {
    if (!calcData) return;

    const itemName = detectCurrentItem();
    const skillName = detectCurrentSkill();

    if (!itemName || !skillName) {
      console.warn('[Optimizer] Could not detect item or skill');
      return;
    }

    const skillLower = skillName.toLowerCase();
    const cacheKey = `${skillLower}_${itemName}`;

    // Check if data changed
    const cached = state.optimizer.craftingCache[cacheKey];
    if (cached) {
      const changes = [];
      if (cached.actionTime !== calcData.modifiedActionTime) {
        changes.push(`actionTime: ${cached.actionTime}s → ${calcData.modifiedActionTime}s`);
      }
      if (cached.xp !== calcData.expPerAction) {
        changes.push(`xp: ${cached.xp} → ${calcData.expPerAction}`);
      }
      if (changes.length > 0) {
        console.log(`[Optimizer] Data changed for ${itemName}:`);
        changes.forEach(change => console.log(`  ${change}`));
      }
    }

    // Always overwrite with fresh data
    state.optimizer.craftingCache[cacheKey] = {
      itemName: itemName,
      skill: skillLower,
      xp: calcData.expPerAction,
      actionTime: calcData.modifiedActionTime,
      requirements: calcData.requirements || [],
      timestamp: Date.now()
    };

    saveOptimizerCache();
    console.log(`[Optimizer] Cached data for ${itemName}:`, state.optimizer.craftingCache[cacheKey]);

    // Handle based on wizard step
    if (state.optimizer.step === 2) {
      // Final item clicked
      state.optimizer.finalItem = state.optimizer.craftingCache[cacheKey];
      state.optimizer.currentSkill = skillLower;
      state.optimizer.waitingForClick = false;

      // Check for missing materials
      checkMissingMaterials();
    } else if (state.optimizer.step === 3) {
      // Material clicked
      const materialIndex = state.optimizer.pendingMaterials.findIndex(m => m === itemName);
      if (materialIndex !== -1) {
        state.optimizer.pendingMaterials.splice(materialIndex, 1);
      }

      if (state.optimizer.pendingMaterials.length === 0) {
        // All materials collected, calculate path
        state.optimizer.waitingForClick = false;
        calculateCraftingPath();
      } else {
        // Update UI to show remaining materials
        updateOptimizerUI();
      }
    }
  }

  function handleOptimizerRequirementsClick(data, url) {
    // Similar to handleOptimizerItemClick but for requirements endpoint
    const match = url.match(/\/tasks\/requirements\/([^\/]+)\/([^?]+)/);
    if (!match) return;

    const skillFromUrl = match[1].toLowerCase();
    const itemNameEncoded = match[2];
    const itemName = decodeURIComponent(itemNameEncoded);

    const cacheKey = `${skillFromUrl}_${itemName}`;

    state.optimizer.craftingCache[cacheKey] = {
      itemName: itemName,
      skill: skillFromUrl,
      xp: 0, // Will be updated when user clicks on the item
      actionTime: 0,
      requirements: data.requirements || [],
      timestamp: Date.now()
    };

    saveOptimizerCache();
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

  // Hook XHR (some API calls still use XMLHttpRequest)
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

  // === UI CREATION ===

  function createUI() {
    const panel = document.createElement("div");
    panel.id = "degenLevelTracker";

    const pos = state.position;
    const hasCustomHeight = pos.height !== null && pos.height !== undefined;
    const mobile = isMobile();

    // Base styles for both mobile and desktop
    const baseStyles = {
      position: "fixed",
      background: "#0B0E14",
      color: "#e0e0e0",
      fontFamily: "monospace",
      fontSize: "13px",
      borderRadius: "8px",
      zIndex: 999999,
      border: "1px solid #1E2330",
      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
      transition: "opacity 0.3s ease",
      display: state.isOpen ? "flex" : "none",
      flexDirection: "column",
      opacity: state.isOpen ? "1" : "0",
      resize: "none"
    };

    // Mobile-specific styles
    if (mobile) {
      Object.assign(panel.style, baseStyles, {
        top: state.isExpanded ? "10px" : "auto",
        bottom: state.isExpanded ? "auto" : "10px",
        left: "50%",
        right: "auto",
        transform: "translateX(-50%)",
        width: state.isExpanded ? "calc(100vw - 20px)" : "240px",
        maxWidth: state.isExpanded ? "100%" : "240px",
        height: state.isExpanded ? "auto" : "auto",
        minHeight: "auto",
        maxHeight: state.isExpanded ? "calc(100vh - 20px)" : "none"
      });
    } else {
      // Desktop styles (original behavior)
      Object.assign(panel.style, baseStyles, {
        top: pos.top !== null ? `${pos.top}px` : 'auto',
        left: pos.left !== null ? `${pos.left}px` : 'auto',
        right: pos.right !== null ? `${pos.right}px` : 'auto',
        width: state.isExpanded ? `${pos.width || 380}px` : "240px",
        height: state.isExpanded ? (hasCustomHeight ? `${pos.height}px` : "auto") : "auto",
        minHeight: state.isExpanded && !hasCustomHeight ? "200px" : "auto",
        maxHeight: state.isExpanded && !hasCustomHeight ? "80vh" : "none"
      });
    }

    const headerCursor = mobile ? 'default' : 'move';

    panel.innerHTML = `
      <div id="trackerHeader" style="
        padding: 16px;
        background: #0B0E14;
        border-bottom: 1px solid #1E2330;
        border-radius: 6px 6px 0 0;
        cursor: ${headerCursor};
        user-select: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        flex-shrink: 0;
      ">
        <span style="color: white; font-size: 16px; font-weight: bold;">XP Tracker</span>
        <div style="display: flex; gap: 12px; align-items: center;">
          <button id="openOptimizerBtn" title="Open XP Optimizer" class="tracker-btn" style="
            cursor: pointer;
            background: #2A3041;
            border: 1px solid #3A4051;
            padding: 6px 12px;
            color: #ffa500;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            transition: all 0.2s;
            display: ${state.isExpanded ? 'block' : 'none'};
          ">
            📊 Optimizer
          </button>
          <button id="trackerReset" title="Reset position & size" class="tracker-btn" style="cursor: pointer; background: none; border: none; padding: 0; color: #8B8D91; transition: color 0.2s, opacity 0.2s; display: flex; align-items: center; opacity: 0.7;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
          </button>
          <span id="trackerToggle" class="tracker-btn" style="cursor: pointer; color: #8B8D91; transition: color 0.2s;">${state.isExpanded ? '−' : '+'}</span>
          <button id="trackerClose" class="tracker-btn" style="cursor: pointer; background: none; border: none; padding: 0; color: #8B8D91; transition: color 0.2s; display: flex; align-items: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>
      </div>
      <div id="trackerContent" style="
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        display: ${state.isExpanded ? 'flex' : 'none'};
        flex-direction: column;
        align-content: flex-start;
        min-width: 0;
      "></div>
      <div id="resizeHandle" style="
        position: absolute;
        bottom: 0;
        right: 0;
        width: 16px;
        height: 16px;
        cursor: nwse-resize;
        display: ${state.isExpanded && !mobile ? 'block' : 'none'};
      ">
        <svg style="position: absolute; bottom: 2px; right: 2px;" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 11L1 1M11 6L6 11" stroke="#8B8D91" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
    `;

    document.body.appendChild(panel);

    // Add CSS for hover effects
    const style = document.createElement('style');
    style.textContent = `
      .tracker-btn:hover { color: white !important; opacity: 1 !important; }
      .close-btn:hover { color: white !important; }
      .calc-btn:hover { background: #6366f1 !important; }
      .wizard-btn:hover { color: white !important; opacity: 1 !important; }
      #closeWizard:hover { color: white !important; }
      #clearCacheBtn:hover {
        background: #3A4051 !important;
        border-color: #4A5061 !important;
        color: #ffb733 !important;
      }
      #openOptimizerBtn:hover {
        background: #3A4051 !important;
        border-color: #4A5061 !important;
        color: #ffb733 !important;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    // Setup drag and resize (only on desktop)
    if (!mobile) {
      setupDraggable(panel);
      setupResizable(panel);
    }

    // Attach event listeners properly
    document.getElementById('trackerReset').addEventListener('click', function(e) {
      e.stopPropagation();
      resetPanelPosition();
    });

    document.getElementById('trackerClose').addEventListener('click', function(e) {
      e.stopPropagation();
      closePanel();
    });

    document.getElementById('trackerToggle').addEventListener('click', function(e) {
      e.stopPropagation();
      togglePanel();
    });

    document.getElementById('openOptimizerBtn').addEventListener('click', function(e) {
      e.stopPropagation();
      startOptimizer();
    });

    updateUI();
  }

  function togglePanel() {
    state.isExpanded = !state.isExpanded;
    localStorage.setItem('degenLevelTracker_expanded', state.isExpanded);

    const panel = document.getElementById('degenLevelTracker');
    const content = document.getElementById('trackerContent');
    const toggle = document.getElementById('trackerToggle');
    const optimizerBtn = document.getElementById('openOptimizerBtn');
    const resizeHandle = document.getElementById('resizeHandle');
    const mobile = isMobile();

    content.style.display = state.isExpanded ? 'flex' : 'none';
    toggle.innerHTML = state.isExpanded ? '−' : '+';
    
    if (optimizerBtn) {
      optimizerBtn.style.display = state.isExpanded ? 'block' : 'none';
    }

    if (resizeHandle) {
      resizeHandle.style.display = state.isExpanded && !mobile ? 'block' : 'none';
    }

    const hasCustomHeight = state.position.height !== null && state.position.height !== undefined;

    if (mobile) {
      // Mobile styles
      if (state.isExpanded) {
        panel.style.top = "10px";
        panel.style.bottom = "auto";
        panel.style.width = "calc(100vw - 20px)";
        panel.style.maxWidth = "100%";
        panel.style.height = "auto";
        panel.style.minHeight = "auto";
        panel.style.maxHeight = "calc(100vh - 20px)";
      } else {
        panel.style.top = "auto";
        panel.style.bottom = "10px";
        panel.style.width = "240px";
        panel.style.maxWidth = "240px";
        panel.style.height = "auto";
        panel.style.minHeight = "auto";
        panel.style.maxHeight = "none";
      }
    } else {
      // Desktop styles (original behavior)
      if (state.isExpanded) {
        panel.style.width = `${state.position.width || 380}px`;
        panel.style.height = hasCustomHeight ? `${state.position.height}px` : 'auto';
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
    manageRealTimeUpdates();
  }

  function openPanel() {
    state.isOpen = true;
    localStorage.setItem('degenLevelTracker_open', 'true');

    const panel = document.getElementById('degenLevelTracker');
    if (panel) {
      panel.style.display = 'flex';
      setTimeout(() => {
        panel.style.opacity = '1';
      }, 10);
    }

    // Start real-time updates if needed
    manageRealTimeUpdates();
    console.log('📊 [Tracker] Panel opened');
  }

  function closePanel() {
    state.isOpen = false;
    localStorage.setItem('degenLevelTracker_open', 'false');

    const panel = document.getElementById('degenLevelTracker');
    if (panel) {
      panel.style.opacity = '0';
      setTimeout(() => {
        panel.style.display = 'none';
      }, 300);
    }

    // Stop real-time updates
    stopRealTimeUpdates();
    console.log('📊 [Tracker] Panel closed');
  }

  function resetPanelPosition() {
    const mobile = isMobile();

    if (mobile) {
      // On mobile, just re-center it
      const panel = document.getElementById('degenLevelTracker');
      if (panel) {
        panel.style.left = '50%';
        panel.style.right = 'auto';
        panel.style.transform = 'translateX(-50%)';
        if (state.isExpanded) {
          panel.style.top = '10px';
          panel.style.bottom = 'auto';
        } else {
          panel.style.top = 'auto';
          panel.style.bottom = '10px';
        }
      }
      console.log('🔄 [Tracker] Panel position reset (mobile)');
      return;
    }

    // Desktop behavior (original)
    const defaultPosition = {
      top: 100,
      left: null,
      right: 10,
      width: 380
    };

    state.position = defaultPosition;
    localStorage.setItem('degenLevelTracker_position', JSON.stringify(defaultPosition));

    const panel = document.getElementById('degenLevelTracker');
    if (panel) {
      Object.assign(panel.style, {
        top: '100px',
        left: 'auto',
        right: '10px',
        width: state.isExpanded ? '380px' : '240px',
        height: 'auto',
        minHeight: state.isExpanded ? '200px' : 'auto',
        maxHeight: state.isExpanded ? '80vh' : 'none',
        transform: 'none'
      });
    }

    console.log('🔄 [Tracker] Panel position reset to default');
  }

  function toggleOpen() {
    if (state.isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function refreshPreview() {
    state.previewTask = null;
    state.targetLevelCalculations = {};
    debouncedUpdateUI(true);
    console.log('🔄 [Tracker] Preview refreshed');
  }

  function setupDraggable(panel, isOptimizer = false) {
    const header = document.getElementById(isOptimizer ? 'wizardHeader' : 'trackerHeader');
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
          e.target.closest('#openOptimizerBtn') ||
          e.target.closest('#closeWizard') ||
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

      if (isOptimizer) {
        state.optimizer.position = {
          ...state.optimizer.position,
          top: finalTop,
          left: finalLeft,
          right: null
        };
        saveOptimizerPosition();
      } else {
        state.position = {
          ...state.position,
          top: finalTop,
          left: finalLeft,
          right: null
        };
        localStorage.setItem('degenLevelTracker_position', JSON.stringify(state.position));
      }

      xOffset = 0;
      yOffset = 0;
      initialX = 0;
      initialY = 0;
    }

    function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }
  }

  function setupResizable(panel, isOptimizer = false) {
    const resizeHandle = document.getElementById(isOptimizer ? 'optimizerResizeHandle' : 'resizeHandle');
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

      if (isOptimizer) {
        state.optimizer.position.width = panel.offsetWidth;
        state.optimizer.position.height = panel.offsetHeight;
        saveOptimizerPosition();
      } else {
        state.position.width = panel.offsetWidth;
        state.position.height = panel.offsetHeight;
        localStorage.setItem('degenLevelTracker_position', JSON.stringify(state.position));
        debouncedUpdateUI(true);
      }
    }
  }

  function saveInputValues() {
    const content = document.getElementById('trackerContent');
    if (!content) return;

    content.querySelectorAll('[id^="targetInput_"]').forEach(input => {
      if (input.value && (state.savedInputValues.hasOwnProperty(input.id) || !input.id.startsWith('targetInput_preview_'))) {
        state.savedInputValues[input.id] = input.value;
      }
    });

    const timesToCraftInput = document.getElementById('timesToCraftInput');
    if (timesToCraftInput && timesToCraftInput.value && state.savedInputValues.hasOwnProperty('timesToCraftInput')) {
      state.savedInputValues['timesToCraftInput'] = timesToCraftInput.value;
    }
  }

  function restoreInputValues() {
    Object.keys(state.savedInputValues).forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input && state.savedInputValues[inputId]) {
        input.value = state.savedInputValues[inputId];
      }
    });
  }

  // === UI UPDATE FUNCTIONS ===

  function isUpdateLocked() {
    return Date.now() < state.updateLockUntil;
  }

  function renderEmptyState() {
    return `<div style="padding: 20px; text-align: center; color: #8B8D91;">
      Waiting for API data...<br>
      <small>Start a task or click on a resource</small>
    </div>`;
  }

  function renderActiveTasks() {
    if (state.activeTasks.length === 0) return '';

    let html = `<div style="
      padding: 12px;
      min-width: 0;
      box-sizing: border-box;
      flex-shrink: 0;
    ">
      <div style="color: #5fdd5f; font-weight: bold; margin-bottom: 8px;">🟢 ACTIVE TASK</div>`;

    state.activeTasks.forEach(task => {
      const skillLower = task.skillName.toLowerCase();
      const currentXP = state.skills[skillLower]?.currentXP || 0;

      if (currentXP > 0 && task.expPerAction > 0) {
        const progress = calculateProgress(currentXP, task.expPerAction, task.actionTime);
        html += renderTaskCard(
          task.skillName,
          task.itemName,
          progress,
          task.expPerAction,
          task.actionTime,
          'active',
          task.taskKey
        );
      }
    });

    return html + `</div>`;
  }

  function renderPreviewSection() {
    if (!state.previewTask || (Date.now() - state.previewTask.timestamp >= 1800000)) {
      return '';
    }

    let html = `<div style="
      padding: 12px;
      min-width: 0;
      box-sizing: border-box;
      flex-shrink: 0;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="color: white; font-weight: bold;">💡 PREVIEW</div>
        <button id="clearPreview" style="
          cursor: pointer;
          background: none;
          border: none;
          color: #8B8D91;
          padding: 4px 8px;
          font-size: 11px;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        " class="tracker-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
          Clear
        </button>
      </div>`;

    const skillLower = state.previewTask.skillName?.toLowerCase();
    const currentXP = skillLower ? (state.skills[skillLower]?.currentXP || 0) : 0;

    if (currentXP > 0 && state.previewTask.expPerAction > 0) {
      const progress = calculateProgress(
        currentXP,
        state.previewTask.expPerAction,
        state.previewTask.modifiedActionTime
      );

      html += renderTaskCard(
        state.previewTask.skillNameDisplay || state.previewTask.skillName || "Unknown Skill",
        state.previewTask.itemName || "Preview Task",
        progress,
        state.previewTask.expPerAction,
        state.previewTask.modifiedActionTime,
        'preview'
      );
    } else {
      html += renderPreviewPlaceholder();
    }

    if (state.previewTask.hasCraftingRequirements) {
      if (state.previewTask.requirementsComplete && state.previewTask.requirements && state.previewTask.requirements.length > 0) {
        html += renderRequirements(state.previewTask.requirements, state.previewTask.timesToCraft);
      } else {
        html += renderRequirementsLoading();
      }
    }

    return html + `</div>`;
  }

  function renderPreviewPlaceholder() {
    const isLevelTooLow = state.previewTask.isLevelTooLow || false;

    return `
      <div style="
        background: #1E2330;
        border-radius: 6px;
        padding: 10px;
        margin-bottom: 10px;
        border: 1px solid #2A3041;
        border-left: 3px solid ${isLevelTooLow ? '#ff6b6b' : '#ffd700'};
        min-width: 0;
        box-sizing: border-box;
      ">
         <div style="font-weight: bold; margin-bottom: 6px; color: white; word-wrap: break-word; overflow-wrap: break-word; font-size: 14px;">
           ${getSkillIcon(state.previewTask.skillNameDisplay || state.previewTask.skillName || "Unknown")} ${escapeHtml(state.previewTask.skillNameDisplay || state.previewTask.skillName || "Unknown Skill")} ${state.previewTask.itemName ? `- <span style="color: #a78bfa;">${escapeHtml(state.previewTask.itemName)}</span>` : ''}
         </div>
        <div style="color: ${isLevelTooLow ? '#ff6b6b' : '#8B8D91'}; font-size: 12px; display: flex; align-items: center; gap: 6px;">
          ${isLevelTooLow ? '⚠️' : ''}
          <small>${isLevelTooLow ? 'Skill level too low to craft this item' : 'Loading XP data...'}</small>
        </div>
      </div>
    `;
  }

  function shouldUseColumnLayout() {
    const panel = document.getElementById('degenLevelTracker');
    return panel && panel.offsetWidth >= 600;
  }

  function buildFinalLayout(activeTasksHTML, previewHTML) {
    if (activeTasksHTML === '' && previewHTML === '') {
      return renderEmptyState();
    }

    if (shouldUseColumnLayout() && activeTasksHTML !== '' && previewHTML !== '') {
      return `
        <div style="
          display: flex;
          gap: 12px;
          height: 100%;
          min-width: 0;
        ">
          <div style="
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            border-right: 1px solid #1E2330;
            min-width: 0;
          ">${activeTasksHTML}</div>
          <div style="
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            min-width: 0;
          ">${previewHTML}</div>
        </div>
      `;
    }

    return `${activeTasksHTML}${previewHTML}`;
  }

  function attachClearPreviewListener() {
    const clearPreviewBtn = document.getElementById('clearPreview');
    if (clearPreviewBtn) {
      clearPreviewBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        refreshPreview();
      });
    }
  }

  function updateUI() {
    const content = document.getElementById('trackerContent');
    if (!content || isUpdateLocked()) return;

    saveInputValues();

    const activeTasksHTML = renderActiveTasks();
    const previewHTML = renderPreviewSection();
    const html = buildFinalLayout(activeTasksHTML, previewHTML);

    content.innerHTML = html;

    restoreInputValues();
    attachInputListeners();
    attachClearPreviewListener();
  }

  // === TASK CARD RENDERING ===

  function renderTaskCard(skillName, itemName, progress, expPerAction, actionTime, type, taskKey = null) {
    const skillIcon = getSkillIcon(skillName);
    const cardId = `${type}_${skillName.replace(/\s/g, '_')}`;
    const savedValue = state.savedInputValues[`targetInput_${cardId}`] || '';
    const borderColor = type === 'active' ? '#5fdd5f' : '#ffd700';

    return `
      <div style="
        background: #1E2330;
        border-radius: 6px;
        padding: 10px;
        margin-bottom: 10px;
        border: 1px solid #2A3041;
        border-left: 3px solid ${borderColor};
        min-width: 0;
        box-sizing: border-box;
      " data-task-key="${taskKey || ''}">
        <div style="font-weight: bold; margin-bottom: 6px; color: white; word-wrap: break-word; overflow-wrap: break-word; font-size: 14px;">
          ${skillIcon} ${escapeHtml(skillName)} ${itemName ? `- <span style="color: #a78bfa;">${escapeHtml(itemName)}</span>` : ''}
        </div>
        <div style="color: #8B8D91; font-size: 12px; margin-bottom: 4px;">
          Lvl <span class="current-level">${progress.currentLevel}</span> → <span class="next-level">${progress.nextLevel}</span>
        </div>
        <div style="
          background: #0B0E14;
          border-radius: 4px;
          height: 18px;
          margin-bottom: 6px;
          overflow: hidden;
          position: relative;
        ">
          <div class="progress-bar" style="
            background: linear-gradient(90deg, #4f46e5, #6366f1);
            height: 100%;
            width: ${Math.min(progress.percentage, 100)}%;
            transition: width 0.3s;
          "></div>
          <div style="
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
          ">
            <span class="progress-percentage">${Math.min(progress.percentage, 100).toFixed(1)}%</span>
          </div>
        </div>
        <div style="color: #C5C6C9; font-size: 12px; margin-bottom: 8px;">
          <span class="current-xp">${formatNumber(progress.currentXP)}</span> / <span class="xp-for-next">${formatNumber(progress.xpForNext)}</span> XP
        </div>
        <div style="color: #60a5fa; font-size: 12px; margin-bottom: 8px;">
          📍 Next lvl (<span class="next-level-indicator">${progress.nextLevel}</span>): <span class="actions-needed">${formatNumber(progress.actionsNeeded)}</span> actions • <span class="time-needed">${formatTime(progress.timeNeeded)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="color: #6366f1; font-size: 12px;">🎯 Target Lvl:</span>
          <input
            type="number"
            id="targetInput_${cardId}"
            min="${progress.nextLevel}"
            max="99"
            placeholder="${progress.nextLevel}"
            value="${savedValue}"
            style="
              width: 50px;
              padding: 6px;
              background: #2A3041;
              border: 1px solid #1E2330;
              color: #fff;
              border-radius: 4px;
              font-size: 12px;
            "
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
            style="
              padding: 6px 12px;
              background: #4f46e5;
              border: none;
              color: #fff;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
              transition: background 0.2s;
            "
            class="calc-btn"
          >Calc</button>
        </div>
        <div id="targetResult_${cardId}" class="target-result" style="
          margin-top: 8px;
          padding: 8px;
          background: #0B0E14;
          border-radius: 4px;
          font-size: 12px;
          color: #6366f1;
          display: ${state.targetLevelCalculations[cardId] ? 'flex' : 'none'};
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        ">${state.targetLevelCalculations[cardId] ? renderTargetResult(cardId, state.targetLevelCalculations[cardId]) : ''}</div>
      </div>
    `;
  }

  function renderTargetResult(cardId, calc) {
    const currentXP = state.skills[calc.taskKey?.split('_')[0]?.toLowerCase()]?.currentXP || calc.initialXP;
    const result = calculateToTargetLevel(currentXP, calc.targetLevel, calc.expPerAction, calc.actionTime);

    return `
      <span style="flex: 1; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <span>→ Lvl ${calc.targetLevel}:</span>
        <strong><span class="target-actions">${formatNumber(result.actionsNeeded)}</span> actions</strong>
        <span>•</span>
        <strong class="target-time">${formatTime(result.timeNeeded)}</strong>
        <span style="color: #8B8D91;">|</span>
        <span><span class="target-xp-needed">${formatNumber(result.xpNeeded)}</span> XP needed</span>
      </span>
      <button id="closeTarget_${cardId}" class="close-btn" style="
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
      ">✕</button>
    `;
  }

  function getSkillIcon(skillName) {
    return SKILL_ICONS[skillName] || '📊';
  }

  function renderRequirementsLoading() {
    return `
      <div style="
        margin-top: 12px;
        padding: 16px;
        background: #1E2330;
        border-radius: 6px;
        border: 1px solid #2A3041;
        text-align: center;
      ">
        <div style="
          color: #8B8D91;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        ">
          <div style="
            width: 16px;
            height: 16px;
            border: 2px solid #2A3041;
            border-top-color: #ffd700;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <span>Loading craft requirements...</span>
        </div>
      </div>
    `;
  }

  function renderRequirements(requirements, timesToCraft = 1) {
    if (!requirements || requirements.length === 0) return '';

    let html = `
      <div style="
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
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
          flex-shrink: 0;
        ">
          <span style="color: #a78bfa; font-weight: bold; font-size: 14px; white-space: nowrap;">📦 Craft Requirements</span>
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
        <div id="requirementsList" style="
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow-y: auto;
          overflow-x: hidden;
          flex: 1;
          min-height: 0;
        ">
    `;

    requirements.forEach(req => {
      const totalRequired = req.required * timesToCraft;
      const hasEnough = req.available >= totalRequired;
      const statusIcon = hasEnough ? '✅' : '❌';
      const statusColor = hasEnough ? '#5fdd5f' : '#ff6b6b';

      html += `
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px;
          background: #2A3041;
          border-radius: 4px;
          font-size: 11px;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        " data-requirement="${req.itemName}" data-base-required="${req.required}" data-available="${req.available}">
          ${req.img ? `<img src="${req.img}" alt="${req.itemName}" style="width: 24px; height: 24px; border-radius: 3px; flex-shrink: 0;">` : ''}
           <div style="flex: 1; min-width: 0; overflow: hidden;">
             <div style="color: #C5C6C9; font-weight: bold; word-wrap: break-word; overflow-wrap: break-word;">${escapeHtml(req.itemName)}</div>
             <div style="color: ${statusColor}; word-wrap: break-word; overflow-wrap: break-word;">
               Need: <span class="req-total">${formatNumber(totalRequired)}</span> | Have: ${formatNumber(req.available)} ${statusIcon}
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
  }

  // Unified input listener attachment
  function attachInputListeners() {
    // Generic function for input focus/blur handling
    function setupInputLock(input) {
      input.addEventListener('focus', function() {
        state.updateLockUntil = Date.now() + 3000;
      });

      input.addEventListener('input', function() {
        state.updateLockUntil = Date.now() + 3000;
        state.savedInputValues[this.id] = this.value;
      });

      input.addEventListener('blur', function() {
        setTimeout(() => {
          state.updateLockUntil = 0;
        }, 500);
      });
    }

    // Target level inputs
    document.querySelectorAll('.target-input').forEach(input => {
      setupInputLock(input);
    });

    // Target level calculation buttons
    document.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', handleTargetCalculation);
    });

    // Close target result buttons
    document.querySelectorAll('[id^="closeTarget_"]').forEach(btn => {
      btn.addEventListener('click', function() {
        const cardId = this.id.replace('closeTarget_', '');
        const resultEl = document.getElementById(`targetResult_${cardId}`);
        if (resultEl) {
          resultEl.style.display = 'none';
        }
        if (state.targetLevelCalculations[cardId]) {
          delete state.targetLevelCalculations[cardId];
        }
      });
    });

    // Times to craft input
    const timesToCraftInput = document.getElementById('timesToCraftInput');
    if (timesToCraftInput) {
      setupInputLock(timesToCraftInput);
      timesToCraftInput.addEventListener('input', handleTimesToCraftChange);
    }
  }

  function handleTargetCalculation(e) {
    const btn = e.currentTarget;
    const cardId = btn.id.replace('targetBtn_', '');
    const inputEl = document.getElementById(`targetInput_${cardId}`);
    const resultEl = document.getElementById(`targetResult_${cardId}`);

    const targetLevel = parseInt(inputEl.value);
    const currentXP = parseInt(btn.dataset.xp);
    const expPerAction = parseFloat(btn.dataset.expPerAction);
    const actionTime = parseFloat(btn.dataset.actionTime);
    const taskKey = btn.dataset.taskKey;
    const cardType = btn.dataset.cardType;

    if (isNaN(targetLevel) || targetLevel < 1 || targetLevel > 99) {
      resultEl.textContent = '❌ Invalid level (1-99)';
      resultEl.style.display = 'block';
      return;
    }

    const currentLevel = getLevelFromXP(currentXP);
    if (targetLevel <= currentLevel) {
      resultEl.textContent = `❌ Target must be > ${currentLevel}`;
      resultEl.style.display = 'block';
      return;
    }

    const result = calculateToTargetLevel(currentXP, targetLevel, expPerAction, actionTime);

    state.targetLevelCalculations[cardId] = {
      targetLevel: targetLevel,
      initialXP: currentXP,
      expPerAction: expPerAction,
      actionTime: actionTime,
      taskKey: taskKey,
      result: result,
      timestamp: Date.now()
    };

    if (cardType === 'preview' && state.previewTask) {
      state.previewTask.timesToCraft = result.actionsNeeded;

      const timesToCraftInput = document.getElementById('timesToCraftInput');
      if (timesToCraftInput) {
        timesToCraftInput.value = result.actionsNeeded;
        state.savedInputValues['timesToCraftInput'] = result.actionsNeeded.toString();
        updateRequirementsDisplay(result.actionsNeeded);
      }
    }

    resultEl.innerHTML = renderTargetResult(cardId, state.targetLevelCalculations[cardId]);
    resultEl.style.display = 'flex';

    // Re-attach close button listener for the new button
    const closeBtn = document.getElementById(`closeTarget_${cardId}`);
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        resultEl.style.display = 'none';
        delete state.targetLevelCalculations[cardId];
      });
    }
  }

  function handleTimesToCraftChange(e) {
    const timesToCraft = Math.max(1, parseInt(e.target.value) || 1);

    if (state.previewTask) {
      state.previewTask.timesToCraft = timesToCraft;
    }

    updateRequirementsDisplay(timesToCraft);
  }

  function updateRequirementsDisplay(timesToCraft) {
    const requirementsList = document.getElementById('requirementsList');
    if (!requirementsList) return;

    requirementsList.querySelectorAll('[data-requirement]').forEach(reqEl => {
      const baseRequired = parseInt(reqEl.dataset.baseRequired);
      const available = parseInt(reqEl.dataset.available);
      const totalRequired = baseRequired * timesToCraft;
      const hasEnough = available >= totalRequired;

      const statusIcon = hasEnough ? '✅' : '❌';
      const statusColor = hasEnough ? '#5fdd5f' : '#ff6b6b';

      const totalEl = reqEl.querySelector('.req-total');
      const statusEl = reqEl.querySelector('div > div:last-child');

      if (totalEl) {
        totalEl.textContent = formatNumber(totalRequired);
      }

      if (statusEl) {
        statusEl.style.color = statusColor;
        statusEl.innerHTML = `Need: <span class="req-total">${formatNumber(totalRequired)}</span> | Have: ${formatNumber(available)} ${statusIcon}`;
      }
    });
  }

  // === REAL-TIME UPDATE SYSTEM (OPTIMIZED) ===

  function manageRealTimeUpdates() {
    if (state.isOpen && state.isExpanded && state.activeTasks.length > 0) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }
  }

  function startRealTimeUpdates() {
    if (state.realTimeInterval) return; // Already running

    state.realTimeInterval = setInterval(() => {
      updateRealTimeUI();
    }, 100);
  }

  function stopRealTimeUpdates() {
    if (state.realTimeInterval) {
      clearInterval(state.realTimeInterval);
      state.realTimeInterval = null;
    }
  }

  function updateRealTimeUI() {
    const content = document.getElementById('trackerContent');
    if (!content) return;

    const now = Date.now();

    state.activeTasks.forEach(task => {
      const tracking = state.realTimeTracking[task.taskKey];
      if (!tracking) return;

      const skillLower = task.skillName.toLowerCase();
      const baseXP = state.skills[skillLower]?.currentXP || 0;
      if (baseXP === 0) return;

      const taskCard = content.querySelector(`[data-task-key="${task.taskKey}"]`);
      if (!taskCard) return;

      const secondsElapsed = (now - tracking.timerStartTime) / 1000;
      const currentTimeRemaining = Math.max(0, tracking.initialTimeRemaining - secondsElapsed);
      const actionsCompletedSinceTimer = Math.floor(secondsElapsed / task.actionTime);
      const xpGainedSinceTimer = actionsCompletedSinceTimer * task.expPerAction;
      const estimatedCurrentXP = tracking.initialXP + xpGainedSinceTimer;
      const currentActionsRemaining = Math.max(0, tracking.initialActionsRemaining - actionsCompletedSinceTimer);

      const progress = calculateProgress(estimatedCurrentXP, task.expPerAction, task.actionTime);

      // Update DOM elements
      const updates = [
        { selector: '.current-level', value: progress.currentLevel },
        { selector: '.next-level', value: progress.nextLevel },
        { selector: '.progress-percentage', value: `${Math.min(progress.percentage, 100).toFixed(1)}%` },
        { selector: '.current-xp', value: formatNumber(Math.floor(estimatedCurrentXP)) },
        { selector: '.xp-for-next', value: formatNumber(progress.xpForNext) },
        { selector: '.actions-needed', value: formatNumber(Math.ceil(currentActionsRemaining)) },
        { selector: '.time-needed', value: formatTime(currentTimeRemaining) }
      ];

      updates.forEach(({ selector, value }) => {
        const el = taskCard.querySelector(selector);
        if (el && el.textContent !== value.toString()) {
          el.textContent = value;
        }
      });

      // Update progress bar
      const progressBar = taskCard.querySelector('.progress-bar');
      if (progressBar) {
        const percentage = Math.min(progress.percentage, 100);
        progressBar.style.width = `${percentage}%`;
      }

      // Update target level calculations
      Object.keys(state.targetLevelCalculations).forEach(cardId => {
        const calc = state.targetLevelCalculations[cardId];
        if (calc.taskKey === task.taskKey) {
          const result = calculateToTargetLevel(estimatedCurrentXP, calc.targetLevel, calc.expPerAction, calc.actionTime);

          const targetUpdates = [
            { selector: `#targetResult_${cardId} .target-actions`, value: formatNumber(result.actionsNeeded) },
            { selector: `#targetResult_${cardId} .target-time`, value: formatTime(result.timeNeeded) },
            { selector: `#targetResult_${cardId} .target-xp-needed`, value: formatNumber(result.xpNeeded) }
          ];

          targetUpdates.forEach(({ selector, value }) => {
            const el = content.querySelector(selector);
            if (el && el.textContent !== value) {
              el.textContent = value;
            }
          });
        }
      });
    });
  }

  // === OPTIMIZER UI FUNCTIONS ===

  function createOptimizerUI() {
    const panel = document.createElement('div');
    panel.id = 'craftingWizardModal';
    
    const pos = state.optimizer.position;
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
      zIndex: '1000000',
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
      <div id="optimizerResizeHandle" style="
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

    document.getElementById('closeWizard').addEventListener('click', closeOptimizer);
    document.getElementById('clearCacheBtn').addEventListener('click', clearOptimizerCache);
    document.getElementById('wizardReset').addEventListener('click', function(e) {
      e.stopPropagation();
      resetOptimizerPosition();
    });
    
    // Make draggable and resizable
    setupDraggable(panel, true);
    setupResizable(panel, true);

    updateOptimizerUI();
  }

  function updateOptimizerUI() {
    const content = document.getElementById('wizardContent');
    if (!content) return;

    switch (state.optimizer.step) {
      case 1:
        content.innerHTML = renderOptimizerStep1();
        document.getElementById('wizardNextBtn').addEventListener('click', handleOptimizerStep1Next);
        break;
      case 2:
        content.innerHTML = renderOptimizerStep2();
        break;
      case 3:
        content.innerHTML = renderOptimizerStep3();
        break;
      case 4:
        content.innerHTML = renderOptimizerStep4();
        break;
      default:
        content.innerHTML = '<p>Loading...</p>';
    }
  }

  function renderOptimizerStep1() {
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

  function renderOptimizerStep2() {
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
          Target Level: ${state.optimizer.targetLevel}
        </p>
      </div>
    `;
  }

  function renderOptimizerStep3() {
    const remaining = state.optimizer.pendingMaterials.map(m => `<li style="color: #ffd700;">• ${escapeHtml(m)}</li>`).join('');

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
          Final Item: ${escapeHtml(state.optimizer.finalItem?.itemName || 'Unknown')}<br>
          Remaining: ${state.optimizer.pendingMaterials.length} material(s)
        </p>
      </div>
    `;
  }

  function renderOptimizerStep4() {
    return `
      <div id="craftingPathResults"></div>
    `;
  }

  function handleOptimizerStep1Next() {
    const input = document.getElementById('targetLevelInput');
    const targetLevel = parseInt(input.value);

    if (isNaN(targetLevel) || targetLevel < 1 || targetLevel > 99) {
      alert('Please enter a valid level between 1 and 99');
      return;
    }

    state.optimizer.targetLevel = targetLevel;
    state.optimizer.step = 2;
    state.optimizer.waitingForClick = true;
    updateOptimizerUI();
  }

  function checkMissingMaterials() {
    // Check if this skill has intermediate crafts (Bar/Leather/Cloth)
    if (!SKILLS_WITH_INTERMEDIATE_CRAFTS.includes(state.optimizer.currentSkill)) {
      // No intermediate crafts for this skill, skip to calculation
      console.log(`[Optimizer] Skill ${state.optimizer.currentSkill} has no intermediate crafts, skipping to calculation`);
      state.optimizer.step = 4;
      calculateCraftingPath();
      return;
    }

    if (!state.optimizer.finalItem || !state.optimizer.finalItem.requirements) {
      // No materials needed, go straight to calculation
      state.optimizer.step = 4;
      calculateCraftingPath();
      return;
    }

    const missing = [];
    const pattern = CRAFTABLE_MATERIAL_PATTERNS[state.optimizer.currentSkill];

    state.optimizer.finalItem.requirements.forEach(req => {
      // Check if this requirement matches the craftable material pattern
      if (!pattern || !pattern.test(req.itemName)) {
        console.log(`[Optimizer] Skipping raw material: ${req.itemName}`);
        return; // Skip raw materials (ore, coal, etc.)
      }

      // This is a craftable intermediate material (Bar/Leather/Cloth)
      const cacheKey = `${state.optimizer.currentSkill}_${req.itemName}`;
      const cached = state.optimizer.craftingCache[cacheKey];

      if (!cached || cached.xp === 0 || !cached.actionTime) {
        missing.push(req.itemName);
      }
    });

    if (missing.length === 0) {
      // All craftable materials are cached, go to calculation
      state.optimizer.step = 4;
      calculateCraftingPath();
    } else {
      // Need to collect material data
      state.optimizer.step = 3;
      state.optimizer.pendingMaterials = missing;
      state.optimizer.waitingForClick = true;
      updateOptimizerUI();
    }
  }

  function calculateCraftingPath() {
    state.optimizer.step = 4;
    updateOptimizerUI();

    // Get current XP for the selected skill (using shared skills state)
    const currentSkillXP = state.skills[state.optimizer.currentSkill]?.currentXP || 0;
    const currentLevel = getLevelFromXP(currentSkillXP);
    const targetXP = getXPForLevel(state.optimizer.targetLevel);
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
    if (state.optimizer.finalItem.requirements && state.optimizer.finalItem.requirements.length > 0) {
      state.optimizer.finalItem.requirements.forEach(req => {
        const cacheKey = `${state.optimizer.currentSkill}_${req.itemName}`;
        const matData = state.optimizer.craftingCache[cacheKey];

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
      const itemXP = state.optimizer.finalItem.xp;

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
        const totalTime = bars * mat.actionTime + numItems * state.optimizer.finalItem.actionTime;

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

      console.log(`[Optimizer] Optimal solution: ${finalCraftsNeeded} items + ${totalMatCraftsNeeded} bars (overshoot: ${smallestOvershoot} XP, time: ${formatTime(fastestTime)})`);
    } else {
      // No intermediate crafts, just final items
      finalCraftsNeeded = Math.ceil(remainingXP / state.optimizer.finalItem.xp);
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
        const cacheKey = `${state.optimizer.currentSkill}_${mat.name}`;
        const matData = state.optimizer.craftingCache[cacheKey];
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
      const finalItemXP = finalCraftsNeeded * state.optimizer.finalItem.xp;
      const finalItemTime = finalCraftsNeeded * state.optimizer.finalItem.actionTime;
      const finalEndLevel = getLevelFromXP(stepXP + finalItemXP);

      // Get requirements for final item
      const finalRequirements = [];
      if (state.optimizer.finalItem.requirements) {
        state.optimizer.finalItem.requirements.forEach(req => {
          finalRequirements.push({
            itemName: req.itemName,
            quantity: req.required * finalCraftsNeeded
          });
        });
      }

      path.push({
        itemName: state.optimizer.finalItem.itemName,
        crafts: finalCraftsNeeded,
        xpGained: finalItemXP,
        time: finalItemTime,
        startLevel: getLevelFromXP(stepXP),
        endLevel: Math.min(finalEndLevel, state.optimizer.targetLevel),
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

    const currentSkillXP = state.skills[state.optimizer.currentSkill]?.currentXP || 0;

    const results = `
      <div style="text-align: center; margin-bottom: 24px;">
        <h3 style="color: white; margin-bottom: 12px;">📊 Crafting Path to Level ${state.optimizer.targetLevel}</h3>
        <div style="color: #8B8D91; font-size: 14px;">
          <p>Current Level: ${currentLevel} (${formatNumber(currentSkillXP)} XP)</p>
          <p>Target Level: ${state.optimizer.targetLevel} (${formatNumber(getXPForLevel(state.optimizer.targetLevel))} XP)</p>
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
    document.getElementById('closeOptimizerBtn').addEventListener('click', closeOptimizer);
  }

  function startOptimizer() {
    state.optimizer.active = true;
    state.optimizer.step = 1;
    state.optimizer.targetLevel = null;
    state.optimizer.finalItem = null;
    state.optimizer.materials = [];
    state.optimizer.waitingForClick = false;
    state.optimizer.pendingMaterials = [];

    createOptimizerUI();
  }

  function closeOptimizer() {
    state.optimizer.active = false;
    state.optimizer.waitingForClick = false;
    const modal = document.getElementById('craftingWizardModal');
    if (modal) {
      modal.remove();
    }
  }

  function resetOptimizerPosition() {
    const defaultPosition = {
      top: 100,
      left: null,
      right: 10,
      width: 500,
      height: null
    };

    state.optimizer.position = defaultPosition;
    saveOptimizerPosition();

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

    console.log('🔄 [Optimizer] Panel position reset to default');
  }

  // === NAVBAR BUTTON INJECTION ===

  function injectNavbarButton() {
    const navbarContainer = document.querySelector('.flex.items-center.space-x-1');
    if (!navbarContainer) {
      console.log('[Tracker] Navbar container not found, retrying...');
      return false;
    }

    if (document.getElementById('levelTrackerNavBtn')) {
      return true;
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

    button.addEventListener('click', toggleOpen);

    const profileButton = navbarContainer.querySelector('.relative');
    if (profileButton && profileButton.parentElement === navbarContainer) {
      navbarContainer.insertBefore(button, profileButton);
    } else {
      navbarContainer.appendChild(button);
    }

    console.log('✅ [Tracker] Navbar button injected');
    return true;
  }

  // === CACHE CLEANUP ===

  function cleanupCaches() {
    const now = Date.now();

    // Clean up requirementsCache - remove entries older than 30 minutes
    Object.keys(state.requirementsCache).forEach(key => {
      if (now - state.requirementsCache[key].timestamp > 1800000) {
        delete state.requirementsCache[key];
      }
    });

    // Clean up realTimeTracking - remove entries for inactive tasks
    const activeTaskKeys = state.activeTasks.map(task => task.taskKey);
    Object.keys(state.realTimeTracking).forEach(key => {
      if (!activeTaskKeys.includes(key)) {
        delete state.realTimeTracking[key];
      }
    });
  }

  // === INITIALIZATION ===

  function init() {
    if (document.getElementById('degenLevelTracker')) return;
    createUI();

    // Try to inject navbar button
    let injectionAttempts = 0;
    const maxAttempts = 20;
    const injectionInterval = setInterval(() => {
      injectionAttempts++;
      if (injectNavbarButton() || injectionAttempts >= maxAttempts) {
        clearInterval(injectionInterval);
        if (injectionAttempts >= maxAttempts) {
          console.warn('[Tracker] Failed to inject navbar button after max attempts');
        }
      }
    }, 500);

    // Detect skill periodically
    setInterval(() => {
      detectCurrentSkill();
    }, 1000);

    // Re-inject button on navigation (for SPA)
    setInterval(() => {
      if (!document.getElementById('levelTrackerNavBtn')) {
        injectNavbarButton();
      }
    }, 2000);

    // Clean up caches periodically (every 5 minutes)
    setInterval(() => {
      cleanupCaches();
    }, 300000);

    console.log('🟢 [DegenIdle] XP Tracker & Optimizer v1.3.0 loaded');
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    init();
  } else {
    window.addEventListener("DOMContentLoaded", init);
  }

})();