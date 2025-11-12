# Degen Idle XP Tracker v3.0 - Usage Guide

## 📦 Structure Modulaire avec CDN

Ce userscript utilise une architecture modulaire où chaque module est chargé via jsDelivr CDN depuis GitHub.

### Structure des fichiers :

```
v3/
├── degen-idle-xp-tracker-v3.user.js    # Fichier principal à installer dans Tampermonkey
├── modules/                             # Modules chargés via CDN
│   ├── constants.js                     # Configuration et constantes
│   ├── database-loader.js               # Chargement de la base de données
│   ├── efficiency-calculator.js         # Calculs d'efficacité
│   ├── item-data-engine.js             # Moteur de données d'items
│   ├── api-handler.js                  # Interception des API calls
│   ├── state-manager.js                # Gestion de l'état global
│   ├── ui-manager.js                   # Interface utilisateur
│   └── optimizer.js                    # Optimiseur de crafting
└── game_database.json                  # Base de données du jeu (embarquée)
```

## 🚀 Installation

1. **Installer Tampermonkey** dans votre navigateur
2. **Copier le contenu** de `degen-idle-xp-tracker-v3.user.js`
3. **Créer un nouveau script** dans Tampermonkey
4. **Coller et sauvegarder**
5. **Recharger** degenidle.com

## 🔧 Développement & Tests

### Workflow de développement :

1. **Modifier un module** (ex: `modules/ui-manager.js`)
2. **Commit et push** vers GitHub
   ```bash
   git add v3/modules/ui-manager.js
   git commit -m "feat: update UI"
   git push
   ```
3. **Récupérer le commit hash** :
   ```bash
   git log -1 --pretty=format:"%h"
   # Exemple: abc1234
   ```
4. **Mettre à jour les URLs CDN** dans `degen-idle-xp-tracker-v3.user.js` :
   ```javascript
   // @require https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@abc1234/v3/modules/ui-manager.js
   ```
5. **Recharger le script** dans Tampermonkey
6. **Tester** sur degenidle.com

### Astuces pour tester plus rapidement :

- **Utiliser le commit hash** au lieu d'un tag pour éviter le cache jsDelivr
- **Forcer le rechargement** : Ctrl+Shift+R sur la page
- **Console du navigateur** : Vérifier les logs `[INIT]`, `[GameDB]`, etc.

## 📋 URLs CDN jsDelivr

### Format des URLs :

```
https://cdn.jsdelivr.net/gh/{username}/{repo}@{commit-hash}/{path}
```

### Exemples :

```
# Latest commit
https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@bddadfc/v3/modules/constants.js

# Specific tag (cache plus long)
https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@v3.0.0/v3/modules/constants.js

# Branch main (pas recommandé pour production)
https://cdn.jsdelivr.net/gh/Seisen99/Degen-Idle-XP-Tracker@main/v3/modules/constants.js
```

## 🎯 Avantages de cette architecture :

✅ **Maintenabilité** : Modules séparés, faciles à modifier  
✅ **Cache** : Les modules sont mis en cache par jsDelivr  
✅ **Greasyfork compatible** : Pas de code minifié, tout est lisible  
✅ **Tests rapides** : Changez juste le commit hash pour tester  
✅ **Réutilisabilité** : Les modules peuvent être partagés entre scripts  

## 🐛 Debugging

### Vérifier que les modules sont chargés :

```javascript
// Console du navigateur
console.log(Constants);     // Devrait afficher l'objet Constants
console.log(GameDB);         // Devrait afficher l'objet GameDB
console.log(State);          // etc.
```

### Si un module ne charge pas :

1. Vérifier l'URL CDN dans la console Network
2. Vérifier que le commit existe sur GitHub
3. Vérifier que le chemin du fichier est correct
4. Attendre quelques minutes (propagation CDN)

## 📝 Notes importantes :

- **Database embarquée** : La `game_database.json` (237 KB) est embarquée dans le fichier principal pour éviter les délais de fetch
- **unsafeWindow** : Nécessaire pour exposer les modules globalement
- **Ordre des @require** : Important ! Les modules avec dépendances doivent être chargés après
- **@grant unsafeWindow** : Requis pour que les modules puissent communiquer

## 🔄 Mise à jour du userscript :

Pour publier une nouvelle version sur Greasyfork :

1. Modifier le numéro de version dans le header
2. Mettre à jour les commit hashes des modules
3. Copier/coller le nouveau code sur Greasyfork
4. Les utilisateurs recevront la mise à jour automatiquement

