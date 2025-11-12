# Degen Idle XP Tracker v3.0

## 🎯 Overview

Version 3.0 is a complete refactor of the XP Tracker, moving from reactive API-dependent architecture to a proactive autonomous calculation system using a static game database.

## 🚀 Key Improvements

### Architecture Changes
- **Before (v2):** 4 API endpoints dependency, reactive calculations
- **After (v3):** 2 API endpoints only, autonomous calculations with static DB
- **Database:** 647 items pre-loaded with all stats and requirements
- **Code:** ~2800 lines (22% reduction from 3606 lines)

### Performance Gains
- **Instant calculations:** No API wait time for item data
- **Zero cache staleness:** Single source of truth
- **Reduced network calls:** 50% fewer API requests
- **Optimizer speed:** Instant path calculation (was 3-10 clicks)

### User Experience
- **Optimizer:** Simplified 2-step wizard (was 4 steps)
- **All features preserved:** Same UI, same functionality
- **Better accuracy:** Real-time efficiency calculations
- **Auto-sync inventory:** From `/all-data` endpoint

## 📁 Project Structure

```
v3/
├── modules/                    # Core modules
│   ├── constants.js           # Configuration & constants
│   ├── database-loader.js     # Static DB loader
│   ├── efficiency-calculator.js # Efficiency calculations
│   ├── item-data-engine.js    # Item data & crafting paths
│   ├── api-handler.js         # API interceptors
│   ├── state-manager.js       # State management
│   ├── ui-manager.js          # UI components
│   └── optimizer.js           # XP optimizer wizard
├── game_database.json         # Static game database (647 items)
├── build.js                   # Build script
├── degen-idle-xp-tracker-v3.user.js  # Development version
└── degen-idle-xp-tracker-v3.built.user.js # Production build
```

## 🛠️ Installation

### For Users
1. Install Tampermonkey/Greasemonkey browser extension
2. Open `degen-idle-xp-tracker-v3.built.user.js`
3. Click "Install" when prompted

### For Developers
```bash
# Install dependencies (if needed)
npm install

# Build the userscript
node build.js

# Output: degen-idle-xp-tracker-v3.built.user.js
```

## 📊 Module Overview

### Module 1: Constants
- All configuration values
- Skill lists and icons
- XP tables (levels 1-99)
- UI configuration

### Module 2: Database Loader
- Loads embedded game database
- Item lookup by ID or name
- Skill filtering
- Database validation

### Module 3: Efficiency Calculator
- Processes efficiency bonuses
- Membership, equipment, pet, talents, workshop
- Calculates modified action times

### Module 4: Item Data Engine
- Inventory management
- Complete item data with calculations
- Crafting path optimization
- Material requirements

### Module 5: API Handler
- Intercepts game API calls
- Routes to appropriate handlers
- Click detection for preview
- Character change detection

### Module 6: State Manager
- Central state management
- Real-time XP tracking
- UI state persistence
- Update callbacks

### Module 7: UI Manager
- Panel creation and styling
- Real-time updates
- Drag & resize
- Mobile responsive

### Module 8: Optimizer
- 2-step wizard
- Optimal path calculation
- XP overshoot minimization
- Material deduction

## 🔄 Data Flow

```
Game API → Interceptors → State/Engine Updates → UI Render
    ↓                           ↑
    └→ /all-data → Efficiency & Inventory
```

## 📈 API Endpoints Used

### Still Required (2)
- `/skills` - Current skill XP
- `/tasks/active/` - Active tasks

### Removed (2)
- ~~`/calculate`~~ - Now calculated client-side
- ~~`/requirements`~~ - Now from static DB

### Optional (1)
- `/all-data` - Inventory & bonuses update

## 🎮 Features

### Preserved from v2
- ✅ Real-time XP tracking
- ✅ Active tasks with timers
- ✅ Preview on item click
- ✅ Target level calculator
- ✅ Requirements display
- ✅ XP Optimizer wizard
- ✅ Drag & resize panels
- ✅ Mobile responsive
- ✅ Persistent settings

### New in v3
- ✨ Instant item calculations
- ✨ Efficiency bonuses (membership, equipment, etc.)
- ✨ 2-step optimizer (was 4 steps)
- ✨ Automatic inventory sync
- ✨ No cache management needed

## 🐛 Troubleshooting

### Panel not showing
- Press `Alt+X` to toggle
- Check browser console for errors
- Clear localStorage and reload

### Wrong calculations
- Make sure `/all-data` has been called
- Check efficiency bonuses are loaded
- Verify game database version

### Performance issues
- Reduce update interval in constants
- Disable real-time updates when minimized
- Clear browser cache

## 📝 Development

### Adding new features
1. Create new module in `/modules/`
2. Import in main userscript
3. Update build script
4. Test thoroughly

### Updating game database
1. Run extraction scripts in `/utils/`
2. Generate new `game_database.json`
3. Update version number
4. Rebuild userscript

## 📄 License

MIT License - See main repository

## 🤝 Contributing

Pull requests welcome! Please follow the existing code structure and style.

## 📞 Support

Report issues on the main repository issue tracker.

---

**Version:** 3.0.0  
**Last Updated:** 2025-11-12  
**Status:** ✅ Complete & Ready for Testing