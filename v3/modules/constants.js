// ====================
// MODULE 1: CONSTANTS & CONFIGURATION
// ====================

const Constants = {
    // API Configuration
    API_ROOT: "https://api.degenidle.com/api/",
    GAME_DB_VERSION: "1.0",
    
    // Skills Arrays
    SKILLS: [
        'mining', 'woodcutting', 'tracking', 'fishing', 'gathering', 'herbalism',
        'forging', 'leatherworking', 'tailoring', 'crafting', 'cooking', 'alchemy',
        'combat', 'woodcrafting', 'dungeoneering', 'bloomtide', 'bossing', 'exorcism'
    ],
    
    GATHERING_SKILLS: [
        'mining', 'woodcutting', 'tracking', 'fishing', 'gathering', 'herbalism'
    ],
    
    CRAFTING_SKILLS: [
        'forging', 'leatherworking', 'tailoring', 'crafting', 
        'cooking', 'alchemy', 'woodcrafting'
    ],
    
    SKILLS_WITH_INTERMEDIATE_CRAFTS: ['forging', 'leatherworking', 'tailoring'],
    
    // Weapon Types Mapping
    WEAPON_TYPES: {
        'sword': { skill: 'forging', component: 'gemstone' },
        'bow': { skill: 'leatherworking', component: 'bowstring' },
        'staff': { skill: 'tailoring', component: 'gemstone' }
    },
    
    // XP Table for levels 1-99
    XP_TABLE: {
        1: 0,
        2: 83,
        3: 174,
        4: 276,
        5: 388,
        6: 512,
        7: 650,
        8: 801,
        9: 969,
        10: 1154,
        11: 1358,
        12: 1584,
        13: 1833,
        14: 2107,
        15: 2411,
        16: 2746,
        17: 3115,
        18: 3523,
        19: 3973,
        20: 4470,
        21: 5018,
        22: 5624,
        23: 6291,
        24: 7028,
        25: 7842,
        26: 8740,
        27: 9730,
        28: 10824,
        29: 12031,
        30: 13363,
        31: 14833,
        32: 16456,
        33: 18247,
        34: 20224,
        35: 22406,
        36: 24815,
        37: 27473,
        38: 30408,
        39: 33648,
        40: 37224,
        41: 41171,
        42: 45529,
        43: 50339,
        44: 55649,
        45: 61512,
        46: 67983,
        47: 75127,
        48: 83014,
        49: 91721,
        50: 101333,
        51: 111945,
        52: 123660,
        53: 136594,
        54: 150872,
        55: 166636,
        56: 184040,
        57: 203254,
        58: 224466,
        59: 247886,
        60: 273742,
        61: 302288,
        62: 333804,
        63: 368599,
        64: 407015,
        65: 449428,
        66: 496254,
        67: 547953,
        68: 605032,
        69: 668051,
        70: 737627,
        71: 814445,
        72: 899257,
        73: 992895,
        74: 1096278,
        75: 1210421,
        76: 1336443,
        77: 1475581,
        78: 1629200,
        79: 1798808,
        80: 1986068,
        81: 2192818,
        82: 2421087,
        83: 2673114,
        84: 2951373,
        85: 3258594,
        86: 3597792,
        87: 3972294,
        88: 4385776,
        89: 4842295,
        90: 5346332,
        91: 5902831,
        92: 6517253,
        93: 7195629,
        94: 7944614,
        95: 8771558,
        96: 9684577,
        97: 10692629,
        98: 11805606,
        99: 13034431
    },
    
    // Skill Icons (for UI)
    SKILL_ICONS: {
        mining: '⛏️',
        woodcutting: '🪓',
        tracking: '🐾',
        fishing: '🎣',
        gathering: '🌿',
        herbalism: '🌱',
        forging: '🔨',
        leatherworking: '🪡',
        tailoring: '🧵',
        crafting: '🛠️',
        cooking: '🍳',
        alchemy: '⚗️',
        combat: '⚔️',
        woodcrafting: '🪵',
        dungeoneering: '🏰',
        bloomtide: '🌸',
        bossing: '💀',
        exorcism: '👻'
    },
    
    // UI Configuration
    UI_CONFIG: {
        UPDATE_INTERVAL: 100, // ms
        DEBOUNCE_DELAY: 150, // ms
        CACHE_EXPIRY: 30 * 60 * 1000, // 30 minutes
        POSITION_KEY: 'degenLevelTracker_position',
        OPEN_KEY: 'degenLevelTracker_open',
        EXPANDED_KEY: 'degenLevelTracker_expanded',
        OPTIMIZER_POSITION_KEY: 'craftingOptimizer_position'
    },
    
    // Material type patterns
    MATERIAL_PATTERNS: {
        BAR: /\s+Bar$/i,
        LEATHER: /\s+Leather$/i,
        CLOTH: /\s+Cloth$/i,
        HANDLE: /Handle$/i,
        BOWSTRING: /Bowstring$/i,
        GEMSTONE: /Gemstone$/i
    }
};

// Expose globally for use in other modules and main script
// Note: In @require scripts, we must use window directly as unsafeWindow is not available
window.Constants = Constants;