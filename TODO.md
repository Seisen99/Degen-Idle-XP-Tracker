# TODO - Degen Idle XP Tracker & Optimizer

## High Priority

### 🔧 Optimizer - Soustraire items possédés du step 1

**Fichier:** `degen-idle-xp-tracker.user.js`
**Fonction:** `calculateCraftingPath()` (lignes ~2636-2960)

**Description:**
Dans l'optimiseur, lors du calcul du chemin de craft (step 1), les items intermédiaires déjà possédés par l'utilisateur ne sont pas pris en compte. Il faut soustraire la quantité disponible (`req.available`) du nombre de crafts nécessaires pour les matériaux intermédiaires (Bar/Leather/Cloth).

**Détails techniques:**
- Les matériaux intermédiaires sont identifiés via `CRAFTABLE_MATERIAL_PATTERNS` (lignes 54-59):
  - `forging`: items finissant par "bar"
  - `leatherworking`: items finissant par "leather"
  - `tailoring`: items finissant par "cloth"

- Dans la boucle d'optimisation (lignes ~2749-2843), calculer pour chaque matériau:
  ```javascript
  materialCrafts.forEach(mat => {
    const matsForItems = numItems * mat.requiredPerFinalCraft;
    
    // AJOUTER: Soustraire les items déjà possédés
    const available = getAvailableQuantity(mat.name); // à récupérer depuis requirements
    const actualCraftsNeeded = Math.max(0, matsForItems - available);
    
    totalMaterialsForItems[mat.name] = actualCraftsNeeded;
    totalMaterialTime += actualCraftsNeeded * mat.actionTime;
    xpFromMaterials += actualCraftsNeeded * mat.xpPerCraft;
  });
  ```

- Récupérer `req.available` depuis `state.optimizer.finalItem.requirements`
- Appliquer la soustraction dans le calcul de `materialCraftsNeeded` (ligne ~2846)

**Bénéfices:**
- ✅ Réduit le temps de craft total
- ✅ Économise des ressources brutes
- ✅ Optimisation plus précise du chemin de craft
- ✅ Meilleure expérience utilisateur

**Exemple:**
Si l'utilisateur veut crafter 10 épées et a besoin de 20 Iron Bars, mais possède déjà 5 Iron Bars:
- Actuellement: calcule 20 crafts d'Iron Bar
- Après fix: calcule 15 crafts d'Iron Bar (20 - 5)

---

## Notes

- Les composants spécifiques aux armes (handle, bowstring, gemstone) doivent aussi être vérifiés
- S'assurer que `req.available` est bien récupéré pour chaque matériau intermédiaire
- Tester avec différentes quantités d'items en inventaire
- Vérifier que le calcul d'XP reste correct après la soustraction

---

## Backlog

(Ajouter d'autres tâches futures ici)
