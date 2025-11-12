# Fix: Optimizer pour armes complexes (2+ composants)

## Problème identifié
L'algorithme d'optimisation était trop strict pour les armes nécessitant 2+ composants craftables (handle + gemstone + bowstring, etc.). Il ne trouvait pas de solution car il forçait toujours à crafter plus d'items finaux plutôt que d'ajouter des matériaux pour combler le déficit d'XP.

## Solution implémentée

### 1. Détection des armes complexes
```javascript
const weaponComponents = materialCrafts.filter(mat => mat.isWeaponComponent);
const isComplexWeapon = weaponComponents.length >= 2;
```

### 2. Logique flexible pour armes complexes
Pour les armes avec 2+ composants, l'algorithme accepte maintenant d'utiliser des matériaux génériques (bars/leather/cloth) si:
- Le déficit d'XP est petit (< 20% de l'XP de l'item final), OU
- Le ratio XP/temps du matériau est au moins 70% aussi bon que celui de l'item final

```javascript
if (isComplexWeapon && bestGenericMaterial) {
    const deficitRatio = xpMissing / itemXP;
    const ratioComparison = bestGenericRatio / itemRatio;
    
    const smallDeficit = deficitRatio < 0.2;
    const reasonableRatio = ratioComparison >= 0.7;
    
    shouldCraftMoreItems = !smallDeficit && !reasonableRatio && itemRatio > bestGenericRatio;
}
```

### 3. Fallback: utilisation de composants d'arme
En dernier recours, si aucun matériau générique n'est disponible, l'algorithme peut maintenant crafter des composants d'arme supplémentaires (handle, gemstone, bowstring) pour atteindre l'XP cible:

```javascript
else if (isComplexWeapon && weaponComponents.length > 0) {
    // Trouve le meilleur composant (ratio XP/temps)
    const bestComponent = weaponComponents.reduce((best, comp) => {
        const ratio = comp.xpPerCraft / comp.actionTime;
        return ratio > bestRatio ? comp : best;
    }, null);
    
    // Craft le nombre nécessaire pour combler le déficit
    const extraCount = Math.ceil(xpMissing / bestComponent.xpPerCraft);
}
```

## Garanties conservées

✅ **Items simples non affectés**: La logique stricte reste en place pour les items à 1 seul composant craftable  
✅ **Optimisation préservée**: L'algorithme minimise toujours l'overshoot et le temps total  
✅ **Validation stricte**: La solution doit toujours atteindre l'XP cible minimale  
✅ **Priorité aux items finaux**: L'item final reste prioritaire quand le ratio est meilleur  

## Résultat

Les armes complexes (épées, arcs, bâtons magiques, etc.) peuvent maintenant être optimisées avec succès, en acceptant:
- Un léger surplus de matériaux génériques (bars/leather/cloth)
- Ou quelques composants d'arme supplémentaires (handle/gemstone/bowstring)

Tout en gardant l'algorithme optimal et strict pour les items simples (armures, etc.).
