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
    
    SKILLS_WITH_INTERMEDIATE_CRAFTS: ['forging', 'leatherworking', 'tailoring', 'alchemy', 'cooking', 'woodcrafting', 'crafting'],
    
    // Weapon Types Mapping
    WEAPON_TYPES: {
        'sword': { skill: 'forging', component: 'handle' },
        'bow': { skill: 'leatherworking', component: 'bowstring' },
        'staff': { skill: 'tailoring', component: 'gemstone' }
    },
    
    // XP Table for levels 1-99
    XP_TABLE: {
        1: 0,
        2: 84,
        3: 192,
        4: 324,
        5: 480,
        6: 645,
        7: 820,
        8: 1005,
        9: 1200,
        10: 1407,
        11: 1735,
        12: 2082,
        13: 2449,
        14: 2838,
        15: 3249,
        16: 3684,
        17: 4144,
        18: 4631,
        19: 5146,
        20: 5691,
        21: 6460,
        22: 7281,
        23: 8160,
        24: 9101,
        25: 10109,
        26: 11191,
        27: 12353,
        28: 13603,
        29: 14949,
        30: 16400,
        31: 18455,
        32: 20675,
        33: 23076,
        34: 25675,
        35: 28492,
        36: 31549,
        37: 34870,
        38: 38482,
        39: 42415,
        40: 46702,
        41: 52583,
        42: 58662,
        43: 64933,
        44: 71390,
        45: 78026,
        46: 84833,
        47: 91802,
        48: 98923,
        49: 106186,
        50: 114398,
        51: 123502,
        52: 132734,
        53: 142077,
        54: 151515,
        55: 161029,
        56: 170602,
        57: 180216,
        58: 189852,
        59: 199491,
        60: 209115,
        61: 220417,
        62: 232945,
        63: 246859,
        64: 262341,
        65: 279598,
        66: 298871,
        67: 320434,
        68: 344603,
        69: 371744,
        70: 402278,
        71: 441971,
        72: 486789,
        73: 537487,
        74: 594941,
        75: 660170,
        76: 734360,
        77: 818896,
        78: 915396,
        79: 1025752,
        80: 1152182,
        81: 1316749,
        82: 1492835,
        83: 1681248,
        84: 1882849,
        85: 2098562,
        86: 2329375,
        87: 2576345,
        88: 2840603,
        89: 3123359,
        90: 3425908,
        91: 3749636,
        92: 4269287,
        93: 4827911,
        94: 5428432,
        95: 6073992,
        96: 6767969,
        97: 7513995,
        98: 8315973,
        99: 9178099
    },
    
    // Skill Icons (for UI) - Using game's SVG sprite icons
    SKILL_ICONS: {
        Mining: 'crystal',
        Woodcutting: 'larch',
        Tracking: 'bear-trap',
        Fishing: 'fish',
        Gathering: 'grass',
        Herbalism: 'tea-leaf',
        Forging: 'anvil',
        Leatherworking: 'leather',
        Tailoring: 'needle',
        Crafting: 'crossed-hammers',
        Cooking: 'chef',
        Alchemy: 'potion',
        Combat: 'sword',
        Woodcrafting: 'hand-saw',
        Dungeoneering: 'door',
        Bloomtide: 'grass',
        Bossing: 'portal',
        Exorcism: 'sword'
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
        BAR: /Bar$/i,
        LEATHER: /Leather$/i,
        CLOTH: /Cloth$/i,
        HANDLE: /Handle$/i,
        BOWSTRING: /Bowstring$/i,
        GEMSTONE: /Gemstone$/i
    },
    
    // Craftable material patterns by skill (for optimizer)
    CRAFTABLE_MATERIAL_PATTERNS: {
        'forging': /Bar$/i,
        'leatherworking': /Leather$/i,
        'tailoring': /Cloth$/i
    },
    
    // Weapon-specific additional components
    WEAPON_SPECIFIC_COMPONENTS: {
        'forging': {
            'sword': 'handle'
        },
        'leatherworking': {
            'bow': 'bowstring'
        },
        'tailoring': {
            'staff': 'gemstone'
        }
    },
    
    // Resources farmed on ALT characters (low-level zones)
    // These should be displayed but NOT counted in total time calculations
    IGNORED_ALT_RESOURCES: ['Arcane Crystal', 'Coal Ore', 'Bone Ore']
};

// Expose globally for use in other modules and main script
// Note: In @require scripts, we must use window directly as unsafeWindow is not available
window.Constants = Constants;