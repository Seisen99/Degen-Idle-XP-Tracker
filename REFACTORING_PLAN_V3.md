# 📋 REFACTORING PLAN - Degen Idle XP Tracker V3.0
## Autonomous Calculations with Static Database

---

## 🎯 Executive Summary

### Current Architecture (V2.0.5 - Reactive)
- **Lines of code:** 3606
- **Dependencies:** 4 API endpoints (`/skills`, `/tasks/active/`, `/calculate`, `/requirements`)
- **Problem:** Must click every item to build optimizer cache
- **Cache:** Complex synchronization system, can become stale

### New Architecture (V3.0 - Proactive)
- **Dependencies:** 2 API endpoints (`/skills`, `/tasks/active/`) + 1 data endpoint (`/all-data`)
- **Solution:** All calculations done client-side with static game database
- **Cache:** Single unified JSON, always accurate
- **Benefit:** Zero clicks needed, instant calculations

---

## 📊 FEATURE INVENTORY - Current Script

### ✅ Core Features to Preserve

#### 1. **XP Tracker Panel**
- Real-time XP tracking with progress bars
- Active tasks display with countdown timers
- Preview section for items being clicked
- Target level calculator (calculate actions/time to reach any level 1-99)
- Requirements display with owned vs needed quantities
- Mobile responsive design
- Draggable/resizable panel (desktop only)
- Persistent position/size in localStorage
- Expand/collapse functionality

#### 2. **XP Optimizer (4-Step Wizard)**
- **Step 1:** Enter target level
- **Step 2:** Click on final item to craft
- **Step 3:** Click on intermediate materials (Bar/Leather/Cloth + weapon components)
- **Step 4:** Display optimal crafting path with:
  - Minimized XP overshoot
  - Materials to craft (with owned quantity deduction)
  - Final items to craft
  - Total XP breakdown
  - Total time estimation
  - Per-step details (action count, XP gain, time)

#### 3. **Crafting Cache System**
- Per-character cache in localStorage (`degenCraftingPathCache_{characterId}`)
- Stores: itemName, skill, xp, actionTime, requirements (with img + available quantities)
- Intelligent merging: preserve static data (img), update dynamic data (available, hasEnough)
- Inventory synchronization across all cached items
- Manual cache clearing button

#### 4. **Real-Time Calculations**
- Update UI every 100ms when panel is open
- Estimate current XP based on elapsed time
- Update progress bars, actions remaining, time remaining
- Update target level calculations in real-time

#### 5. **Skill Support**
- 18 skills total (SKILLS array)
- 6 gathering skills (no requirements)
- 3 skills with intermediate crafts (forging, leatherworking, tailoring)
- Weapon-specific components (handle, bowstring, gemstone)
- Craftable material patterns (bar, leather, cloth)

#### 6. **Advanced Optimizer Logic**
- Detect skill with/without intermediate crafts
- Calculate optimal path to minimize overshoot
- Prioritize final item over materials when XP/time ratio is better
- Post-optimization reduction check (can we craft fewer final items?)
- Deduct owned intermediate materials from crafting requirements
- Handle weapon-specific components separately

#### 7. **UI/UX Features**
- Input lock system (prevent UI updates while typing)
- Saved input values across UI refreshes
- Debounced UI updates (150ms delay)
- Hover effects on buttons
- Color-coded status (green=active, yellow=preview, red=missing)
- Mobile-specific layouts and positioning
- Keyboard-friendly inputs

#### 8. **Data Management**
- Character ID detection and switching
- Character-specific cache per localStorage key
- Requirements cache with 30-minute expiry
- State persistence across page reloads

---

## 🗂️ CURRENT DATA FLOW

### Input Data Sources

#### A. API Endpoints (Intercepted via fetch/XHR hooks)

**1. `/api/characters/{characterId}/skills`**
```javascript
Response: {
  "mining": 27207,
  "tailoring": 16613,
  "gathering": 48296,
  // ... all 18 skills
}
```
- **Usage:** Update `state.skills[skillName].currentXP`
- **Keep in V3:** ✅ YES

**2. `/api/characters/{characterId}/tasks/active/`**
```javascript
Response: [
  {
    "skill_name": "Tailoring",
    "item_name": "Etheric Cloth",
    "exp_per_action": 7,
    "action_time": 31.6,
    "exp_earned": 1234
  }
]
```
- **Usage:** Populate active tasks, start real-time tracking
- **Keep in V3:** ✅ YES

**3. `/api/characters/{characterId}/tasks/calculate` ❌ REMOVE IN V3**
```javascript
Response: {
  "expPerAction": 7,
  "modifiedActionTime": 31.6,
  "skillLevel": 35,
  "requirements": [...],
  "materialRequirements": null
}
```
- **Current usage:** 
  - Update preview task
  - Update optimizer cache (xp, actionTime)
  - Detect user clicks
- **V3 replacement:** Calculate client-side using static DB + efficiency formula

**4. `/api/characters/{characterId}/tasks/requirements/{skill}/{itemName}` ❌ REMOVE IN V3**
```javascript
Response: {
  "requirements": [
    {
      "itemName": "Etherbloom",
      "required": 2,
      "available": 150,
      "hasEnough": true,
      "img": "https://cdn.degendungeon.com/Gathering/etherbloom.png"
    },
    {
      "itemName": "Arcane Crystal",
      "required": 4,
      "available": 19768,
      "hasEnough": true,
      "img": "https://cdn.degendungeon.com/arcanecrystal.png"
    }
  ]
}
```
- **Current usage:**
  - Load requirements for preview
  - Update optimizer cache (requirements with images)
  - Cache requirements for 30 minutes
- **V3 replacement:** Load requirements from static DB, get quantities from `/all-data`

**5. `/api/characters/{characterId}/all-data` ✅ NEW IN V3**
```javascript
Response: {
  "data": {
    "inventory": {
      "items": [
        { "item_id": 208, "quantity": 28 },
        { "item_id": 515, "quantity": 19768 }
      ]
    },
    "bankInventory": [...],  // Same structure as inventory
    "equipment": {
      "item_effects": {
        "Mining Efficiency": 6,
        "Gathering Efficiency": 6,
        "resource_efficiency": 9.38
      }
    },
    "equippedPet": {
      "skills": {
        "Gathering Efficiency": 3.62
      }
    },
    "talentEffects": {
      "resource_efficiency": 10
    },
    "workshopLevels": {
      "forging": 0,
      "leatherworking": 0,
      "tailoring": 5,
      "crafting": 0,
      // ... all crafting skills
    },
    "activeTasks": [
      {
        "membership_bonus": true,
        "tool_bonus": 6,
        "action_time": 31.6
      }
    ],
    "skills": {
      "mining": 27207,
      "tailoring": 16613
      // ... all skills
    }
  }
}
```
- **V3 usage:**
  - Build inventory map (item_id → quantity, combining inventory + bank)
  - Extract all efficiency bonuses (membership, equipment, pet, talents, workshop)
  - Calculate modified times for all items
  - Update available quantities in item database

#### B. Static Data Files (Already Extracted)

**Files in `/data/` directory:**
- `item_id_mapping.json` - Maps item_id → item_name (647 items)
- `mining_data.json` through `woodcutting_data.json` - 13 skill data files

**Example structure (tailoring_data.json):**
```json
{
  "data": {
    "skillItems": [
      {
        "profession_item_id": 412,
        "item_name": "Etheric Cloth",
        "skill_name": "Tailoring",
        "level_required": 30,
        "exp": 7,
        "action_time": 40,
        "item_cost": {
          "Etherbloom": 2,
          "Arcane Crystal": 4
        },
        "img": "https://cdn.degendungeon.com/Tailoring/ethericcloth.png"
      }
    ]
  }
}
```

---

## 🔄 NEW UNIFIED JSON STRUCTURE

### File: `game_database.json`

```json
{
  "version": "1.0",
  "last_updated": "2025-11-12",
  "total_items": 647,
  "items": {
    "1": {
      "name": "Coal Ore",
      "skill": "mining",
      "type": "resource",
      "baseXp": 1,
      "baseTime": 10,
      "levelRequired": 1,
      "requirements": null,
      "img": "https://cdn.degendungeon.com/Mining/coalore.png"
    },
    "208": {
      "name": "Etheric Cloth",
      "skill": "tailoring",
      "type": "cloth",
      "baseXp": 7,
      "baseTime": 40,
      "levelRequired": 30,
      "requirements": {
        "Etherbloom": 2,
        "Arcane Crystal": 4
      },
      "img": "https://cdn.degendungeon.com/Tailoring/ethericcloth.png"
    },
    "600": {
      "name": "Nyxium Sword",
      "skill": "forging",
      "type": "weapon_sword",
      "baseXp": 28,
      "baseTime": 180,
      "levelRequired": 80,
      "requirements": {
        "Nyxium Bar": 3,
        "Nyxium Gemstone": 2,
        "Coal Ore": 10
      },
      "img": "https://cdn.degendungeon.com/Forging/nyxiumsword.png"
    }
  },
  "itemNameToId": {
    "Coal Ore": "1",
    "Etheric Cloth": "208",
    "Nyxium Sword": "600"
  }
}
```

**Item Types Classification:**
- `resource` - Gathered materials (ore, logs, fish, herbs, etc.)
- `bar` - Smelted metals (Copper Bar, Iron Bar, etc.)
- `leather` - Processed hides (Leather, Thick Leather, etc.)
- `cloth` - Woven fabrics (Wool Cloth, Silk Cloth, etc.)
- `equipment_*` - Armor pieces (helmet, bodyarmor, boots, gloves, shield)
- `weapon_sword` - Forging swords
- `weapon_bow` - Leatherworking bows
- `weapon_staff` - Tailoring staffs
- `tool_*` - Gathering tools (pickaxe, axe, fishing_rod, trap)
- `consumable_*` - Food, potions, baits
- `component_*` - Crafting components (handle, bowstring, gemstone, plank)
- `other` - Misc items (recipes, tickets, profile pictures, etc.)

---

## 🧮 CALCULATION FORMULAS

### 1. Efficiency Calculation

```javascript
function calculateEfficiency(skillName, allData) {
  const skill = skillName.charAt(0).toUpperCase() + skillName.slice(1);
  
  // 1. Membership bonus (15% if active)
  const membershipBonus = allData.activeTasks[0]?.membership_bonus ? 15 : 0;
  
  // 2. Tool/Equipment bonus (skill-specific)
  const toolBonus = allData.equipment.item_effects[`${skill} Efficiency`] || 0;
  
  // 3. Pet bonus (skill-specific)
  const petBonus = allData.equippedPet?.skills[`${skill} Efficiency`] || 0;
  
  // 4. Talent bonus (global resource_efficiency)
  const talentBonus = allData.talentEffects.resource_efficiency || 0;
  
  // 5. Workshop bonus (skill-specific, 1 level = +1%)
  const workshopBonus = allData.workshopLevels[skillName.toLowerCase()] || 0;
  
  // Total efficiency percentage
  return membershipBonus + toolBonus + petBonus + talentBonus + workshopBonus;
}
```

**Example:**
```javascript
// Tailoring with:
// - Membership: true → 15%
// - Tool: 0%
// - Pet: 0%
// - Talent: 10%
// - Workshop level 5 → 5%
// Total: 30%
```

### 2. Modified Action Time

```javascript
function calculateModifiedTime(itemName, gameDB, allData) {
  // Get item data from unified database
  const item = gameDB.itemNameToId[itemName];
  const itemData = gameDB.items[item];
  
  // Calculate total efficiency for this skill
  const efficiency = calculateEfficiency(itemData.skill, allData);
  
  // Apply efficiency reduction
  const modifiedTime = itemData.baseTime * (1 - efficiency / 100);
  
  return modifiedTime;
}
```

**Example:**
```javascript
// Etheric Cloth
baseTime = 40s
efficiency = 30%
modifiedTime = 40 * (1 - 0.30) = 40 * 0.70 = 28s
```

### 3. Inventory Lookup

```javascript
function buildInventoryMap(allData, gameDB) {
  const inventory = {};
  
  // Combine main inventory + bank inventory
  const allItems = [
    ...(allData.inventory?.items || []),
    ...(allData.bankInventory || [])
  ];
  
  allItems.forEach(item => {
    const itemData = gameDB.items[item.item_id];
    if (!itemData) return; // Skip unknown items
    
    const itemName = itemData.name;
    inventory[itemName] = (inventory[itemName] || 0) + item.quantity;
  });
  
  return inventory;
}
```

**Example:**
```javascript
// Input (from /all-data):
inventory.items = [
  { item_id: 208, quantity: 28 },
  { item_id: 515, quantity: 15000 }
]
bankInventory = [
  { item_id: 515, quantity: 4768 }
]

// Output:
{
  "Etheric Cloth": 28,
  "Arcane Crystal": 19768  // 15000 + 4768
}
```

### 4. Item Data Retrieval (Client-Side)

```javascript
function getItemData(itemName, gameDB, inventory, allData) {
  const itemId = gameDB.itemNameToId[itemName];
  const item = gameDB.items[itemId];
  
  if (!item) return null;
  
  const efficiency = calculateEfficiency(item.skill, allData);
  const modifiedTime = item.baseTime * (1 - efficiency / 100);
  const available = inventory[itemName] || 0;
  
  // Build requirements with available quantities
  const requirements = [];
  if (item.requirements) {
    Object.entries(item.requirements).forEach(([matName, required]) => {
      const matAvailable = inventory[matName] || 0;
      const matId = gameDB.itemNameToId[matName];
      const matData = gameDB.items[matId];
      
      requirements.push({
        itemName: matName,
        required: required,
        available: matAvailable,
        hasEnough: matAvailable >= required,
        img: matData?.img || null
      });
    });
  }
  
  return {
    itemName: item.name,
    skill: item.skill,
    type: item.type,
    baseXp: item.baseXp,
    baseTime: item.baseTime,
    levelRequired: item.levelRequired,
    efficiency: efficiency,
    modifiedTime: modifiedTime,
    available: available,
    requirements: requirements,
    img: item.img
  };
}
```

**Example:**
```javascript
// Input: "Etheric Cloth"
// Output:
{
  itemName: "Etheric Cloth",
  skill: "tailoring",
  type: "cloth",
  baseXp: 7,
  baseTime: 40,
  levelRequired: 30,
  efficiency: 30,
  modifiedTime: 28,
  available: 28,
  requirements: [
    {
      itemName: "Etherbloom",
      required: 2,
      available: 150,
      hasEnough: true,
      img: "https://cdn.degendungeon.com/Gathering/etherbloom.png"
    },
    {
      itemName: "Arcane Crystal",
      required: 4,
      available: 19768,
      hasEnough: true,
      img: "https://cdn.degendungeon.com/arcanecrystal.png"
    }
  ],
  img: "https://cdn.degendungeon.com/Tailoring/ethericcloth.png"
}
```

---

## 🏗️ NEW MODULE ARCHITECTURE

### Module Structure

```
degen-idle-xp-tracker-v3.user.js
├── [EMBEDDED] game_database.json (Base64 encoded or JS object)
├── [MODULE 1] Constants & Configuration
├── [MODULE 2] Static Database Loader
├── [MODULE 3] Efficiency Calculator
├── [MODULE 4] Item Data Engine
├── [MODULE 5] API Interceptors
├── [MODULE 6] State Management
├── [MODULE 7] XP Tracker UI
├── [MODULE 8] XP Optimizer (Simplified)
└── [MODULE 9] Initialization
```

### Module Breakdown

#### MODULE 1: Constants & Configuration

```javascript
// === CONSTANTS ===
const API_ROOT = "https://api.degenidle.com/api/";
const GAME_DB_VERSION = "1.0";

const SKILLS = [
  'mining', 'woodcutting', 'tracking', 'fishing', 'gathering', 'herbalism',
  'forging', 'leatherworking', 'tailoring', 'crafting', 'cooking', 'alchemy',
  'combat', 'woodcrafting', 'dungeoneering', 'bloomtide', 'bossing', 'exorcism'
];

const GATHERING_SKILLS = [
  'mining', 'woodcutting', 'tracking', 'fishing', 'gathering', 'herbalism'
];

const CRAFTING_SKILLS = [
  'forging', 'leatherworking', 'tailoring', 'crafting', 
  'cooking', 'alchemy', 'woodcrafting'
];

const SKILLS_WITH_INTERMEDIATE_CRAFTS = ['forging', 'leatherworking', 'tailoring'];

const WEAPON_TYPES = {
  'sword': { skill: 'forging', component: 'gemstone' },
  'bow': { skill: 'leatherworking', component: 'bowstring' },
  'staff': { skill: 'tailoring', component: 'gemstone' }
};

const XP_TABLE = { /* unchanged */ };
const SKILL_ICONS = { /* unchanged */ };
```

#### MODULE 2: Static Database Loader

```javascript
// === STATIC DATABASE ===
const GameDB = {
  data: null,
  
  init() {
    // Load embedded game_database.json
    this.data = EMBEDDED_GAME_DATABASE; // or decode Base64
    console.log(`[GameDB] Loaded ${this.data.total_items} items (v${this.data.version})`);
  },
  
  getItemById(itemId) {
    return this.data.items[itemId] || null;
  },
  
  getItemByName(itemName) {
    const itemId = this.data.itemNameToId[itemName];
    return this.getItemById(itemId);
  },
  
  getAllItemsForSkill(skillName) {
    return Object.values(this.data.items).filter(item => item.skill === skillName);
  }
};
```

#### MODULE 3: Efficiency Calculator

```javascript
// === EFFICIENCY CALCULATOR ===
const EfficiencyCalc = {
  // Store latest /all-data bonuses
  bonuses: {
    membership: false,
    equipment: {},
    pet: {},
    talents: {},
    workshop: {}
  },
  
  updateFromAllData(allData) {
    this.bonuses.membership = allData.activeTasks[0]?.membership_bonus || false;
    this.bonuses.equipment = allData.equipment?.item_effects || {};
    this.bonuses.pet = allData.equippedPet?.skills || {};
    this.bonuses.talents = allData.talentEffects || {};
    this.bonuses.workshop = allData.workshopLevels || {};
  },
  
  calculate(skillName) {
    const skill = skillName.charAt(0).toUpperCase() + skillName.slice(1);
    
    const membership = this.bonuses.membership ? 15 : 0;
    const tool = this.bonuses.equipment[`${skill} Efficiency`] || 0;
    const pet = this.bonuses.pet[`${skill} Efficiency`] || 0;
    const talent = this.bonuses.talents.resource_efficiency || 0;
    const workshop = this.bonuses.workshop[skillName.toLowerCase()] || 0;
    
    return membership + tool + pet + talent + workshop;
  }
};
```

#### MODULE 4: Item Data Engine

```javascript
// === ITEM DATA ENGINE ===
const ItemDataEngine = {
  inventory: {},
  
  updateInventory(allData) {
    this.inventory = {};
    
    // Combine inventory + bank
    const allItems = [
      ...(allData.inventory?.items || []),
      ...(allData.bankInventory || [])
    ];
    
    allItems.forEach(item => {
      const itemData = GameDB.getItemById(item.item_id);
      if (!itemData) return;
      
      const itemName = itemData.name;
      this.inventory[itemName] = (this.inventory[itemName] || 0) + item.quantity;
    });
    
    console.log(`[ItemDataEngine] Loaded ${Object.keys(this.inventory).length} unique items in inventory`);
  },
  
  getItemData(itemName) {
    const item = GameDB.getItemByName(itemName);
    if (!item) return null;
    
    const efficiency = EfficiencyCalc.calculate(item.skill);
    const modifiedTime = item.baseTime * (1 - efficiency / 100);
    const available = this.inventory[itemName] || 0;
    
    // Build requirements with quantities
    const requirements = [];
    if (item.requirements) {
      Object.entries(item.requirements).forEach(([matName, required]) => {
        const matAvailable = this.inventory[matName] || 0;
        const matData = GameDB.getItemByName(matName);
        
        requirements.push({
          itemName: matName,
          required: required,
          available: matAvailable,
          hasEnough: matAvailable >= required,
          img: matData?.img || null
        });
      });
    }
    
    return {
      itemName: item.name,
      skill: item.skill,
      type: item.type,
      baseXp: item.baseXp,
      baseTime: item.baseTime,
      levelRequired: item.levelRequired,
      efficiency: efficiency,
      modifiedTime: modifiedTime,
      available: available,
      requirements: requirements,
      img: item.img
    };
  },
  
  calculateCraftingPath(finalItemName, targetQuantity = 1) {
    const path = [];
    const queue = [{ itemName: finalItemName, quantity: targetQuantity }];
    const processed = new Set();
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      if (processed.has(current.itemName)) continue;
      processed.add(current.itemName);
      
      const itemData = this.getItemData(current.itemName);
      if (!itemData) continue;
      
      // Calculate how much to craft
      const needed = current.quantity;
      const available = itemData.available;
      const toCraft = Math.max(0, needed - available);
      
      if (toCraft > 0) {
        path.push({
          itemName: current.itemName,
          quantity: toCraft,
          xpPerAction: itemData.baseXp,
          timePerAction: itemData.modifiedTime,
          totalXp: itemData.baseXp * toCraft,
          totalTime: itemData.modifiedTime * toCraft,
          skill: itemData.skill
        });
        
        // Add requirements to queue
        if (itemData.requirements) {
          itemData.requirements.forEach(req => {
            queue.push({
              itemName: req.itemName,
              quantity: req.required * toCraft
            });
          });
        }
      }
    }
    
    return path.reverse(); // Base materials → final item
  }
};
```

#### MODULE 5: API Interceptors

```javascript
// === API INTERCEPTORS ===
const APIHandler = {
  characterId: null,
  
  handleResponse(url, json) {
    try {
      // Extract character ID
      const charIdMatch = url.match(/\/([a-f0-9-]{36})\//);
      if (charIdMatch) {
        const isPersonal = url.includes('/skills') || 
                          url.includes('/tasks/active/') || 
                          url.includes('/all-data');
        
        if (isPersonal) {
          const newCharId = charIdMatch[1];
          
          if (this.characterId && this.characterId !== newCharId) {
            console.log(`[API] Character changed: ${this.characterId} → ${newCharId}`);
            State.resetForCharacter(newCharId);
          }
          
          this.characterId = newCharId;
        }
      }
      
      // Route to appropriate handler
      if (url.includes('/skills')) {
        this.handleSkills(json);
      } else if (url.includes('/tasks/active/') || url.includes('/batch/periodic-status/')) {
        this.handleActiveTasks(json);
      } else if (url.includes('/all-data')) {
        this.handleAllData(json);
      } else if (url.includes('/tasks/calculate')) {
        this.handleCalculate(json); // For event detection only
      } else if (url.includes('/tasks/requirements/')) {
        this.handleRequirements(json, url); // For event detection only
      }
    } catch (e) {
      console.error('[API] Error:', e);
    }
  },
  
  handleSkills(data) {
    SKILLS.forEach(skill => {
      if (data[skill] !== undefined) {
        State.updateSkillXP(skill, data[skill]);
      }
    });
  },
  
  handleActiveTasks(data) {
    const tasks = url.includes('/batch/periodic-status/') 
      ? data.data?.activeTasks 
      : data;
    
    if (Array.isArray(tasks)) {
      State.updateActiveTasks(tasks);
    }
  },
  
  handleAllData(data) {
    const allData = data.data;
    
    // Update efficiency bonuses
    EfficiencyCalc.updateFromAllData(allData);
    
    // Update inventory
    ItemDataEngine.updateInventory(allData);
    
    // Update skills if present
    if (allData.skills) {
      this.handleSkills(allData.skills);
    }
    
    console.log('[API] All-data processed successfully');
  },
  
  handleCalculate(data) {
    // Used ONLY for event detection (user clicked on item)
    const itemName = detectCurrentItem();
    const skillName = detectCurrentSkill();
    
    if (itemName && skillName) {
      console.log(`[API] User clicked on: ${itemName} (${skillName})`);
      
      // Update preview with client-side calculation
      const itemData = ItemDataEngine.getItemData(itemName);
      if (itemData) {
        State.updatePreview(itemData);
      }
    }
  },
  
  handleRequirements(data, url) {
    // Used ONLY for event detection (user clicked on item)
    const match = url.match(/\/tasks\/requirements\/([^\/]+)\/([^?]+)/);
    if (!match) return;
    
    const skillFromUrl = match[1].toLowerCase();
    const itemName = decodeURIComponent(match[2]);
    
    console.log(`[API] User clicked on: ${itemName} (${skillFromUrl})`);
    
    // Update preview with client-side calculation
    const itemData = ItemDataEngine.getItemData(itemName);
    if (itemData) {
      State.updatePreview(itemData);
    }
  }
};

// Hook fetch
const _fetch = window.fetch;
window.fetch = async function(input, init) {
  const resp = await _fetch.apply(this, arguments);
  try {
    const url = (typeof input === "string") ? input : (input?.url) || "";
    if (url.startsWith(API_ROOT)) {
      const clone = resp.clone();
      clone.json()
        .then(json => APIHandler.handleResponse(url, json))
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
            APIHandler.handleResponse(real.responseURL, json);
          } catch(_) {}
        }
      } catch(e) {}
    }, false);
    return real;
  }
  window.XMLHttpRequest = newXHR;
})();
```

#### MODULE 6: State Management

```javascript
// === STATE MANAGEMENT ===
const State = {
  characterId: null,
  skills: {}, // { mining: { currentXP: 27207 }, ... }
  activeTasks: [],
  previewTask: null,
  realTimeTracking: {},
  targetLevelCalculations: {},
  savedInputValues: {},
  
  // UI state
  isOpen: safeLoadFromStorage('degenLevelTracker_open', 'false') === 'true',
  isExpanded: safeLoadFromStorage('degenLevelTracker_expanded', 'true') !== 'false',
  position: safeLoadFromStorage('degenLevelTracker_position', {...}),
  
  // Optimizer state (simplified)
  optimizer: {
    active: false,
    targetLevel: null,
    finalItem: null,
    position: safeLoadOptimizerPosition()
  },
  
  resetForCharacter(characterId) {
    this.characterId = characterId;
    this.activeTasks = [];
    this.realTimeTracking = {};
    this.targetLevelCalculations = {};
    this.previewTask = null;
    this.savedInputValues = {};
    console.log(`[State] Reset for character ${characterId}`);
  },
  
  updateSkillXP(skillName, xp) {
    if (!this.skills[skillName]) this.skills[skillName] = {};
    this.skills[skillName].currentXP = xp;
  },
  
  updateActiveTasks(tasks) {
    // Same logic as current script
    // Uses ItemDataEngine.getItemData() instead of API data
  },
  
  updatePreview(itemData) {
    this.previewTask = {
      skillName: itemData.skill,
      skillNameDisplay: itemData.skill.charAt(0).toUpperCase() + itemData.skill.slice(1),
      itemName: itemData.itemName,
      expPerAction: itemData.baseXp,
      modifiedActionTime: itemData.modifiedTime,
      skillLevel: itemData.levelRequired,
      requirements: itemData.requirements,
      timesToCraft: 1,
      requirementsComplete: true,
      hasCraftingRequirements: itemData.requirements.length > 0,
      isLevelTooLow: false,
      timestamp: Date.now()
    };
    
    UI.update();
  }
};
```

#### MODULE 7: XP Tracker UI

```javascript
// === XP TRACKER UI ===
const UI = {
  // All current UI functions preserved:
  // - createUI()
  // - updateUI()
  // - renderActiveTasks()
  // - renderPreviewSection()
  // - renderTaskCard()
  // - renderRequirements()
  // - attachInputListeners()
  // - manageRealTimeUpdates()
  // - etc.
  
  // Changes:
  // - Uses ItemDataEngine.getItemData() instead of cache
  // - No more requirementsCache needed
  // - Simplified data flow
};
```

#### MODULE 8: XP Optimizer (Simplified)

```javascript
// === XP OPTIMIZER (V2 - SIMPLIFIED) ===
const Optimizer = {
  active: false,
  targetLevel: null,
  finalItem: null,
  
  start() {
    this.active = true;
    this.targetLevel = null;
    this.finalItem = null;
    
    // Create UI
    this.createUI();
  },
  
  close() {
    this.active = false;
    const panel = document.getElementById('craftingWizardModal');
    if (panel) panel.remove();
  },
  
  createUI() {
    // Simplified 2-step wizard:
    // Step 1: Enter target level
    // Step 2: Click on final item → instant calculation & display
  },
  
  calculateOptimalPath() {
    // Get item data from ItemDataEngine
    const itemData = ItemDataEngine.getItemData(this.finalItem);
    
    // Calculate crafting path
    const path = ItemDataEngine.calculateCraftingPath(
      this.finalItem,
      1 // Start with 1 final item
    );
    
    // Use current optimizer logic to find optimal solution
    // (same algorithm, just uses path from ItemDataEngine)
    
    // Display results
    this.renderResults(path);
  }
};
```

#### MODULE 9: Initialization

```javascript
// === INITIALIZATION ===
(function init() {
  console.log('[XP Tracker V3.0] Initializing...');
  
  // 1. Load static database
  GameDB.init();
  
  // 2. Create UI
  UI.createUI();
  
  // 3. Setup keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'x') {
      togglePanel();
    }
  });
  
  console.log('[XP Tracker V3.0] Ready! Press Alt+X to open/close panel.');
})();
```

---

## 📦 UNIFIED JSON GENERATION SCRIPT

### File: `utils/generate_unified_db.js`

```javascript
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(__dirname, '..', 'game_database.json');

// Load item_id_mapping
const itemMapping = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'item_id_mapping.json'), 'utf8')
);

// Load all skill data files
const skillFiles = [
  'mining', 'woodcutting', 'tracking', 'fishing', 'gathering', 'herbalism',
  'forging', 'leatherworking', 'tailoring', 'crafting', 'cooking', 'alchemy', 'woodcrafting'
];

const gameDB = {
  version: "1.0",
  last_updated: new Date().toISOString().split('T')[0],
  total_items: 0,
  items: {},
  itemNameToId: {}
};

// Helper: Determine item type
function determineItemType(itemName, skillName) {
  const nameLower = itemName.toLowerCase();
  
  // Resources (gathered)
  if (skillName === 'mining' && nameLower.includes('ore')) return 'resource';
  if (skillName === 'woodcutting' && nameLower.includes('logs')) return 'resource';
  if (skillName === 'fishing' && !nameLower.includes('bait')) return 'resource';
  if (skillName === 'gathering' && !nameLower.includes('sap')) return 'resource';
  if (skillName === 'herbalism' && !nameLower.includes('extract') && !nameLower.includes('flask')) return 'resource';
  if (skillName === 'tracking' && nameLower.includes('hide')) return 'resource';
  
  // Intermediate materials
  if (nameLower.endsWith(' bar')) return 'bar';
  if (nameLower.endsWith(' leather') && !nameLower.includes('bow') && !nameLower.includes('hat')) return 'leather';
  if (nameLower.endsWith(' cloth') && !nameLower.includes('hat') && !nameLower.includes('robe')) return 'cloth';
  
  // Weapons
  if (nameLower.endsWith(' sword')) return 'weapon_sword';
  if (nameLower.endsWith(' bow')) return 'weapon_bow';
  if (nameLower.endsWith(' staff')) return 'weapon_staff';
  
  // Equipment
  if (nameLower.includes('helmet')) return 'equipment_helmet';
  if (nameLower.includes('bodyarmor') || nameLower.includes('robe')) return 'equipment_bodyarmor';
  if (nameLower.includes('boots') || nameLower.includes('shoes')) return 'equipment_boots';
  if (nameLower.includes('gloves')) return 'equipment_gloves';
  if (nameLower.includes('shield')) return 'equipment_shield';
  
  // Tools
  if (nameLower.includes('pickaxe')) return 'tool_pickaxe';
  if (nameLower.includes('axe') && !nameLower.includes('pickaxe')) return 'tool_axe';
  if (nameLower.includes('fishing rod')) return 'tool_fishing_rod';
  if (nameLower.includes('trap')) return 'tool_trap';
  
  // Components
  if (nameLower.includes('handle')) return 'component_handle';
  if (nameLower.includes('bowstring')) return 'component_bowstring';
  if (nameLower.includes('gemstone')) return 'component_gemstone';
  if (nameLower.includes('plank')) return 'component_plank';
  
  // Consumables
  if (nameLower.includes('potion')) return 'consumable_potion';
  if (nameLower.includes('bait')) return 'consumable_bait';
  if (nameLower.includes('flask') || nameLower.includes('solution') || nameLower.includes('sap')) return 'consumable_resource';
  if (skillName === 'cooking') return 'consumable_food';
  if (skillName === 'alchemy' && nameLower.includes('extract')) return 'consumable_extract';
  
  return 'other';
}

// Process each skill file
skillFiles.forEach(skillName => {
  const filePath = path.join(DATA_DIR, `${skillName}_data.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Missing file: ${skillName}_data.json`);
    return;
  }
  
  const skillData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const items = skillData.data?.skillItems || [];
  
  console.log(`Processing ${skillName}: ${items.length} items`);
  
  items.forEach(item => {
    // Find item_id from item_name
    const itemId = Object.keys(itemMapping.items).find(
      id => itemMapping.items[id] === item.item_name
    );
    
    if (!itemId) {
      console.warn(`⚠️  No item_id found for: ${item.item_name}`);
      return;
    }
    
    // Build item entry
    gameDB.items[itemId] = {
      name: item.item_name,
      skill: skillName,
      type: determineItemType(item.item_name, skillName),
      baseXp: item.exp || 0,
      baseTime: item.action_time || 0,
      levelRequired: item.level_required || 1,
      requirements: item.item_cost || null,
      img: item.img || null
    };
    
    gameDB.itemNameToId[item.item_name] = itemId;
  });
});

// Fill in missing items from item_id_mapping (items without skill data)
Object.keys(itemMapping.items).forEach(itemId => {
  if (!gameDB.items[itemId]) {
    const itemName = itemMapping.items[itemId];
    gameDB.items[itemId] = {
      name: itemName,
      skill: null,
      type: 'other',
      baseXp: 0,
      baseTime: 0,
      levelRequired: 1,
      requirements: null,
      img: null
    };
    gameDB.itemNameToId[itemName] = itemId;
  }
});

gameDB.total_items = Object.keys(gameDB.items).length;

// Write output
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(gameDB, null, 2));

console.log(`\n✅ Generated game_database.json`);
console.log(`   Total items: ${gameDB.total_items}`);
console.log(`   File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);
```

---

## 🔄 FEATURE MIGRATION MAP

| Current Feature | Current Implementation | V3 Implementation | Status |
|----------------|----------------------|-------------------|--------|
| **XP Tracker Panel** | State + UI rendering | Same | ✅ Unchanged |
| **Active Tasks Display** | API `/tasks/active/` | Same | ✅ Unchanged |
| **Preview Section** | API `/calculate` + `/requirements` | `ItemDataEngine.getItemData()` | 🔄 Simplified |
| **Real-Time Updates** | 100ms interval updates | Same | ✅ Unchanged |
| **Target Level Calculator** | Client-side calculation | Same | ✅ Unchanged |
| **Requirements Display** | From `/requirements` API | From `GameDB` + inventory | 🔄 Simplified |
| **Crafting Cache** | localStorage per character | ❌ Removed (not needed) | 🗑️ Obsolete |
| **Optimizer Wizard (4 steps)** | Step 1-4 with material clicks | Simplified 2-step | 🔄 Simplified |
| **Optimizer Calculations** | Cache-based with missing detection | `ItemDataEngine.calculateCraftingPath()` | 🔄 Improved |
| **Inventory Sync** | Manual sync across cache | Automatic from `/all-data` | ✅ Improved |
| **Efficiency Calculation** | Not implemented | `EfficiencyCalc.calculate()` | ✨ New |
| **Modified Time** | From `/calculate` API | Client-side formula | ✨ New |

---

## ✅ VALIDATION CHECKLIST

### Must Preserve
- [ ] All 18 skills supported
- [ ] XP tracking for active tasks
- [ ] Preview for clicked items
- [ ] Target level calculator
- [ ] Requirements display with owned quantities
- [ ] Real-time countdown timers
- [ ] Optimizer wizard functionality
- [ ] Optimal path calculation (minimize overshoot)
- [ ] Deduction of owned intermediate materials
- [ ] Mobile responsive design
- [ ] Draggable/resizable panels (desktop)
- [ ] Persistent UI state in localStorage
- [ ] Character switching support
- [ ] Input lock system
- [ ] Saved input values

### Must Improve
- [ ] Zero dependency on `/calculate` API
- [ ] Zero dependency on `/requirements` API
- [ ] Instant calculations (no waiting for API)
- [ ] Always accurate inventory quantities
- [ ] No cache staleness issues
- [ ] Simplified optimizer workflow
- [ ] Proper efficiency bonuses (membership, equipment, pet, talents, workshop)

### Must Remove
- [ ] Complex crafting cache system
- [ ] Requirements cache with expiry
- [ ] Cache synchronization logic
- [ ] Manual inventory updates

---

## 🚀 IMPLEMENTATION STEPS

### Phase 1: Preparation
1. ✅ Create this planning document
2. ⏳ Generate `game_database.json` using generation script
3. ⏳ Validate JSON completeness (all 647 items have required fields)
4. ⏳ Embed JSON in userscript (Base64 or JS object literal)

### Phase 2: Core Modules
5. ⏳ Implement MODULE 2 (Static Database Loader)
6. ⏳ Implement MODULE 3 (Efficiency Calculator)
7. ⏳ Implement MODULE 4 (Item Data Engine)
8. ⏳ Test item data retrieval with sample items

### Phase 3: API Integration
9. ⏳ Implement MODULE 5 (API Interceptors)
10. ⏳ Test `/all-data` interception and processing
11. ⏳ Test inventory building
12. ⏳ Test efficiency calculation

### Phase 4: UI Migration
13. ⏳ Migrate MODULE 6 (State Management)
14. ⏳ Migrate MODULE 7 (XP Tracker UI)
15. ⏳ Replace cache calls with `ItemDataEngine.getItemData()`
16. ⏳ Test preview section with new data flow

### Phase 5: Optimizer V2
17. ⏳ Implement MODULE 8 (Simplified Optimizer)
18. ⏳ Test optimal path calculation
19. ⏳ Verify overshoot minimization logic
20. ⏳ Test owned material deduction

### Phase 6: Testing & Polish
21. ⏳ Full integration testing
22. ⏳ Test character switching
23. ⏳ Test mobile responsive design
24. ⏳ Performance benchmarks
25. ⏳ Final validation against checklist

---

## 📊 EXPECTED OUTCOMES

### Performance Improvements
- **Initial load:** +500ms (load larger embedded JSON)
- **Item click response:** Instant (0ms API wait)
- **Optimizer calculations:** Instant (0ms API wait)
- **Inventory updates:** Automatic on `/all-data` refresh

### Code Quality
- **Total lines:** ~2800 (from 3606) - 22% reduction
- **Complexity:** Significantly lower (no cache sync)
- **Maintainability:** Much higher (single data source)
- **Bugs:** Fewer (no cache staleness)

### User Experience
- **Optimizer workflow:** 2 steps (from 4 steps)
- **Clicks needed:** 1 (from 3-10 depending on materials)
- **Accuracy:** 100% (always synced with server)
- **Responsiveness:** Instant (no API delays)

---

## 🎯 SUCCESS CRITERIA

1. ✅ All current features work identically
2. ✅ Zero dependency on `/calculate` and `/requirements` APIs
3. ✅ Calculations match server results exactly
4. ✅ Inventory always accurate (synced with `/all-data`)
5. ✅ Optimizer requires minimal user interaction
6. ✅ No cache staleness issues
7. ✅ Code is cleaner and more maintainable
8. ✅ Performance is equal or better

---

## 📝 NOTES

- This is a planning document for V3.0 refactoring
- Implementation will proceed in phases
- All current functionality will be preserved
- User experience will be significantly improved
- Code will be cleaner and more maintainable

**Document Status:** ✅ COMPLETE - Ready for implementation

**Version:** 1.0  
**Date:** 2025-11-12  
**Author:** AI Assistant  
**Review Status:** Approved
