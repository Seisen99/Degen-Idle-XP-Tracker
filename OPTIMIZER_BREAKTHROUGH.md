# Optimizer Breakthrough - Complete Data Autonomy

## 🎯 Discovery Summary

The optimizer can be **100% autonomous** without needing `/calculate` or `/requirements` API calls. All necessary data is available through:
1. Static JSON files from localStorage (already extracted in `/data/`)
2. Single `/all-data` API call on page load

---

## 📊 Data Sources

### 1. **Item Master Database** (`/data/item_id_mapping.json`)
**Source:** `combat_data['data']['itemData']` from localStorage

Maps API `item_id` → `item_name` for all 647 items in the game.

**Example:**
```json
{
  "208": "Etheric Cloth",
  "515": "Arcane Crystal",
  "7": "Gold Ore"
}
```

**Critical:** This resolves the ID mismatch:
- API uses `item_id` (e.g., 208)
- Skill JSONs use `profession_item_id`/`gathering_item_id` (e.g., 412)

---

### 2. **Skill Data** (`/data/{skill}_data.json`)
**Source:** `{skill}_data` from localStorage (13 files already extracted)

Contains for each item:
- `item_name`: Item name
- `skill_name`: Skill (Mining, Forging, etc.)
- `exp`: Base XP per action
- `action_time`: Base time in seconds
- `level_required`: Minimum level
- `item_cost`: Requirements `{ "Material": quantity }`
- `img`: Item image URL

**Example (tailoring_data.json):**
```json
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
```

---

### 3. **Character Data** (`/all-data` API endpoint)
**Endpoint:** `/api/characters/{characterId}/all-data`

**Contains:**

#### a) **Inventory** (`data.inventory.items`)
```json
{
  "item_id": 208,
  "quantity": 28
}
```

#### b) **Bank Inventory** (`data.bankInventory`)
Same structure as inventory.

#### c) **Equipment Efficiencies** (`data.equipment.item_effects`)
```json
{
  "Mining Efficiency": 6,
  "Gathering Efficiency": 6,
  "Woodcutting Efficiency": 6,
  "resource_efficiency": 9.38
}
```

#### d) **Pet Bonuses** (`data.equippedPet.skills`)
```json
{
  "Gathering Efficiency": 3.62
}
```

#### e) **Talent Bonuses** (`data.talentEffects`)
```json
{
  "resource_efficiency": 10
}
```

#### f) **Active Task Info** (`data.activeTasks[0]`)
```json
{
  "membership_bonus": true,
  "tool_bonus": 6,
  "action_time": 31.6
}
```

#### g) **Skills XP** (`data.skills`)
```json
{
  "mining": 27207,
  "tailoring": 16613,
  "gathering": 48296
}
```

---

## 🧮 Action Time Calculation Formula

```javascript
// Base data from skill JSON
const baseTime = skillData.action_time;  // e.g., 40 seconds
const baseXP = skillData.exp;            // e.g., 7 XP

// Efficiency from /all-data
const membershipBonus = allData.activeTasks[0].membership_bonus ? 15 : 0;
const toolBonus = allData.equipment.item_effects[`${skill} Efficiency`] || 0;
const petBonus = allData.equippedPet?.skills[`${skill} Efficiency`] || 0;
const talentBonus = allData.talentEffects.resource_efficiency || 0;

// Total efficiency
const totalEfficiency = membershipBonus + toolBonus + petBonus + talentBonus;

// Modified time
const modifiedTime = baseTime * (1 - totalEfficiency / 100);
```

**Example (Tailoring):**
- Base: 40s
- Membership: 15%
- Tool: 0%
- Pet: 0%
- Talent: 10%
- **Total: 25%** → Modified time = 40 × 0.75 = **30s**

---

## ✅ What This Enables

### **Before (Current):**
1. User clicks item → `/calculate` API call
2. User clicks item → `/requirements` API call  
3. Cache stores: XP, time, requirements, images, quantities
4. Problem: Must click EVERY intermediate item to update quantities

### **After (Autonomous):**
1. **On page load:** Intercept `/all-data` once
2. **Build complete database:**
   - Item names from `item_id_mapping.json`
   - Requirements from `{skill}_data.json`
   - Quantities from `/all-data` inventory
   - Calculate modified times using formula above
3. **Result:** Full crafting tree with accurate data, zero clicks required

---

## 🚀 Implementation Strategy

### Phase 1: Build Static Database
```javascript
// Load all skill JSONs
const ITEM_DATABASE = {};
['forging', 'tailoring', 'gathering', ...].forEach(skill => {
  const data = skillData[skill];
  data.forEach(item => {
    ITEM_DATABASE[item.item_name] = {
      skill: item.skill_name,
      xp: item.exp,
      baseTime: item.action_time,
      level: item.level_required,
      requirements: item.item_cost,
      img: item.img
    };
  });
});
```

### Phase 2: Intercept /all-data
```javascript
if (url.includes('/all-data')) {
  const data = json.data;
  
  // Build inventory map
  const inventory = {};
  data.inventory.items.forEach(item => {
    const itemName = ITEM_ID_MAPPING[item.item_id];
    inventory[itemName] = item.quantity;
  });
  
  // Store character bonuses
  state.characterBonuses = {
    membership: data.activeTasks[0]?.membership_bonus || false,
    equipment: data.equipment.item_effects,
    pet: data.equippedPet?.skills,
    talents: data.talentEffects
  };
  
  // Enrich database with quantities
  Object.keys(ITEM_DATABASE).forEach(itemName => {
    ITEM_DATABASE[itemName].available = inventory[itemName] || 0;
  });
}
```

### Phase 3: Calculate on Demand
```javascript
function getItemData(itemName) {
  const item = ITEM_DATABASE[itemName];
  const skill = item.skill;
  
  // Calculate efficiency
  const efficiency = calculateEfficiency(skill);
  
  return {
    ...item,
    modifiedTime: item.baseTime * (1 - efficiency / 100),
    hasEnough: checkRequirements(item.requirements)
  };
}
```

---

## 📁 Files Needed

✅ **Already have:**
- `/data/item_id_mapping.json` (647 items)
- `/data/{skill}_data.json` (13 skills)

❌ **Need to create:**
- Unified item database builder
- Efficiency calculator
- New optimizer logic using static data

---

## 🎯 Benefits

1. **Zero API dependency** for optimizer calculations
2. **Instant updates** when inventory changes (via /all-data refresh)
3. **No cache staleness** - always accurate
4. **Offline capable** - works with stale /all-data
5. **Simpler code** - no complex cache synchronization

---

## 🔑 Key Insight

The game's `/calculate` and `/requirements` endpoints are **redundant** for our use case. They calculate server-side what we can calculate client-side using:
- Static game data (already cached in localStorage)
- Dynamic character data (from `/all-data`)

This is a **complete paradigm shift** from reactive (wait for API) to proactive (calculate immediately).
