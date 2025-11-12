# TODO - Degen Idle XP Tracker & Optimizer

## ✅ Completed

### 🔧 Optimizer - Soustraire items possédés du step 1 ✓

**Status:** ✅ COMPLÉTÉ - 2025-01-12

**Fichier:** `degen-idle-xp-tracker.user.js`
**Fonction:** `calculateCraftingPath()` (lignes ~2636-2960)

**Solution implémentée:**
La soustraction des matériaux déjà possédés a été appliquée **après** le calcul d'optimisation (ligne ~2850), pour ne pas casser l'algorithme d'optimisation qui teste différentes combinaisons.

**Code ajouté (après ligne 2847):**
```javascript
// Subtract already owned intermediate materials from the crafting requirements
Object.keys(materialCraftsNeeded).forEach(matName => {
  const requirement = state.optimizer.finalItem.requirements?.find(r => r.itemName === matName);
  const available = requirement?.available || 0;
  
  if (available > 0) {
    const originalCrafts = materialCraftsNeeded[matName];
    const actualCraftsNeeded = Math.max(0, originalCrafts - available);
    
    console.log(`[Optimizer] ${matName}: ${originalCrafts} needed - ${available} owned = ${actualCraftsNeeded} to craft`);
    materialCraftsNeeded[matName] = actualCraftsNeeded;
  }
});
```

**Résultats:**
- ✅ Réduit le temps de craft total affiché
- ✅ Économise des ressources brutes nécessaires
- ✅ L'algorithme d'optimisation reste intact
- ✅ Le calcul d'XP reste correct (l'XP des items possédés a déjà été gagné)

**Exemple:**
Si l'utilisateur veut crafter des épées et possède déjà 5 Iron Bars:
- Avant: "Craft 20 Iron Bars"
- Après: "Craft 15 Iron Bars" (20 - 5)

---

## High Priority

(Aucune tâche en attente)

---

## Backlog

(Ajouter d'autres tâches futures ici)
