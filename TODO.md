# TODO - Feature Ideas

## Crafting Chain XP Calculator (Requested Feature)

### Problem
Currently, the script only calculates XP progression for a single item at a time. When crafting items that require intermediate crafts (e.g., Gold Sword needs Gold Bars), the XP gained from crafting those intermediate materials is not included in the total XP calculation.

### Example
User wants to reach level 40 in Forging by crafting Gold Swords:

**Current behavior:**
- Shows: "Craft 100 Gold Swords to reach level 40"
- Ignores XP from crafting the 200 Gold Bars needed

**Desired behavior:**
- Shows: "Craft 200 Gold Bars (level 30 to 35), then craft 50 Gold Swords (level 35 to 40)"
- Accounts for XP from both intermediate and final crafts

### Implementation Approach

#### Passive Cache System
Since API requests are against TOS, we need a passive learning system:

1. **Data Collection**
   - When user clicks on any craftable item, store its XP data
   - Save to localStorage: `{ itemName: { xp, actionTime, skill, timestamp } }`
   - Build database organically as user explores the game

2. **Recursive XP Calculation**
   ```javascript
   function calculateCraftingChainXP(finalItem, targetLevel, currentLevel) {
     let totalXP = 0;
     let steps = [];
     
     // Check if we have cached data for materials
     for (material of finalItem.requirements) {
       if (hasCachedData(material)) {
         // Calculate XP from crafting materials
         // Add to steps array
       }
     }
     
     // Calculate remaining XP from final item
     // Return { totalXP, steps, missingData }
   }
   ```

3. **UI Display**
   - Show crafting path breakdown
   - Indicate missing data: "⚠️ Click on [Gold Bar] to improve accuracy"
   - Optional: Progress indicator showing data completeness

4. **Feature Toggle**
   - Add setting to enable/disable recursive calculations
   - Default: disabled (keep current simple behavior)
   - Opt-in for users who want the advanced feature

### Challenges
- ❌ Can't make API requests (TOS violation)
- ❌ Can't hardcode all recipes (maintenance nightmare)
- ✅ Must rely on passive data collection
- ✅ Will improve accuracy over time
- ⚠️ Initial experience may have incomplete data

### Priority
**Low-Medium** - Nice to have feature, but not core functionality. Current tracker works well for its intended purpose (real-time progress tracking).

### Notes
- This is more of a "crafting path optimizer" than a "progress tracker"
- Different use case from the current script
- Consider as v2.0 feature or separate mode

---

## Bug Fixes Needed

### Fix "Loading XP data..." message for 0 XP skills
**Problem:** When clicking on a skill with 0 XP, the preview shows "Loading XP data..." instead of showing the card with 0 XP progression.

**Root Cause:** Line 1154 checks `if (currentXP > 0 && state.previewTask.expPerAction > 0)` which excludes skills at 0 XP.

**Solution:** Change line 1154 from `currentXP > 0` to `currentXP >= 0`
- ✅ Safe to implement (calculateProgress handles 0 XP correctly)
- ✅ No risk of division by zero (level 1: 84 - 0 = 84)
- ✅ Will display card normally with 0% progression

**Priority:** Low - Cosmetic issue, doesn't break functionality

---

## Other Ideas
- [ ] Export/import crafting database between users
- [ ] Show most efficient crafting path for a level range
- [ ] Multi-skill planning (e.g., "I need Mining 40 and Forging 35")
- [ ] Material cost calculator with market prices
