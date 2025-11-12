# UI Specification - Degen Idle XP Tracker & Optimizer

> Documentation technique complète de l'interface utilisateur du script Tampermonkey

---

## 📋 Table des matières

1. [Design System](#design-system)
2. [Architecture des Panels](#architecture-des-panels)
3. [Composants UI](#composants-ui)
4. [Fonctionnalités Techniques](#fonctionnalités-techniques)
5. [Responsive Design](#responsive-design)
6. [Interactions & Animations](#interactions--animations)

---

## 🎨 Design System

### Palette de Couleurs (Dark Theme)

#### Backgrounds
| Niveau | Couleur | Usage |
|--------|---------|-------|
| Principal | `#0B0E14` | Background panel, contenu principal |
| Secondaire | `#1E2330` | Cards, sections imbriquées |
| Tertiaire | `#2A3041` | Inputs, éléments interactifs |
| Quaternaire | `#3A4051` | Hover states |

#### Textes
| Type | Couleur | Usage |
|------|---------|-------|
| Principal | `#e0e0e0` | Titres, texte important |
| Secondaire | `#C5C6C9` | Contenu standard |
| Tertiaire | `#8B8D91` | Labels, texte secondaire |
| Blanc | `#ffffff` | Headers, emphasis |

#### Couleurs Sémantiques
| Signification | Couleur | Usage |
|---------------|---------|-------|
| Succès | `#5fdd5f` | Active tasks, checkmarks |
| Erreur | `#ff6b6b` | Missing requirements, errors |
| Warning | `#ffa500` | Zero XP states |
| Info | `#60a5fa` | Next level info |
| Preview | `#ffd700` | Preview tasks |
| Craft | `#a78bfa` | Item names, craft info |
| Primary (Indigo) | `#4f46e5` → `#6366f1` | Buttons, progress bars |

### Typographie

```css
Font Family: monospace (système)
```

| Élément | Taille | Poids | Usage |
|---------|--------|-------|-------|
| Header | 16px | bold | Titres de panels |
| Corps | 13px | normal | Texte standard |
| Small | 12px | normal | Détails, stats |
| XSmall | 11px | normal | Labels, notes |

### Espacements

```css
Padding panels: 16px (header), 12px (content), 10px (cards)
Gap: 6px (inline), 8-12px (sections)
Border radius: 4px (small), 6px (medium), 8px (large)
```

### Ombres & Bordures

```css
Box shadow: 0 4px 12px rgba(0,0,0,0.5)
Border standard: 1px solid #1E2330
Border accent: 3px solid [color] (left side)
```

### Icônes Emoji

| Skill | Icône | Skill | Icône |
|-------|-------|-------|-------|
| Mining | ⛏️ | Forging | 🔨 |
| Woodcutting | 🌲 | Leatherworking | 🦌 |
| Fishing | 🎣 | Tailoring | 🧵 |
| Gathering | 🌿 | Crafting | ⚒️ |
| Herbalism | 🌺 | Cooking | 🍳 |
| Tracking | 👣 | Alchemy | ⚗️ |
| Combat | ⚔️ | Dungeoneering | 🏰 |
| Woodcrafting | 🪵 | Bloomtide | 🌸 |
| Bossing | 👹 | Exorcism | 👻 |

**Autres icônes** : 📍 (next level), 🎯 (target), 📦 (requirements), 💡 (preview), 🟢 (active), ⚠️ (warning)

---

## 🏗️ Architecture des Panels

### Panel Principal - XP Tracker

#### Structure DOM

```
#degenLevelTracker (position: fixed, z-index: 999999)
├── #trackerHeader (flex, draggable)
│   ├── <span> "XP Tracker"
│   └── <div> Controls
│       ├── #openOptimizerBtn (visible si expanded)
│       ├── #trackerReset (reset icon)
│       ├── #trackerToggle (+ / −)
│       └── #trackerClose (X icon)
├── #trackerContent (flex-column, scrollable)
│   ├── Active Tasks Section (optional)
│   └── Preview Section (optional)
└── #resizeHandle (nwse-resize, desktop only)
```

#### Positions & Dimensions

**Desktop (> 768px)**
```css
Position par défaut:
  top: 100px
  right: 10px
  
Dimensions (expanded):
  width: 380px
  height: auto
  min-height: 200px
  max-height: 80vh
  
Dimensions (collapsed):
  width: 240px
  height: auto
```

**Mobile (≤ 768px)**
```css
Position (collapsed):
  bottom: 10px
  left: 50%
  transform: translateX(-50%)
  width: 240px
  
Position (expanded):
  top: 10px
  left: 50%
  transform: translateX(-50%)
  width: calc(100vw - 20px)
  max-height: calc(100vh - 20px)
```

#### États du Panel

| État | Display | Width | Features Active |
|------|---------|-------|-----------------|
| Closed | none | - | None |
| Collapsed | flex | 240px | Drag (desktop) |
| Expanded | flex | 380px+ | Drag, Resize, Real-time updates |

#### Header Buttons

| Bouton | Icône | Fonction | Visible |
|--------|-------|----------|---------|
| Optimizer | "Optimizer" | Ouvre XP Optimizer | Expanded only |
| Reset | 📺 SVG | Réinitialise position/taille | Always |
| Toggle | + / − | Collapse/Expand | Always |
| Close | ✕ SVG | Ferme le panel | Always |

---

### Panel Optimizer - XP Optimizer

#### Structure DOM

```
#craftingWizardModal (position: fixed, z-index: 1000000)
├── #wizardHeader (flex, draggable)
│   ├── <span> "XP Optimizer"
│   └── <div> Controls
│       ├── #clearCacheBtn
│       ├── #reloadOptimizerBtn (restart icon)
│       ├── #wizardReset (desktop only)
│       └── #closeWizard (X icon)
├── #wizardContent (scrollable, padding: 20px)
│   └── [Wizard Step Content]
└── #optimizerResizeHandle (desktop only)
```

#### Positions & Dimensions

**Desktop**
```css
Position par défaut:
  top: 100px
  left: 50%
  transform: translateX(-50%)
  
Dimensions:
  width: 500px
  max-width: 90vw
  height: auto
  min-height: 200px
  max-height: 80vh
```

**Mobile**
```css
Position:
  bottom: 10px
  left: 50%
  transform: translateX(-50%)
  
Dimensions:
  width: calc(100vw - 20px)
  max-height: 40vh (steps 1-3)
  max-height: 70vh (step 4 - results)
```

#### Wizard Steps

1. **Step 1** - Introduction
2. **Step 2** - Click final item
3. **Step 3** - Click missing materials
4. **Step 4** - Results display

---

## 📊 Composants UI

### Task Card (Active & Preview)

#### Structure Visuelle

```css
Background: #1E2330
Border: 1px solid #2A3041
Border-left: 3px solid [#5fdd5f (active) | #ffd700 (preview)]
Border-radius: 6px
Padding: 10px
Margin-bottom: 10px
```

#### Anatomie du Card

```
┌─────────────────────────────────────────┐
│ 🎯 Skill Name - Item Name               │ ← Header (14px bold)
│ Lvl 45 → 46                             │ ← Level info (12px, gray)
│ ████████████░░░░░░░░ 62.5%             │ ← Progress bar (18px)
│ 1,234,567 / 2,000,000 XP                │ ← XP counter (12px)
│ 📍 Next lvl (46): 123 actions • 2h 15m │ ← Next level (12px, blue)
│ 🎯 Target Lvl: [50] [Calc]             │ ← Target input + button
│ ┌─────────────────────────────────────┐ │
│ │ → Lvl 50: 1,234 actions • 5h 23m    │ │ ← Target result (collapsible)
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### Composants Internes

**1. Header**
```html
<div style="font-weight: bold; margin-bottom: 6px; color: white; font-size: 14px;">
  {skillIcon} {skillName} - <span style="color: #a78bfa;">{itemName}</span>
</div>
```

**2. Progress Bar**
```html
<div style="background: #0B0E14; border-radius: 4px; height: 18px; position: relative;">
  <div class="progress-bar" style="
    background: linear-gradient(90deg, #4f46e5, #6366f1);
    width: {percentage}%;
    transition: width 0.3s;
  "></div>
  <div style="position: absolute; text-align: center; color: #fff; font-weight: bold;">
    {percentage}%
  </div>
</div>
```

**3. Target Input**
```html
<input type="number" 
  min="{nextLevel}" 
  max="99"
  style="
    width: 50px;
    padding: 6px;
    background: #2A3041;
    border: 1px solid #1E2330;
    color: #fff;
    border-radius: 4px;
  "
/>
<button style="
  padding: 6px 12px;
  background: #4f46e5;
  border: none;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
">Calc</button>
```

**4. Target Result**
```html
<div style="
  background: #0B0E14;
  border-radius: 4px;
  padding: 8px;
  color: #6366f1;
  display: flex;
  gap: 8px;
  align-items: center;
">
  → Lvl {target}: <strong>{actions} actions</strong> • <strong>{time}</strong>
  | {xpNeeded} XP needed
  <button class="close-btn">✕</button>
</div>
```

---

### Requirements Section (Craft Materials)

#### Structure

```css
Background: #1E2330
Border: 1px solid #2A3041
Border-radius: 6px
Padding: 10px
Max-height: 300px
Display: flex, flex-direction: column
```

#### Header

```html
<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
  <span style="color: #a78bfa; font-weight: bold; font-size: 14px;">
    📦 Craft Requirements
  </span>
  <span style="color: #8B8D91; font-size: 11px;">Actions:</span>
  <input type="number" 
    id="timesToCraftInput"
    min="1"
    style="
      width: 60px;
      padding: 4px 6px;
      background: #2A3041;
      border: 1px solid #1E2330;
      color: #fff;
      border-radius: 4px;
      font-size: 11px;
    "
  />
</div>
```

#### Requirement Item

```
┌─────────────────────────────────────┐
│ [img] Item Name                     │
│       Need: 150 | Have: 200 ✅      │
└─────────────────────────────────────┘
```

```html
<div style="
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: #2A3041;
  border-radius: 4px;
  font-size: 11px;
">
  <img src="{url}" alt="{name}" style="
    width: 24px;
    height: 24px;
    border-radius: 3px;
    flex-shrink: 0;
  ">
  <div style="flex: 1; min-width: 0;">
    <div style="color: #C5C6C9; font-weight: bold;">{itemName}</div>
    <div style="color: {statusColor};">
      Need: <span class="req-total">{required * times}</span> | 
      Have: {available} 
      {hasEnough ? '✅' : '❌'}
    </div>
  </div>
</div>
```

**Status Colors**
- ✅ Sufficient: `#5fdd5f` (green)
- ❌ Insufficient: `#ff6b6b` (red)

---

### Empty States & Placeholders

#### 1. No Data

```html
<div style="padding: 20px; text-align: center; color: #8B8D91;">
  Waiting for API data...<br>
  <small>Start a task or click on a resource</small>
</div>
```

#### 2. Level Too Low

```html
<div style="
  background: #1E2330;
  border-radius: 6px;
  padding: 10px;
  border: 1px solid #2A3041;
  border-left: 3px solid #ff6b6b;
">
  <div style="font-weight: bold; color: white;">
    {skillIcon} {skillName} - <span style="color: #a78bfa;">{itemName}</span>
  </div>
  <div style="color: #ff6b6b; font-size: 12px;">
    ⚠️ <small>Skill level too low to craft this item</small>
  </div>
</div>
```

#### 3. Zero XP Warning

```html
<div style="color: #ffa500;">
  💡 <small>This skill has 0 XP - start training to track your progress!</small>
</div>
```

#### 4. Loading Requirements

```html
<div style="
  padding: 16px;
  background: #1E2330;
  border-radius: 6px;
  text-align: center;
">
  <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
    <div style="
      width: 16px;
      height: 16px;
      border: 2px solid #2A3041;
      border-top-color: #ffd700;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    "></div>
    <span style="color: #8B8D91; font-size: 12px;">
      Loading craft requirements...
    </span>
  </div>
</div>
```

---

### Buttons & Controls

#### Primary Button (Calc, Next)

```css
Background: #4f46e5
Hover: #6366f1
Border: none
Color: #ffffff
Padding: 6px 12px
Border-radius: 4px
Font-size: 12px
Font-weight: bold
Transition: background 0.2s
```

#### Secondary Button (Clear Cache, Optimizer)

```css
Background: #2A3041
Hover background: #3A4051
Border: 1px solid #3A4051
Hover border: #4A5061
Color: #C5C6C9
Hover color: #ffffff
Padding: 6px 12px
Border-radius: 4px
Font-size: 12px
Font-weight: bold
Transition: all 0.2s
```

#### Icon Buttons (Close, Reset, Toggle)

```css
Background: none
Border: none
Color: #8B8D91
Hover color: #ffffff
Padding: 0-4px
Display: flex
Align-items: center
Transition: color 0.2s, opacity 0.2s
Opacity: 0.7
Hover opacity: 1
```

#### Input Fields

```css
Number inputs:
  Background: #2A3041
  Border: 1px solid #1E2330
  Color: #ffffff
  Border-radius: 4px
  Padding: 4-6px
  Font-size: 11-12px
  Width: 50-60px (specific inputs)
```

---

## ⚡ Fonctionnalités Techniques

### State Management

#### Global State Object

```javascript
state = {
  // Tracker state
  characterId: null,
  skills: {},                      // { mining: { currentXP: 12345 }, ... }
  activeTasks: [],                 // Currently active tasks
  previewTask: null,               // Hovered/clicked item preview
  currentPageSkill: null,          // Detected from DOM
  isOpen: boolean,                 // Panel visibility
  isExpanded: boolean,             // Panel expanded/collapsed
  targetLevelCalculations: {},     // Target level results cache
  realTimeTracking: {},            // Real-time XP tracking data
  position: {},                    // Panel position & size
  savedInputValues: {},            // Input persistence
  updateLockUntil: timestamp,      // Prevent updates during input
  requirementsCache: {},           // Craft requirements cache
  realTimeInterval: null,          // Interval ID for updates
  
  // Optimizer state
  optimizer: {
    active: boolean,
    step: 1-4,                     // Wizard step
    targetLevel: null,
    currentSkill: null,
    finalItem: null,
    materials: [],
    craftingCache: {},             // Per-character cache
    waitingForClick: boolean,      // Wizard interaction state
    pendingMaterials: [],
    position: {},
    savedPath: null,               // Re-render data
    savedCurrentLevel: null,
    savedXpNeeded: null
  }
}
```

#### LocalStorage Keys

| Key | Type | Content |
|-----|------|---------|
| `degenLevelTracker_open` | string | `"true"` / `"false"` |
| `degenLevelTracker_expanded` | string | `"true"` / `"false"` |
| `degenLevelTracker_position` | JSON | `{ top, left, right, width, height }` |
| `degenOptimizerPosition` | JSON | `{ top, left, right, width, height, transform }` |
| `degenCraftingPathCache_{characterId}` | JSON | Crafting cache object |

---

### Performance Optimizations

#### 1. Debounced UI Updates

```javascript
// 150ms debounce pour éviter les re-renders excessifs
let updateUITimeout = null;
function debouncedUpdateUI(immediate = false) {
  if (immediate) {
    clearTimeout(updateUITimeout);
    updateUI();
    return;
  }
  clearTimeout(updateUITimeout);
  updateUITimeout = setTimeout(() => updateUI(), 150);
}
```

#### 2. Update Lock (Input Protection)

```javascript
// Bloque les updates pendant 3s lors de focus/input
input.addEventListener('focus', () => {
  state.updateLockUntil = Date.now() + 3000;
});

function isUpdateLocked() {
  return Date.now() < state.updateLockUntil;
}
```

#### 3. Real-Time Updates (Conditional)

```javascript
// Interval 100ms uniquement si:
// - Panel ouvert
// - Panel expanded
// - Au moins 1 tâche active

function manageRealTimeUpdates() {
  if (state.isOpen && state.isExpanded && state.activeTasks.length > 0) {
    startRealTimeUpdates(); // setInterval(..., 100)
  } else {
    stopRealTimeUpdates(); // clearInterval
  }
}
```

#### 4. Input Value Persistence

```javascript
// Sauvegarde automatique des valeurs d'input
state.savedInputValues = {
  'targetInput_active_Mining': '99',
  'targetInput_preview_Forging': '75',
  'timesToCraftInput': '10',
  // ...
}

// Restauration après re-render
function restoreInputValues() {
  Object.keys(state.savedInputValues).forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) input.value = state.savedInputValues[inputId];
  });
}
```

#### 5. Requirements Cache

```javascript
// Cache 30min pour éviter les requêtes répétées
state.requirementsCache = {
  'forging_Iron Sword': {
    requirements: [...],
    skillName: 'forging',
    itemName: 'Iron Sword',
    timestamp: 1234567890
  }
}

// Validation: (Date.now() - cached.timestamp) < 1800000
```

---

### Real-Time Progress Tracking

#### Tracking Data Structure

```javascript
state.realTimeTracking = {
  '{skillName}_{itemName}': {
    startTime: timestamp,           // Début du tracking
    baseXP: number,                 // XP de base
    lastApiXP: number,              // Dernière XP confirmée par API
    lastApiTime: timestamp,         // Timestamp de la dernière API
    actionTime: number,             // Temps par action (secondes)
    initialTimeRemaining: number,   // Temps restant initial
    initialActionsRemaining: number,// Actions restantes initiales
    initialXP: number,              // XP initiale
    timerStartTime: timestamp       // Début du timer
  }
}
```

#### Update Logic (100ms intervals)

1. **Calculate elapsed time**: `(now - timerStartTime) / 1000`
2. **Estimate actions completed**: `floor(elapsedTime / actionTime)`
3. **Estimate XP gained**: `actionsCompleted * expPerAction`
4. **Estimate current XP**: `initialXP + xpGained`
5. **Update UI elements**:
   - Current level
   - Progress bar percentage
   - Current XP
   - Actions remaining
   - Time remaining
   - Target level calculations

#### DOM Updates (Optimized)

```javascript
// Mise à jour uniquement si la valeur change
updates.forEach(({ selector, value }) => {
  const el = taskCard.querySelector(selector);
  if (el && el.textContent !== value.toString()) {
    el.textContent = value;
  }
});
```

---

## 📱 Responsive Design

### Breakpoint

```javascript
const MOBILE_BREAKPOINT = 768; // pixels

function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}
```

### Layout Adaptations

#### Desktop (> 768px)

**Features**:
- Draggable panels (header)
- Resizable panels (bottom-right handle)
- Two-column layout (width ≥ 600px)
  - Active Tasks | Preview (side-by-side)
- Absolute positioning (top/left/right)
- Reset button visible

**Cursor states**:
```css
Header: cursor: move
Resize handle: cursor: nwse-resize
```

#### Mobile (≤ 768px)

**Features**:
- Fixed bottom/top positioning
- Horizontal centering (`left: 50%, transform: translateX(-50%)`)
- Full-width panels (`calc(100vw - 20px)`)
- Single-column layout (stack)
- NO drag/resize
- Reset button hidden (optimizer)

**Cursor states**:
```css
Header: cursor: default
```

### Column Layout Detection

```javascript
function shouldUseColumnLayout() {
  const panel = document.getElementById('degenLevelTracker');
  return panel && panel.offsetWidth >= 600;
}

// Si true ET activeTasksHTML ET previewHTML:
// → Two-column flex layout
// Sinon:
// → Stacked layout
```

---

## 🎭 Interactions & Animations

### Hover Effects

#### CSS Classes

```css
/* Buttons génériques */
.tracker-btn:hover { 
  color: white !important; 
  opacity: 1 !important; 
}

/* Bouton close */
.close-btn:hover { 
  color: white !important; 
}

/* Bouton calc */
.calc-btn:hover { 
  background: #6366f1 !important; 
}

/* Boutons wizard */
.wizard-btn:hover { 
  color: white !important; 
  opacity: 1 !important; 
}

/* Clear cache hover */
#clearCacheBtn:hover {
  background: #3A4051 !important;
  border-color: #4A5061 !important;
  color: #ffb733 !important;
}

/* Optimizer button hover */
#openOptimizerBtn:hover {
  background: #3A4051 !important;
  border-color: #4A5061 !important;
  color: #ffffff !important;
}
```

### Animations

#### 1. Spin Loading

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Usage */
.loading-spinner {
  animation: spin 1s linear infinite;
}
```

#### 2. Fade In/Out

```javascript
// Ouverture panel
panel.style.display = 'flex';
setTimeout(() => panel.style.opacity = '1', 10);

// Fermeture panel
panel.style.opacity = '0';
setTimeout(() => panel.style.display = 'none', 300);
```

```css
transition: opacity 0.3s ease;
```

#### 3. Progress Bar

```css
.progress-bar {
  transition: width 0.3s;
  width: {percentage}%;
}
```

### Drag & Drop

#### Drag Behavior

1. **mousedown** sur header → Initialisation
2. **mousemove** → Translation (`transform: translate(x, y)`)
3. **mouseup** → Snap position, conversion en `top/left` absolu

```javascript
// Ignore clicks sur boutons
if (e.target.closest('#trackerToggle') || 
    e.target.closest('#trackerClose') || 
    e.target.closest('#trackerReset') ||
    e.target.closest('#openOptimizerBtn')) {
  return;
}

// Convert centered → fixed avant drag
if (panel.style.transform && panel.style.transform !== 'none') {
  const rect = panel.getBoundingClientRect();
  panel.style.left = `${rect.left}px`;
  panel.style.transform = 'none';
}
```

#### Boundary Detection

```javascript
const minTop = 0;
const minLeft = 0;
const maxTop = window.innerHeight - 60;
const maxLeft = window.innerWidth - panel.offsetWidth;

const finalTop = Math.max(minTop, Math.min(rect.top, maxTop));
const finalLeft = Math.max(minLeft, Math.min(rect.left, maxLeft));
```

### Resize

#### Resize Behavior

1. **mousedown** sur handle → Enregistre dimensions initiales
2. **mousemove** → Calcule deltas, applique nouvelles dimensions
3. **mouseup** → Sauvegarde position, re-render optimizer results (si step 4)

```javascript
const deltaX = e.clientX - startX;
const deltaY = e.clientY - startY;

const newWidth = Math.max(300, startWidth + deltaX);
const newHeight = Math.max(200, startHeight + deltaY);

panel.style.width = `${newWidth}px`;
panel.style.height = `${newHeight}px`;
```

#### Conversion automatique

```javascript
// Convert centered → fixed avant resize
if (panel.style.transform && panel.style.transform !== 'none') {
  const rect = panel.getBoundingClientRect();
  panel.style.left = `${rect.left}px`;
  panel.style.transform = 'none';
}
```

---

## 🔒 Sécurité

### HTML Escaping

```javascript
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

// Usage: Tous les contenus dynamiques
${escapeHtml(skillName)}
${escapeHtml(itemName)}
${escapeHtml(req.itemName)}
```

### Safe Storage Loading

```javascript
function safeLoadFromStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    
    const parsed = JSON.parse(stored);
    
    // Type validation
    if (typeof parsed !== typeof defaultValue) {
      return defaultValue;
    }
    
    return parsed;
  } catch (e) {
    console.warn(`Failed to load ${key}:`, e);
    return defaultValue;
  }
}
```

---

## 📐 Layout Examples

### Desktop - Two Column Layout (width ≥ 600px)

```
┌─────────────────────────────────────────────────────────┐
│ XP Tracker                    [Optimizer] [⊞] [−] [✕]   │
├────────────────────┬────────────────────────────────────┤
│ 🟢 ACTIVE TASK     │ 💡 PREVIEW              [Clear]    │
│                    │                                     │
│ ┌────────────────┐ │ ┌────────────────────────────────┐ │
│ │ Mining Task    │ │ │ Forging - Iron Sword           │ │
│ │ Level 45 → 46  │ │ │ Level 30 → 31                  │ │
│ │ ████████ 62.5% │ │ │ ██████░░ 45.2%                 │ │
│ │ ...            │ │ │ ...                            │ │
│ └────────────────┘ │ │ 📦 Requirements:               │ │
│                    │ │ - Iron Bar x5 ✅               │ │
│                    │ │ - Handle x1 ✅                 │ │
│                    │ └────────────────────────────────┘ │
└────────────────────┴────────────────────────────────────┘
```

### Mobile - Stacked Layout (width < 600px)

```
┌───────────────────────────────┐
│ XP Tracker       [−] [✕]     │
├───────────────────────────────┤
│ 🟢 ACTIVE TASK                │
│                               │
│ ┌───────────────────────────┐ │
│ │ Mining Task               │ │
│ │ Level 45 → 46             │ │
│ │ ████████████ 62.5%        │ │
│ │ ...                       │ │
│ └───────────────────────────┘ │
│                               │
│ 💡 PREVIEW         [Clear]   │
│                               │
│ ┌───────────────────────────┐ │
│ │ Forging - Iron Sword      │ │
│ │ Level 30 → 31             │ │
│ │ ██████░░░░ 45.2%          │ │
│ │ ...                       │ │
│ │ 📦 Requirements:          │ │
│ │ - Iron Bar x5 ✅          │ │
│ │ - Handle x1 ✅            │ │
│ └───────────────────────────┘ │
└───────────────────────────────┘
```

---

## 🎯 Best Practices

### Performance

1. ✅ **Debounce** les updates UI (150ms)
2. ✅ **Lock** updates pendant les inputs (3s)
3. ✅ **Conditional** real-time updates (seulement si nécessaire)
4. ✅ **Cache** requirements (30min TTL)
5. ✅ **Minimal DOM updates** (check textContent avant update)

### UX

1. ✅ **Persist** input values entre re-renders
2. ✅ **Restore** scroll positions
3. ✅ **Disable** drag/resize sur mobile
4. ✅ **Adaptive** layouts (responsive)
5. ✅ **Clear feedback** (loading states, errors, success)

### Accessibility

1. ✅ **Title** attributes sur boutons
2. ✅ **Alt** text sur images
3. ✅ **Semantic** HTML structure
4. ⚠️ **Keyboard navigation** (non implémenté)
5. ⚠️ **ARIA** labels (non implémenté)

### Code Quality

1. ✅ **Escape** tous les contenus dynamiques (XSS)
2. ✅ **Validate** types lors du chargement localStorage
3. ✅ **Try/catch** pour toutes les opérations storage
4. ✅ **Consistent** naming conventions
5. ✅ **Modular** component structure

---

## 📚 Ressources

### Technologies Utilisées

- **Vanilla JavaScript** (ES6+)
- **DOM API** (manipulation directe)
- **LocalStorage API** (persistence)
- **CSS-in-JS** (inline styles)
- **Fetch/XHR Hooks** (API interception)

### APIs Externes

- **Degen Idle API** : `https://api.degenidle.com/api/`
  - `/skills` - XP de toutes les skills
  - `/tasks/active/{characterId}` - Tâches actives
  - `/tasks/calculate` - Calcul XP/temps
  - `/tasks/requirements/{skill}/{item}` - Matériaux requis

### Fichiers Liés

- `degen-idle-xp-tracker.user.js` - Script principal
- `v3/` - Version 3 refactorisée (modules séparés)
- `data/` - Données statiques (skills, items)

---

**Version**: 2.0.5  
**Dernière mise à jour**: 2025  
**Auteur**: Seisen  
**License**: MIT
