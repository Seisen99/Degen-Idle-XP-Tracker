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
  if (nameLower.endsWith(' plank')) return 'component_plank';
  
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
  if (nameLower.includes('hat')) return 'equipment_hat';
  
  // Tools
  if (nameLower.includes('pickaxe')) return 'tool_pickaxe';
  if (nameLower.includes('axe') && !nameLower.includes('pickaxe')) return 'tool_axe';
  if (nameLower.includes('fishing rod')) return 'tool_fishing_rod';
  if (nameLower.includes('trap')) return 'tool_trap';
  
  // Components
  if (nameLower.includes('handle')) return 'component_handle';
  if (nameLower.includes('bowstring')) return 'component_bowstring';
  if (nameLower.includes('gemstone')) return 'component_gemstone';
  
  // Consumables
  if (nameLower.includes('potion')) return 'consumable_potion';
  if (nameLower.includes('bait')) return 'consumable_bait';
  if (nameLower.includes('flask') || nameLower.includes('solution') || nameLower.includes('sap')) return 'consumable_resource';
  if (skillName === 'cooking') return 'consumable_food';
  if (skillName === 'alchemy' && nameLower.includes('extract')) return 'consumable_extract';
  if (nameLower.includes('pouch') || nameLower.includes('basket')) return 'equipment_bag';
  if (nameLower.includes('charm')) return 'equipment_charm';
  
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
      console.warn(`⚠️  No item_id found for: ${item.item_name} (${skillName})`);
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

// Show some stats
const skillCounts = {};
const typeCounts = {};
Object.values(gameDB.items).forEach(item => {
  if (item.skill) {
    skillCounts[item.skill] = (skillCounts[item.skill] || 0) + 1;
  }
  typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
});

console.log(`\n📊 Items per skill:`);
Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).forEach(([skill, count]) => {
  console.log(`   ${skill}: ${count}`);
});

console.log(`\n📦 Items per type:`);
Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`   ${type}: ${count}`);
});
