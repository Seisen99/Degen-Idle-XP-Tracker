# Auto Optimizer - Plan d'Implémentation

## 🎯 Objectif

Améliorer le mode **Auto Calculate** de l'optimizer pour qu'il fonctionne comme le mode **Manual** mais automatiquement pour tous les skills de crafting.

---

## 📊 Contexte

### ✅ Mode MANUAL (fonctionne parfaitement - NE PAS TOUCHER)
- Utilisateur sélectionne un item final (ex: Iron Sword)
- Calcule exactement combien d'items finaux et de matériaux intermédiaires à crafter
- Utilise algorithme d'optimisation qui minimise l'overshoot
- Affiche le path complet avec quantités précises

### ❌ Mode AUTO (actuellement cassé)
**Problème identifié :**
```javascript
// Ligne 884-926 : calculateTotalTimeForItem()
const numItems = Math.ceil(xpNeeded / itemData.baseXp);
// ❌ Ignore l'XP des matériaux intermédiaires !
// Résultat : craft 2x trop d'items → énorme overshoot
```

**Solution :** Réutiliser la logique du mode Manual (`calculateOptimalPathForItem()`) au lieu de recalculer différemment.

---

## 🗂️ Structure des Skills dans la DB

### Skills Disponibles dans `game_database.json`
✅ **Actuellement dans l'optimizer :**
- `forging` (weapons: swords)
- `leatherworking` (weapons: bows)
- `tailoring` (weapons: staffs)

➕ **À ajouter à l'optimizer :**
- `alchemy` (potions/extracts)
- `cooking` (food)
- `woodcrafting` (handles, etc.)
- `crafting` (tools, bags)

### Pattern des Paliers
**Tous les skills suivent le même pattern :**
- Paliers de 10 niveaux : 1, 10, 20, 30, 40, 50, 60, 70, 80
- 1 item craftable par palier (ou 2-3 équivalents avec même XP/temps)
- `levelRequired` indique le niveau minimum

**Exemple (Alchemy) :**
```json
{
  "name": "Whisperleaf Extract",
  "skill": "alchemy",
  "levelRequired": 1,
  "baseXp": 1,
  "baseTime": 15,
  "requirements": {
    "Whisperleaf": 2,        // Herbalism (gathered)
    "Arcane Crystal": 1      // Gathering (gathered)
  }
}
```

---

## 🏗️ Architecture des Requirements

### Type 1 : Simple Crafts (Alchemy, Cooking, Woodcrafting)
**Requirements = Gathered Items uniquement**

| Skill | Requirements | Gathering Skills |
|-------|--------------|------------------|
| **Alchemy** | Herb (2×) + Arcane Crystal (x) | Herbalism + Gathering |
| **Cooking** | Fish (2×) + Coal Ore (x) | Fishing + Mining |
| **Woodcrafting** | Wood (x) + ... | Woodcutting + ... |

**Calcul cross-skill simple :**
```javascript
// Pour crafter 100 potions :
requirements = {
  "Whisperleaf": 200,  // → Herbalism: 200 XP
  "Arcane Crystal": 100 // → Gathering: 100 XP
}
```

### Type 2 : Complex Crafts (Crafting)
**Requirements = Crafted Items (récursion nécessaire)**

```json
{
  "name": "Leather Pouch",
  "skill": "crafting",
  "levelRequired": 1,
  "requirements": {
    "Leather": 20,           // ← Crafted (Leatherworking)
    "Basic Solution": 1,     // ← Crafted (Alchemy)
    "Leather Pouch Recipe": 1 // ← Drop/Quest
  }
}
```

**Pour calculer le full path :**
1. Leather Pouch × 10 nécessite :
   - Leather × 200 (de Leatherworking)
   - Basic Solution × 10 (d'Alchemy)

2. Pour crafter Leather × 200 (Leatherworking) :
   - Hide × 400 (Tracking - gathered)
   - Thread × 200 (autre crafted item)

3. Récursivement jusqu'aux gathered items de base

---

## 📋 Plan d'Implémentation

### Phase 1 : Ajouter les Skills à l'UI ✅
**Fichier :** `v3/modules/constants.js`

**Modifier ligne 26 :**
```javascript
SKILLS_WITH_INTERMEDIATE_CRAFTS: [
    'forging',
    'leatherworking',
    'tailoring',
    'alchemy',      // ➕
    'cooking',      // ➕
    'woodcrafting', // ➕
    'crafting'      // ➕
]
```

**Impact UI (Step 1) :**
```
Select Skill:
□ Forging
□ Leatherworking
□ Tailoring
□ Alchemy         ← nouveau
□ Cooking         ← nouveau
□ Woodcrafting    ← nouveau
□ Crafting        ← nouveau
```

---

### Phase 2 : Refonte de `calculateAutoProgression()` 🔧
**Fichier :** `v3/modules/optimizer.js` (lignes 933-1063)

**Nouvelle logique :**

```javascript
calculateAutoProgression() {
    // 1. DÉCOUPER EN TIERS (✅ garder tel quel)
    const tiers = this.identifyTiers(currentLevel, targetLevel);
    
    for (const tier of tiers) {
        // 2. XP nécessaire pour ce tier
        const xpNeeded = State.getXPForLevel(tier.endLevel) 
                       - State.getXPForLevel(tier.startLevel);
        
        // 3. Identifier items disponibles pour ce tier
        const availableItems = GameDB.getAllItemsForSkill(this.currentSkill)
            .filter(item => item.levelRequired <= tier.startLevel);
        
        // 4. Sélectionner le meilleur item
        const bestItem = this.selectBestItemForTier(availableItems);
        
        // 5. ⚡ UTILISER LA LOGIQUE DU MODE MANUAL ⚡
        const pathDetails = this.calculateOptimalPathForItem(
            bestItem.name,
            xpNeeded,
            cumulativeXP
        );
        
        // 6. 🎁 CALCULER XP CROSS-SKILL (nouveau)
        const crossSkillXP = this.calculateCrossSkillXP(pathDetails, bestItem);
        
        // 7. Stocker résultat
        tierResults.push({
            startLevel: tier.startLevel,
            endLevel: tier.endLevel,
            bestItem: bestItem.name,
            craftsNeeded: pathDetails.craftsNeeded,
            materials: pathDetails.materials,
            timeRequired: pathDetails.totalTime,
            xpGained: pathDetails.totalXP,
            crossSkillXP: crossSkillXP  // ➕ nouveau
        });
    }
}
```

**⚠️ SUPPRIMER :** `calculateTotalTimeForItem()` (lignes 884-926) - remplacé par la logique manual

---

### Phase 3 : Calculer Cross-Skill XP 🎁
**Nouvelle fonction à ajouter :**

```javascript
/**
 * Calculate XP gained in OTHER skills from gathering requirements
 * @param {Object} pathDetails - Path from calculateOptimalPathForItem()
 * @param {Object} itemData - Item data for the crafted item
 * @returns {Object} { skillName: { xp, time, items: {} } }
 */
calculateCrossSkillXP(pathDetails, itemData) {
    const crossSkillXP = {};
    
    // Pour chaque requirement
    if (itemData.requirements) {
        Object.entries(itemData.requirements).forEach(([reqName, reqQty]) => {
            // Identifier le skill source
            const reqItem = GameDB.getItemByName(reqName);
            
            if (reqItem && reqItem.type === 'resource') {
                // C'est un gathered item
                const sourceSkill = reqItem.skill; // ex: 'herbalism'
                
                // Quantité totale nécessaire
                const totalNeeded = pathDetails.craftsNeeded * reqQty;
                
                // XP et temps
                const gatherXP = totalNeeded * reqItem.baseXp;
                const gatherTime = totalNeeded * reqItem.baseTime;
                
                // Accumuler
                if (!crossSkillXP[sourceSkill]) {
                    crossSkillXP[sourceSkill] = { xp: 0, time: 0, items: {} };
                }
                crossSkillXP[sourceSkill].xp += gatherXP;
                crossSkillXP[sourceSkill].time += gatherTime;
                crossSkillXP[sourceSkill].items[reqName] = totalNeeded;
            }
        });
    }
    
    return crossSkillXP;
}
```

---

### Phase 4 : Affichage dans l'UI 🎨
**Fichier :** `v3/modules/optimizer.js` (fonction `showAutoProgressionResult()`)

**Ajouter une section "Cross-Skill Benefits" :**

```
⚡ Auto Progression Plan
━━━━━━━━━━━━━━━━━━━━━━━
Alchemy: Level 1 → 30

📊 Summary
   Total Alchemy XP: 1,234
   Total Time: 5h 23m (crafting only)
   
🎁 Bonus XP from Gathering:
   Herbalism: +2,468 XP (2h 30m)
   Gathering: +1,234 XP (1h 15m)
   
⏱️ TRUE Total Time: 9h 8m (includes gathering)

━━━━━━━━━━━━━━━━━━━━━━━
📊 Tier 1: Level 1 → 10
   ⚗️ Whisperleaf Extract × 142
   
   📦 Requirements:
      • Whisperleaf × 284
        └─ Herbalism: +284 XP, 1h 11m
      
      • Arcane Crystal × 142
        └─ Gathering: +142 XP, 35m
   
   ⏱️ Crafting Time: 35m 30s
   ⏱️ Gathering Time: 1h 46m
   ⏱️ Total Time: 2h 22m
```

---

## 🚧 Cas Spécial : Crafting Skill (Phase 5)

### Problème
```json
{
  "name": "Leather Pouch",
  "requirements": {
    "Leather": 20,           // ← item CRAFTÉ
    "Basic Solution": 1      // ← item CRAFTÉ
  }
}
```

### Solution : Récursion
```javascript
/**
 * Calculate full dependency tree (recursive)
 * Goes down to raw gathered items
 */
calculateFullDependencyTree(itemName, quantity) {
    const item = GameDB.getItemByName(itemName);
    const tree = {
        crafted: {},   // items à crafter
        gathered: {}   // items à gather
    };
    
    if (item.type === 'resource') {
        // C'est un gathered item (base case)
        tree.gathered[itemName] = {
            quantity: quantity,
            xp: quantity * item.baseXp,
            time: quantity * item.baseTime,
            skill: item.skill
        };
        return tree;
    }
    
    // C'est un crafted item (récursion)
    tree.crafted[itemName] = quantity;
    
    Object.entries(item.requirements).forEach(([reqName, reqQty]) => {
        const totalNeeded = quantity * reqQty;
        const subTree = this.calculateFullDependencyTree(reqName, totalNeeded);
        
        // Merge sub-trees
        Object.assign(tree.crafted, subTree.crafted);
        Object.entries(subTree.gathered).forEach(([name, data]) => {
            if (!tree.gathered[name]) {
                tree.gathered[name] = data;
            } else {
                tree.gathered[name].quantity += data.quantity;
                tree.gathered[name].xp += data.xp;
                tree.gathered[name].time += data.time;
            }
        });
    });
    
    return tree;
}
```

---

## ✅ Checklist d'Implémentation

### Phase 1 : UI & Data
- [ ] Ajouter 4 skills à `SKILLS_WITH_INTERMEDIATE_CRAFTS`
- [ ] Tester que mode manual fonctionne pour alchemy/cooking
- [ ] Vérifier que `game_database.json` a tous les items nécessaires

### Phase 2 : Refonte Auto Logic
- [ ] Supprimer `calculateTotalTimeForItem()` (lignes 884-926)
- [ ] Modifier `calculateAutoProgression()` pour appeler `calculateOptimalPathForItem()`
- [ ] Tester avec alchemy level 1→10

### Phase 3 : Cross-Skill XP
- [ ] Implémenter `calculateCrossSkillXP()`
- [ ] Tester avec cooking (fish + coal ore)
- [ ] Vérifier calculs de temps/XP

### Phase 4 : Display
- [ ] Modifier `showAutoProgressionResult()` pour afficher cross-skill
- [ ] Ajouter section "Requirements" par tier
- [ ] Montrer temps total (craft + gather)

### Phase 5 : Crafting (optionnel - plus complexe)
- [ ] Implémenter `calculateFullDependencyTree()` (récursif)
- [ ] Tester avec Leather Pouch
- [ ] Afficher arbre de dépendances complet

---

## 🚨 RÈGLES CRITIQUES

### ❌ NE PAS TOUCHER
- **Mode Manual** : `showStep2()`, `calculateOptimalPath()`, post-optimization
- **Efficiency Calculator** : tout le module
- **ItemDataEngine** : tout le module
- **State Manager** : logique existante

### ✅ SEULEMENT MODIFIER
- `calculateAutoProgression()` (refonte)
- `showAutoProgressionResult()` (affichage)
- Ajouter nouvelles fonctions : `calculateCrossSkillXP()`, `calculateFullDependencyTree()`

---

## 🎯 Résultat Final Attendu

**User story :**
1. Utilisateur ouvre optimizer
2. Sélectionne "Alchemy" et target level "30"
3. Clique "⚡ Auto Calculate"
4. Voit :
   - Tier 1 (1→10) : Whisperleaf Extract × 142
   - Tier 2 (10→20) : Briarthorn Resin × 189
   - Tier 3 (20→30) : Emberroot Essence × 234
   - Total Alchemy XP : 1,234
   - **Bonus Herbalism XP : +2,468**
   - **Bonus Gathering XP : +1,234**
   - Total Time : 9h 8m (craft + gather)

**Aucun clic supplémentaire nécessaire. Tout automatique. Tout précis.**

---

## 📝 Notes Techniques

### Base de Données
- ✅ `game_database.json` contient TOUS les items
- ✅ Chaque item a `levelRequired`, `skill`, `requirements`
- ✅ Type `resource` = gathered item
- ✅ Type `consumable_*`, `equipment_*`, etc. = crafted items

### Efficiency
- ✅ Déjà calculé par `EfficiencyCalc.calculate(skillName)`
- ✅ Appliqué dans `ItemDataEngine.getItemData()`
- ✅ Pas besoin de recalculer dans auto mode

### Performance
- Path optimal calculé 1× par tier (pas par item)
- Pas de calls API (tout en local)
- Récursion limitée à 2-3 niveaux max (crafting)

---

**Date:** 2025-11-13  
**Version:** v3  
**Auteur:** Auto Optimizer Breakthrough Team
