# Changelog v0.2.1 - Crafting Path Wizard

## 🔧 Bug Fixes

### Fixed Resize Functionality
- **Removed `pointer-events: none`** from the resize handle SVG
  - This was preventing mouse events from being captured properly
  - The resize handle now correctly responds to mouse drag events

### Added Reset Position/Size Button
- **New Reset Button** in the header (🔄 icon)
  - Resets the panel to default position: `top: 100px, right: 10px`
  - Resets the panel to default size: `width: 500px, height: auto`
  - Saves the reset position to localStorage
  - Located between the title and "Clear Cache" button

## 🎨 UI Improvements

### Enhanced Button Styling
- Added `.wizard-btn:hover` CSS class for consistent hover effects
- Reset button has opacity transition on hover (0.7 → 1.0)
- Matches the styling of the XP Tracker script

## 📝 Technical Changes

### New Functions
- `resetWizardPosition()` - Resets panel position and size to defaults

### Updated Event Handlers
- Added click listener for `#wizardReset` button
- Updated `dragStart()` to exclude reset button from drag events

### Version Update
- Bumped version from `0.2.0` to `0.2.1`
- Updated console log message to reflect new version

---

## Comparison with XP Tracker
The crafting wizard now has feature parity with the XP Tracker for:
- ✅ Draggable panel
- ✅ Resizable panel (FIXED)
- ✅ Reset position/size button (NEW)
- ✅ Persistent position storage
- ✅ Hover effects on controls
