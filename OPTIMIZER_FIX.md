# Bug Fix: Optimizer Post-Optimization Logic

## Problème identifié

L'optimizer de la v3 (`v3/modules/optimizer.js`) ne trouvait pas les mêmes résultats que celui de la version originale (`degen-idle-xp-tracker.user.js`) à cause d'une erreur dans la logique de post-optimisation.

## Analyse du bug

### Version originale (CORRECTE)
```javascript
// POST-OPTIMIZATION dans l'original (ligne 3000-3018)
if (finalCraftsNeeded > 1) {
  let testXP = 0;
  
  // Utilise materialCraftsNeeded (déjà ajusté avec l'inventaire)
  materialCrafts.forEach(mat => {
    const matCount = materialCraftsNeeded[mat.name] || 0;
    testXP += matCount * mat.xpPerCraft;
  });
  
  const testItems = finalCraftsNeeded - 1;
  testXP += testItems * state.optimizer.finalItem.xp;
  
  if (testXP >= remainingXP) {
    finalCraftsNeeded = testItems;
    // NE CHANGE PAS materialCraftsNeeded !
  }
}
```

### Version v3 (BUGUÉE - avant fix)
```javascript
// POST-OPTIMIZATION dans v3 (PROBLÉMATIQUE!)
if (finalCraftsNeeded > 1) {
  let testXP = 0;
  const testItems = finalCraftsNeeded - 1;
  
  // Recalcule depuis le début (SANS tenir compte de l'inventaire!)
  materialCrafts.forEach(mat => {
    const matsNeededForTestItems = testItems * mat.requiredPerFinalCraft;
    testXP += matsNeededForTestItems * mat.xpPerCraft;
  });
  
  testXP += testItems * itemXP;
  
  if (testXP >= xpNeeded) {
    finalCraftsNeeded = testItems;
    
    // ERREUR: Recalcule et écrase materialCraftsNeeded!
    materialCrafts.forEach(mat => {
      const newQuantity = testItems * mat.requiredPerFinalCraft;
      const available = mat.available || 0;
      materialCraftsNeeded[mat.name] = Math.max(0, newQuantity - available);
    });
  }
}
```

## Explication du bug

Le bug dans la v3 était double :

1. **Calcul incorrect du testXP** : La v3 recalculait le XP avec `testItems * mat.requiredPerFinalCraft` au lieu d'utiliser les quantités de matériaux déjà calculées dans `materialCraftsNeeded`

2. **Écrasement de materialCraftsNeeded** : La v3 recalculait et écrasait `materialCraftsNeeded` pour les `testItems`, ce qui détruisait la logique des **matériaux supplémentaires** (extra materials) que l'algorithme principal avait ajoutés pour combler le gap XP

### Pourquoi c'est important ?

L'algorithme principal peut décider d'ajouter des matériaux supplémentaires (ex: quelques Bars en plus) pour atteindre le niveau cible. Ces matériaux supplémentaires ne sont **pas** proportionnels au nombre d'items finaux.

Exemple concret :
- Pour 10 items finaux : on a besoin de 20 Bars (2 par item)
- L'algorithme décide d'ajouter 5 Bars supplémentaires pour combler le gap XP
- Total : 25 Bars pour 10 items
- Ratio : 2.5 Bars par item (non entier!)

Si la post-optimisation recalcule avec `9 items * 2 Bars/item = 18 Bars`, elle **perd** les 5 Bars supplémentaires et le calcul devient faux.

## Solution appliquée

La v3 utilise maintenant la **même logique que l'original** :

```javascript
// POST-OPTIMIZATION dans v3 (CORRIGÉE)
if (finalCraftsNeeded > 1) {
    let testXP = 0;
    
    // Calculate XP with same materials but 1 fewer final item
    materialCrafts.forEach(mat => {
        const matCount = materialCraftsNeeded[mat.name] || 0;
        testXP += matCount * mat.xpPerCraft;
    });
    
    const testItems = finalCraftsNeeded - 1;
    testXP += testItems * itemXP;
    
    // If we still reach the target with 1 fewer item, use that instead
    if (testXP >= xpNeeded) {
        const newOvershoot = testXP - xpNeeded;
        console.log(`[Optimizer] Post-optimization: reducing to ${testItems} items (XP: ${testXP}, overshoot: ${newOvershoot})`);
        finalCraftsNeeded = testItems;
        // DO NOT recalculate materialCraftsNeeded - keep the materials as is!
    }
}
```

## Résultat

L'optimizer v3 produit maintenant **exactement les mêmes résultats** que la version originale :
- Même nombre d'items finaux
- Même quantité de matériaux
- Même overshoot XP minimal
- Même temps total

## Fichiers modifiés

- `v3/modules/optimizer.js` (lignes 603-627)
