# DegenIdle API Guide

Guide complet pour interagir avec l'API DegenIdle depuis un userscript.

---

## Table des matieres

1. [Configuration de base](#1-configuration-de-base)
2. [Authentification (Userscript)](#2-authentification-userscript)
3. [Endpoint principal : `/characters/{id}/all-data`](#3-endpoint-principal--charactersidall-data)
4. [Autres endpoints utiles](#4-autres-endpoints-utiles)
5. [Endpoints POST (actions)](#5-endpoints-post-actions)
6. [Exemple complet : Code minimal](#6-exemple-complet--code-minimal)

---

## 1. Configuration de base

### URL racine de l'API

```
https://api-v1.degenidle.com/api/
```

### Headers requis

Pour chaque requete a l'API, les headers suivants sont necessaires :

```javascript
{
  'Authorization': 'Bearer eyJ...',  // Token JWT capture
  'Accept': 'application/json',
  'Content-Type': 'application/json',  // Pour les requetes POST
  'Origin': 'https://degenidle.com',
  'Referer': 'https://degenidle.com/'
}
```

---

## 2. Authentification (Userscript)

### 2.1 Principe

Le jeu DegenIdle utilise un token JWT pour l'authentification. Ce token est envoye dans le header `Authorization` de chaque requete API.

**Pour un userscript**, la methode la plus simple est d'**intercepter** les requetes du jeu pour capturer ce token automatiquement.

### 2.2 Interception du token

Le code suivant intercepte les requetes `fetch` et `XMLHttpRequest` pour capturer le token :

```javascript
// ============================================
// TOKEN MANAGER
// ============================================
const TokenManager = {
  authToken: null,
  lastUpdate: null,
  onTokenCapturedCallbacks: [],

  update(token) {
    if (token && token !== this.authToken) {
      const isFirstCapture = !this.authToken;
      this.authToken = token;
      this.lastUpdate = Date.now();
      console.log('[TokenManager] Token captured!');

      // Trigger callbacks on first capture
      if (isFirstCapture) {
        this.onTokenCapturedCallbacks.forEach(cb => cb());
      }
    }
  },

  registerCallback(callback) {
    this.onTokenCapturedCallbacks.push(callback);
  },

  isReady() {
    return !!this.authToken;
  }
};

// ============================================
// FETCH INTERCEPTOR
// ============================================
const originalFetch = window.fetch;

window.fetch = async function(...args) {
  const [url, options] = args;
  const urlStr = typeof url === 'string' ? url : url?.url || '';

  // Capture Authorization header from DegenIdle API calls
  if (urlStr.includes('api-v1.degenidle.com') && options?.headers) {
    let authHeader = null;

    if (options.headers instanceof Headers) {
      authHeader = options.headers.get('Authorization');
    } else if (typeof options.headers === 'object') {
      authHeader = options.headers['Authorization'] || options.headers['authorization'];
    }

    if (authHeader) {
      TokenManager.update(authHeader);
    }
  }

  return originalFetch.apply(this, args);
};

// ============================================
// XHR INTERCEPTOR
// ============================================
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

XMLHttpRequest.prototype.open = function(method, url, ...rest) {
  this._degenIdleUrl = url;
  return originalXHROpen.apply(this, [method, url, ...rest]);
};

XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
  if (name.toLowerCase() === 'authorization' && this._degenIdleUrl?.includes('api-v1.degenidle.com')) {
    TokenManager.update(value);
  }
  return originalXHRSetRequestHeader.apply(this, arguments);
};

console.log('[TokenManager] Interceptors installed. Waiting for game API calls...');
```

### 2.3 Fonctions API helper

Une fois le token capture, utilisez ces fonctions pour faire des appels API :

```javascript
const API_ROOT = "https://api-v1.degenidle.com/api/";

// GET request
async function apiCall(endpoint) {
  if (!TokenManager.isReady()) {
    throw new Error('Token not available yet');
  }

  const response = await originalFetch(`${API_ROOT}${endpoint}`, {
    headers: {
      'Authorization': TokenManager.authToken,
      'Accept': 'application/json',
      'Origin': 'https://degenidle.com',
      'Referer': 'https://degenidle.com/'
    }
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }

  return await response.json();
}

// POST request
async function apiPost(endpoint, body) {
  if (!TokenManager.isReady()) {
    throw new Error('Token not available yet');
  }

  const response = await originalFetch(`${API_ROOT}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': TokenManager.authToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Origin': 'https://degenidle.com',
      'Referer': 'https://degenidle.com/'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`API POST failed: ${response.status}`);
  }

  return await response.json();
}
```

### 2.4 Attendre que le token soit pret

```javascript
// Option 1: Callback
TokenManager.registerCallback(() => {
  console.log('Token ready! Starting my script...');
  startMyScript();
});

// Option 2: Polling
async function waitForToken(maxWaitMs = 30000) {
  const startTime = Date.now();
  while (!TokenManager.isReady()) {
    if (Date.now() - startTime > maxWaitMs) {
      throw new Error('Timeout waiting for token');
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return TokenManager.authToken;
}
```

---

## 3. Endpoint principal : `/characters/{id}/all-data`

### Description

Cet endpoint retourne **toutes les donnees** d'un personnage en une seule requete. C'est l'endpoint le plus complet et le plus utile pour un tracker.

### Requete

```
GET https://api-v1.degenidle.com/api/characters/{characterId}/all-data
```

### Exemple d'utilisation

```javascript
const characterId = '9e595d41-94f3-4fdd-a285-59a01802c354';
const data = await apiCall(`characters/${characterId}/all-data`);
console.log(data.data.skills);  // XP de toutes les competences
```

### Structure complete de la reponse

```json
{
  "success": true,
  "data": {
    "character": { ... },
    "attributes": { ... },
    "combatStats": { ... },
    "skills": { ... },
    "inventory": { ... },
    "equipment": { ... },
    "selectedSubclass": "...",
    "talentEffects": { ... },
    "talentProgression": { ... },
    "pets": [ ... ],
    "equippedPet": { ... },
    "party": { ... },
    "partyInvites": [ ... ],
    "sentPartyInvites": [ ... ],
    "friends": [ ... ],
    "activeTasks": [ ... ],
    "activeDungeons": [ ... ],
    "idleCombat": { ... },
    "altarTasks": null,
    "marketClaims": [ ... ],
    "trades": [ ... ],
    "unreadMailCount": 0,
    "bankInventory": [ ... ],
    "bankStatus": { ... },
    "inventoryStatus": { ... },
    "skillLevels": { ... },
    "combatState": { ... },
    "activePotionEffects": [ ... ],
    "activePlayerStats": { ... }
  }
}
```

---

### 3.1 `character` - Informations de base

```json
{
  "id": "9e595d41-94f3-4fdd-a285-59a01802c354",
  "auth0_user_id": "kp_721b988495dd4f1eb1f1e3bdf5b2c268",
  "name": "Seisen",
  "gold": 24222,
  "created_at": "2025-11-02 05:30:30.455982+00",
  "updated_at": "2025-12-13 08:24:23.222979+00",
  "pfp": "https://cdn.degendungeon.com/Profiles/mortyn.png",
  "cover": "https://cdn.degendungeon.com/Profiles/covers/character_bg.jpg",
  "location": "Happyville",
  "class": "mage",
  "total_level": "61",
  "max_inventory": 16,
  "inventory_slots_purchased": 4,
  "max_bank_inventory": 20,
  "bank_slots_purchased": 4,
  "pet": null
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Identifiant unique du personnage |
| `auth0_user_id` | string | Identifiant du compte utilisateur |
| `name` | string | Nom du personnage |
| `gold` | number | Or possede |
| `created_at` | string (ISO date) | Date de creation |
| `updated_at` | string (ISO date) | Derniere mise a jour |
| `pfp` | string (URL) | URL de l'image de profil |
| `cover` | string (URL) | URL de l'image de couverture |
| `location` | string | Localisation actuelle |
| `class` | string | Classe (`mage`, `warrior`, `ranger`) |
| `total_level` | string | Niveau total (somme des niveaux de skills) |
| `max_inventory` | number | Taille max de l'inventaire de base |
| `inventory_slots_purchased` | number | Slots d'inventaire achetes |
| `max_bank_inventory` | number | Taille max de la banque de base |
| `bank_slots_purchased` | number | Slots de banque achetes |
| `pet` | object/null | Pet actif (deprecated, voir `equippedPet`) |

---

### 3.2 `attributes` - Attributs principaux

```json
{
  "character_id": "9e595d41-94f3-4fdd-a285-59a01802c354",
  "strength": 39394,
  "agility": 54507,
  "intelligence": 584621,
  "characterId": "9e595d41-94f3-4fdd-a285-59a01802c354"
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `strength` | number | Force (augmente avec combat melee) |
| `agility` | number | Agilite (augmente avec combat range) |
| `intelligence` | number | Intelligence (augmente avec combat mage) |

> **Note**: Ces attributs augmentent automatiquement en fonction de la classe et du combat.

---

### 3.3 `combatStats` - Statistiques de combat

```json
{
  "character_id": "9e595d41-94f3-4fdd-a285-59a01802c354",
  "health": 459,
  "attack_power": 76,
  "attack_speed": 1.4,
  "energy": 348,
  "last_updated": "2025-12-16 16:01:24.753646+00",
  "defense": 52.2,
  "current_health": 567,
  "current_energy": 442,
  "character_name": "Seisen",
  "character_class": "mage",
  "crit_chance": 5,
  "crit_damage": 150,
  "total_max_health": 567,
  "total_max_energy": 443,
  
  "equipment_attack_power": 22.5,
  "equipment_block_chance": 12,
  "equipment_dodge": 6,
  "equipment_perfect_block": 0,
  "equipment_damage_reflect": 5.75,
  "equipment_defense_penetration": 11.25,
  "equipment_resource_efficiency": 49.45,
  "equipment_health_on_hit": 2.36,
  "equipment_health_on_block": 0,
  "equipment_health_on_crit": 0,
  "equipment_health_on_dodge": 0,
  "equipment_energy_on_hit": 4.84,
  "equipment_energy_on_block": 0,
  "equipment_energy_on_crit": 0,
  "equipment_energy_on_dodge": 0,
  "equipment_max_health": 108,
  "equipment_max_energy": 117.8,
  "equipment_crit_chance": 0,
  "equipment_crit_damage": 0,
  "equipment_attack_speed": 11.5,
  "equipment_attack_power_percent": 5.5,
  "equipment_defense_percent": 5.75,
  "equipment_task_efficiency": 3.45,
  "equipment_combat_exp": 0,
  "equipment_pet_exp": 0,
  "equipment_drop_chance": 0,
  "equipment_gold_find": 0
}
```

#### Stats de base

| Champ | Type | Description |
|-------|------|-------------|
| `health` | number | PV de base |
| `attack_power` | number | Puissance d'attaque de base |
| `attack_speed` | number | Vitesse d'attaque de base |
| `energy` | number | Energie de base |
| `defense` | number | Defense totale |
| `current_health` | number | PV actuels |
| `current_energy` | number | Energie actuelle |
| `crit_chance` | number | Chance de critique (%) |
| `crit_damage` | number | Degats critiques (%) |
| `total_max_health` | number | PV max totaux (base + equipment) |
| `total_max_energy` | number | Energie max totale (base + equipment) |

#### Stats d'equipement (prefixe `equipment_`)

| Champ | Type | Description |
|-------|------|-------------|
| `equipment_attack_power` | number | Bonus d'attaque de l'equipement |
| `equipment_block_chance` | number | Chance de bloquer (%) |
| `equipment_dodge` | number | Chance d'esquive (%) |
| `equipment_perfect_block` | number | Chance de bloc parfait (%) |
| `equipment_damage_reflect` | number | Reflexion de degats (%) |
| `equipment_defense_penetration` | number | Penetration de defense |
| `equipment_resource_efficiency` | number | Efficacite des ressources (%) |
| `equipment_health_on_hit` | number | PV regagnes par coup |
| `equipment_energy_on_hit` | number | Energie regagnee par coup |
| `equipment_max_health` | number | Bonus de PV max |
| `equipment_max_energy` | number | Bonus d'energie max |
| `equipment_attack_speed` | number | Bonus de vitesse d'attaque (%) |
| `equipment_attack_power_percent` | number | Bonus d'attaque (%) |
| `equipment_defense_percent` | number | Bonus de defense (%) |
| `equipment_task_efficiency` | number | Efficacite des taches (%) |
| `equipment_combat_exp` | number | Bonus d'XP combat (%) |
| `equipment_drop_chance` | number | Chance de drop (%) |
| `equipment_gold_find` | number | Bonus d'or trouve (%) |

---

### 3.4 `skills` - Experience des competences

```json
{
  "characterId": "9e595d41-94f3-4fdd-a285-59a01802c354",
  "characterName": "Seisen",
  "characterClass": "mage",
  "mining": 85129,
  "woodcutting": 115084,
  "tracking": 1412,
  "fishing": 0,
  "gathering": 1124102,
  "herbalism": 1708,
  "forging": 10,
  "leatherworking": 0,
  "tailoring": 70908,
  "crafting": 0,
  "cooking": 0,
  "alchemy": 36,
  "combat": 1177372,
  "woodcrafting": 0,
  "dungeoneering": 18300,
  "bloomtide": 0,
  "bossing": 90276,
  "exorcism": 105,
  "tinkering": 4243
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `mining` | number | XP total en Minage |
| `woodcutting` | number | XP total en Bucheron |
| `tracking` | number | XP total en Traque |
| `fishing` | number | XP total en Peche |
| `gathering` | number | XP total en Cueillette |
| `herbalism` | number | XP total en Herboristerie |
| `forging` | number | XP total en Forge |
| `leatherworking` | number | XP total en Travail du cuir |
| `tailoring` | number | XP total en Couture |
| `crafting` | number | XP total en Artisanat |
| `cooking` | number | XP total en Cuisine |
| `alchemy` | number | XP total en Alchimie |
| `combat` | number | XP total en Combat |
| `woodcrafting` | number | XP total en Menuiserie |
| `dungeoneering` | number | XP total en Donjon |
| `bloomtide` | number | XP total en Bloomtide (event) |
| `bossing` | number | XP total en Boss |
| `exorcism` | number | XP total en Exorcisme |
| `tinkering` | number | XP total en Bricolage |

> **Note**: Les valeurs sont l'XP total accumule, pas le niveau. Pour convertir en niveau, utilisez la table d'XP du jeu.

---

### 3.5 `inventory` - Inventaire

```json
{
  "items": [
    {
      "id": "44f00cb4-67d7-4488-9461-edf3a8b08916",
      "character_id": "9e595d41-94f3-4fdd-a285-59a01802c354",
      "item_id": 301,
      "quantity": 1,
      "created_at": "2025-11-03 15:52:56.737026+00",
      "rarity": null,
      "efficiency": null,
      "comments": null,
      "affix_stats": null
    },
    {
      "id": "864c87dc-357b-4a1f-b8a8-a13d156704b1",
      "character_id": "9e595d41-94f3-4fdd-a285-59a01802c354",
      "item_id": 776,
      "quantity": 1,
      "created_at": "2025-11-17 04:55:41.638763+00",
      "rarity": "Epic",
      "efficiency": null,
      "comments": null,
      "affix_stats": {
        "max_energy": 35,
        "resource_efficiency": 3.45
      }
    }
  ],
  "slots": {
    "total_inventory_slots": 20,
    "inventory_count": 27,
    "max_inventory": 16,
    "inventory_slots_purchased": 4
  }
}
```

#### Structure d'un item

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Identifiant unique de l'instance de l'item |
| `character_id` | string (UUID) | ID du personnage proprietaire |
| `item_id` | number | ID du type d'item (reference la base de donnees du jeu) |
| `quantity` | number | Quantite possedee |
| `created_at` | string (ISO date) | Date d'obtention |
| `rarity` | string/null | Rarete (`Common`, `Uncommon`, `Rare`, `Epic`, `Legendary`, ou `null`) |
| `efficiency` | string/null | Type d'efficacite pour les outils (ex: `"Tracking"`) |
| `comments` | string/null | Commentaires (rarement utilise) |
| `affix_stats` | object/null | Stats bonus de l'item (voir ci-dessous) |

#### `affix_stats` - Stats bonus des items

```json
{
  "max_energy": 35,
  "resource_efficiency": 3.45,
  "attack_power": 5.5,
  "defense": 5.75,
  "dodge": 6,
  "attack_speed": 6,
  "damage_reflect": 5.75,
  "defense_penetration": 5.75,
  "health_on_hit": 2.36,
  "energy_on_hit": 2.48,
  "max_health": 108
}
```

Les stats possibles incluent toutes les stats de combat (`attack_power`, `defense`, `dodge`, `max_health`, `max_energy`, `crit_chance`, `crit_damage`, `attack_speed`, `block_chance`, `perfect_block`, `damage_reflect`, `defense_penetration`, `resource_efficiency`, `health_on_hit`, `energy_on_hit`, etc.).

#### `slots` - Informations sur les slots

| Champ | Type | Description |
|-------|------|-------------|
| `total_inventory_slots` | number | Total de slots disponibles |
| `inventory_count` | number | Nombre d'items dans l'inventaire |
| `max_inventory` | number | Slots de base |
| `inventory_slots_purchased` | number | Slots achetes |

---

### 3.6 `equipment` - Equipement porte

```json
{
  "character_id": "9e595d41-94f3-4fdd-a285-59a01802c354",
  "characterId": "9e595d41-94f3-4fdd-a285-59a01802c354",
  "characterName": "Seisen",
  "characterClass": "mage",
  
  "helmet": "98369000-7b97-4aa6-ab6c-a96cddd6307c",
  "bodyarmor": "07e26720-dd67-4650-bdbd-4fd494e9e9ad",
  "gloves": "14632a77-eebd-41ed-b03b-1acb362e4332",
  "boots": "e0f7a3af-0e7b-43e9-8fcc-698dbc9693f3",
  "sword": "c5307a83-1860-4496-8a8c-90cf7b1b3dc4",
  "shield": "4a65f585-08e9-4783-9dab-c8db9b1cfaa1",
  "twohanded": null,
  
  "pickaxe": "af1838f0-0f8a-47f9-b440-81afa1c28625",
  "axe": "ef457f51-a38d-4024-8fd6-fa59aeb15f74",
  "fishingrod": null,
  "pouch": "44f00cb4-67d7-4488-9461-edf3a8b08916",
  "trap": null,
  "basket": "5647946f-f713-4827-a25d-0ccfcf758ad3",
  
  "ring1": "13a370a3-eb3a-45d9-9bb1-f552ddd59767",
  "ring2": "aeedddc5-5774-4785-a3a5-5fdde53bc198",
  "amulet": "864c87dc-357b-4a1f-b8a8-a13d156704b1",
  
  "equipped_pet": "9b893139-d64d-4a08-a936-6636094b281d",
  "profile_picture": "c75f5ded-2a2c-4468-8f4d-f99dc5468efe",
  "profile_cover": null,
  
  "item_effects": null,
  "itemEffects": null,
  "profilePicture": "c75f5ded-2a2c-4468-8f4d-f99dc5468efe",
  "profileCover": null
}
```

| Slot | Description |
|------|-------------|
| `helmet` | Casque |
| `bodyarmor` | Armure de corps |
| `gloves` | Gants |
| `boots` | Bottes |
| `sword` | Arme principale (epee/baton/arc) |
| `shield` | Bouclier (ou off-hand) |
| `twohanded` | Arme a deux mains (alternative a sword+shield) |
| `pickaxe` | Pioche (mining) |
| `axe` | Hache (woodcutting) |
| `fishingrod` | Canne a peche (fishing) |
| `pouch` | Sacoche (gathering) |
| `trap` | Piege (tracking) |
| `basket` | Panier (herbalism) |
| `ring1`, `ring2` | Anneaux |
| `amulet` | Amulette |
| `equipped_pet` | ID du pet equipe |
| `profile_picture` | ID de l'image de profil |
| `profile_cover` | ID de la couverture de profil |

> **Note**: Les valeurs sont des UUIDs qui referencent des items dans l'inventaire. `null` = slot vide.

---

### 3.7 `talentProgression` - Talents

```json
{
  "characterId": "9e595d41-94f3-4fdd-a285-59a01802c354",
  "selectedSubclass": "spellblade",
  "talentData": {
    "sb-1-1": 5,
    "sb-1-2": 5,
    "sb-2-1": 2,
    "sb-2-2": 5,
    "sb-4-2": 1,
    "m-base-1-2": 5,
    "m-base-2-1": 5,
    "m-base-3-2": 5,
    "m-base-4-2": 3
  },
  "availableTalentPoints": 0,
  "totalTalentPointsEarned": 36,
  "totalTalentPointsSpent": 36,
  "lastTalentReset": null,
  "createdAt": "2025-11-02 05:30:30.455982+00",
  "updatedAt": "2025-12-16 15:41:29.629495+00",
  "talentEffects": {
    "max_energy": -5,
    "attack_power": 8,
    "attack_speed": 5,
    "health_on_hit": 0.4,
    "defense_penetration": 16,
    "resource_efficiency": 20,
    "attack_power_high_energy": 3
  }
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `selectedSubclass` | string | Sous-classe choisie (`spellblade`, `berserker`, `sharpshooter`, etc.) |
| `talentData` | object | Points investis dans chaque talent (cle = ID du talent, valeur = points) |
| `availableTalentPoints` | number | Points de talent disponibles |
| `totalTalentPointsEarned` | number | Total de points gagnes |
| `totalTalentPointsSpent` | number | Total de points depenses |
| `lastTalentReset` | string/null | Date du dernier reset |
| `talentEffects` | object | Effets cumules des talents (bonus de stats) |

---

### 3.8 `pets` et `equippedPet` - Familiers

```json
{
  "pets": [
    {
      "id": "9b893139-d64d-4a08-a936-6636094b281d",
      "character_id": "9e595d41-94f3-4fdd-a285-59a01802c354",
      "pet_type": "Vellum",
      "name": "Vellum",
      "level": 1,
      "experience": 0,
      "closeness": 0,
      "current_fullness": 100,
      "max_fullness": 100,
      "attributes": {},
      "skills": {
        "Woodcrafting Efficiency": 1
      },
      "rarity": "Common",
      "original_item_id": 826,
      "created_at": "2025-12-16 14:22:43.435537+00"
    },
    {
      "id": "c6d0cc1c-d335-4d23-bdfe-43099f21fc1a",
      "character_id": "9e595d41-94f3-4fdd-a285-59a01802c354",
      "pet_type": "Lumi",
      "name": "Lumi",
      "level": 41,
      "experience": 54694,
      "closeness": 0,
      "current_fullness": 0,
      "max_fullness": 260,
      "attributes": {},
      "skills": {
        "Gathering Efficiency": 4.88
      },
      "rarity": "Uncommon",
      "original_item_id": 813,
      "created_at": "2025-11-04 00:36:06.147093+00"
    }
  ],
  "equippedPet": {
    "id": "9b893139-d64d-4a08-a936-6636094b281d",
    "pet_type": "Vellum",
    "name": "Vellum",
    "level": 1,
    "experience": 0,
    "skills": {
      "Woodcrafting Efficiency": 1
    },
    "rarity": "Common"
  }
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Identifiant unique du pet |
| `pet_type` | string | Type de pet (`Lumi`, `Vellum`, etc.) |
| `name` | string | Nom du pet |
| `level` | number | Niveau du pet |
| `experience` | number | XP actuelle |
| `closeness` | number | Affection |
| `current_fullness` | number | Satiete actuelle |
| `max_fullness` | number | Satiete max |
| `skills` | object | Bonus de competences fournis par le pet |
| `rarity` | string | Rarete (`Common`, `Uncommon`, `Rare`, `Epic`, `Legendary`) |
| `original_item_id` | number | ID de l'oeuf d'origine |

---

### 3.9 `activeTasks` - Taches en cours

```json
{
  "activeTasks": [
    {
      "id": "198348fd-04df-4e37-96be-cf8433a163e2",
      "character_id": "9e595d41-94f3-4fdd-a285-59a01802c354",
      "skill_name": "Tailoring",
      "item_name": "Shadow Cloth",
      "auth0_user_id": "kp_721b988495dd4f1eb1f1e3bdf5b2c268",
      "is_active": true,
      "start_time": "2025-12-16 13:59:04.338",
      "end_time": null,
      "last_processed_time": "2025-12-16 16:01:24.753646",
      "exp_earned": 1980,
      "items_gathered": {
        "Shadow Cloth": {
          "total": 180,
          "byRarity": null
        }
      },
      "actions_completed": 180,
      "action_time": 40.775,
      "exp_per_action": 11,
      "drop_rate": 1,
      "material_requirements": {
        "Shadowvine": 2,
        "Arcane Crystal": 5
      },
      "item_id": 209,
      "membership_bonus": true,
      "tool_bonus": 0,
      "total_actions": 706,
      "error_message": null
    }
  ]
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | ID de la tache (pour restart) |
| `skill_name` | string | Nom de la competence |
| `item_name` | string | Nom de l'item produit/recolte |
| `is_active` | boolean | Tache en cours ou non |
| `start_time` | string | Debut de la tache |
| `last_processed_time` | string | Derniere mise a jour |
| `exp_earned` | number | XP gagnee depuis le debut |
| `items_gathered` | object | Items recoltes avec quantites |
| `actions_completed` | number | Actions effectuees |
| `action_time` | number | Temps par action (secondes) |
| `exp_per_action` | number | XP par action |
| `drop_rate` | number | Taux de drop (1 = 100%) |
| `material_requirements` | object | Materiaux necessaires par action |
| `item_id` | number | ID de l'item produit |
| `membership_bonus` | boolean | Bonus membre actif |
| `tool_bonus` | number | Bonus de l'outil |
| `total_actions` | number | Actions totales avant epuisement des ressources |
| `error_message` | string/null | Message d'erreur si la tache a echoue |

---

### 3.10 `activeDungeons` - Donjons en cours

```json
{
  "activeDungeons": [
    {
      "id": "61615e89-60c0-401a-9faf-c9d32b61e236",
      "dungeon_id": 28,
      "character_ids": ["9e595d41-94f3-4fdd-a285-59a01802c354"],
      "start_time": "2025-12-16 15:41:29.973+00",
      "end_time": null,
      "is_active": true,
      "last_processed_time": "2025-12-16 15:56:48.054+00",
      "current_room": 3,
      "exp_earned": 0,
      "gold_spent": 50,
      "loot_gained": {},
      "chain_position": 4,
      "chain_total": 16,
      "chain_id": "f4fb98ef-5374-4efd-ac8d-1be4048d8253",
      "auto_chain": true,
      "errors": null,
      "task_result": {
        "combatLog": [],
        "hasFailed": false,
        "currentRoom": 3,
        "roomsCleared": 3,
        "lastUpdated": "2025-12-16T15:56:48.054Z",
        "roomsProcessed": {
          "1": true,
          "2": true,
          "3": true,
          "4": false,
          "5": false
        },
        "combatStats": [
          ["9e595d41-94f3-4fdd-a285-59a01802c354", {
            "isDead": false,
            "entityId": "9e595d41-94f3-4fdd-a285-59a01802c354",
            "entityName": "Seisen",
            "entityType": "character",
            "damageDealt": 5030.65,
            "damageTaken": 18.81,
            "healthLost": 18.81,
            "healthRecovered": 71.76,
            "energyUsed": 119.14,
            "energyRecovered": 125.84,
            "totalAttacks": 26,
            "criticalHits": 2,
            "criticalHitRate": 13.33,
            "totalBlocks": 5,
            "totalDodges": 1,
            "monstersKilled": 0,
            "actionsPerformed": 26
          }]
        ],
        "combatEntities": [
          ["9e595d41-94f3-4fdd-a285-59a01802c354", {
            "id": "9e595d41-94f3-4fdd-a285-59a01802c354",
            "name": "Seisen",
            "type": "character",
            "class": "mage",
            "subclass": "spellblade",
            "totalLevel": 61,
            "currentEnergy": 442.51,
            "currentHealth": 567,
            "baseStats": { ... },
            "equipment": { ... },
            "talents": { ... },
            "buffs": { ... }
          }]
        ]
      }
    }
  ]
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | ID de la tache donjon (pour cancel) |
| `dungeon_id` | number | ID du donjon |
| `character_ids` | array | IDs des personnages dans le donjon |
| `is_active` | boolean | Donjon en cours |
| `current_room` | number | Salle actuelle (1-5) |
| `chain_position` | number | Position dans la chaine |
| `chain_total` | number | Total de runs dans la chaine |
| `auto_chain` | boolean | Enchainement automatique actif |
| `task_result` | object | Resultats detailles du combat |

#### `task_result.combatStats` - Stats de combat du donjon

| Champ | Type | Description |
|-------|------|-------------|
| `damageDealt` | number | Degats infliges |
| `damageTaken` | number | Degats recus |
| `healthLost` | number | PV perdus |
| `healthRecovered` | number | PV regagnes |
| `energyUsed` | number | Energie utilisee |
| `energyRecovered` | number | Energie regagnee |
| `totalAttacks` | number | Nombre d'attaques |
| `criticalHits` | number | Coups critiques |
| `criticalHitRate` | number | Taux de critique (%) |
| `totalBlocks` | number | Blocs effectues |
| `totalDodges` | number | Esquives effectuees |
| `monstersKilled` | number | Monstres tues |

---

### 3.11 `idleCombat` - Combat idle

```json
{
  "idleCombat": {
    "in_combat": false
  }
}
```

Ou si en combat :

```json
{
  "idleCombat": {
    "in_combat": true,
    "session_id": "combat_xxx",
    "location_id": 7,
    "participant_stats": {
      "damage_dealt": 159322.99,
      "damage_taken": 633.11,
      "monsters_killed": 145,
      "exp_earned": 435,
      "gold_earned": 435,
      "actions_performed": 10216,
      "current_hp": 263,
      "max_hp": 263,
      "hp_percentage": 100
    },
    "current_monster": {
      "name": "Mud Golem",
      "level": 8,
      "hp_percentage": 14
    }
  }
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `in_combat` | boolean | En combat ou non |
| `session_id` | string | ID de la session de combat |
| `location_id` | number | ID de la zone de combat |
| `participant_stats.damage_dealt` | number | Degats totaux infliges |
| `participant_stats.damage_taken` | number | Degats totaux recus |
| `participant_stats.monsters_killed` | number | Monstres tues |
| `participant_stats.exp_earned` | number | XP gagnee |
| `participant_stats.gold_earned` | number | Or gagne |
| `participant_stats.current_hp` | number | PV actuels |
| `participant_stats.max_hp` | number | PV max |
| `participant_stats.hp_percentage` | number | Pourcentage de PV |
| `current_monster` | object | Monstre actuel (name, level, hp_percentage) |

---

### 3.12 `party` - Groupe

```json
{
  "party": {
    "party_id": "1da78404-98e8-4ddd-ace7-930f9f52744f",
    "leader_id": "9e595d41-94f3-4fdd-a285-59a01802c354",
    "max_size": 4,
    "created_at": "2025-12-16 12:55:32.491277+00",
    "members": [
      {
        "character_id": "9e595d41-94f3-4fdd-a285-59a01802c354",
        "name": "Seisen",
        "pfp": "https://cdn.degendungeon.com/Profiles/mortyn.png",
        "cover": "https://cdn.degendungeon.com/Profiles/covers/character_bg.jpg",
        "location": "Happyville",
        "class": "mage",
        "total_level": "61",
        "role": "leader",
        "joined_at": "2025-12-16 12:55:32.509451+00"
      }
    ]
  }
}
```

---

### 3.13 `bankInventory` et `bankStatus` - Banque

```json
{
  "bankInventory": [
    {
      "id": "7f5d8a86-9283-44c4-9a26-946a68ded168",
      "character_id": "9e595d41-94f3-4fdd-a285-59a01802c354",
      "item_id": 706,
      "quantity": 81,
      "created_at": "2025-11-03 08:01:10.48436",
      "rarity": null,
      "efficiency": null,
      "affix_stats": null
    }
  ],
  "bankStatus": {
    "bank_inventory_count": 12,
    "total_bank_inventory": 24
  }
}
```

Meme structure que l'inventaire normal.

---

### 3.14 `activePlayerStats` - Statistiques du joueur

```json
{
  "activePlayerStats": {
    "character_id": "9e595d41-94f3-4fdd-a285-59a01802c354",
    "consecutive_days_streak": 0,
    "monsters_killed": 0,
    "dungeons_completed": 0,
    "total_idle_hours": 0,
    "last_updated": "2025-12-16T16:01:31.497Z"
  }
}
```

---

### 3.15 Autres champs

| Champ | Type | Description |
|-------|------|-------------|
| `selectedSubclass` | string | Sous-classe selectionnee |
| `talentEffects` | object | Effets des talents (copie de `talentProgression.talentEffects`) |
| `partyInvites` | array | Invitations de groupe recues |
| `sentPartyInvites` | array | Invitations de groupe envoyees |
| `friends` | array | Liste d'amis |
| `altarTasks` | object/null | Taches d'autel (event) |
| `marketClaims` | array | Reclamations du marche |
| `trades` | array | Historique des echanges |
| `unreadMailCount` | number | Nombre de mails non lus |
| `inventoryStatus` | object | Resume de l'inventaire + banque |
| `skillLevels` | object | Niveaux de competences (generalement vide, utiliser `skills`) |
| `combatState` | object | Etat du combat (generalement vide) |
| `activePotionEffects` | array | Effets de potions actifs |

---

## 4. Autres endpoints utiles

### 4.1 GET `characters/all`

Liste tous les personnages du compte.

```javascript
const data = await apiCall('characters/all');
// data.characters = [{ id, name, class, pfp, ... }, ...]
```

```json
{
  "success": true,
  "characters": [
    {
      "id": "9e595d41-94f3-4fdd-a285-59a01802c354",
      "name": "Seisen",
      "class": "mage",
      "pfp": "https://cdn.degendungeon.com/Profiles/mortyn.png",
      "total_level": "61"
    }
  ]
}
```

---

### 4.2 GET `batch/periodic-status/{characterId}`

Version allegee pour polling frequent. Contient les taches actives, le combat, le groupe et la balance de gems.

```javascript
const data = await apiCall(`batch/periodic-status/${characterId}`);
```

---

### 4.3 GET `idle-combat/status/{characterId}`

Stats de combat detaillees avec combat_log complet.

---

### 4.4 GET `dungeons/history/{characterId}?activeOnly=true&page=1&limit=10`

Donjons actifs et historique.

---

### 4.5 GET `worldboss/schedule?limit=5`

Schedule des prochains World Boss.

```json
{
  "success": true,
  "data": [
    {
      "id": "wb-uuid",
      "status": "queuing",
      "queue_count": 42,
      "time_until_spawn": "5m 30s",
      "boss": {
        "name": "Ancient Dragon",
        "level": 50,
        "location": "Dragon's Lair",
        "image_url": "https://..."
      }
    }
  ]
}
```

---

### 4.6 GET `guilds/character/{characterId}`

Informations sur la guilde du personnage.

```json
{
  "success": true,
  "guild": {
    "id": "guild-uuid",
    "name": "Guild Name",
    ...
  }
}
```

---

## 5. Endpoints POST (actions)

### 5.1 POST `tasks/{taskId}/restart`

Redemarrer une tache terminee.

```javascript
await apiPost(`tasks/${taskId}/restart`, {
  characterId: characterId
});
```

---

### 5.2 POST `idle-combat/join`

Rejoindre un combat idle.

```javascript
await apiPost('idle-combat/join', {
  characterId: characterId,
  combatId: locationId  // ID de la zone
});
```

---

### 5.3 POST `idle-combat/leave`

Quitter un combat idle.

```javascript
await apiPost('idle-combat/leave', {
  characterId: characterId
});
```

---

### 5.4 POST `dungeons/start`

Demarrer un donjon.

```javascript
await apiPost('dungeons/start', {
  characterIds: [characterId],
  dungeonId: dungeonId,
  leaderId: characterId,
  chainLength: 16,
  mode: 'solo'
});
```

---

### 5.5 POST `dungeons/cancel/{taskId}`

Annuler un donjon en cours.

```javascript
await apiPost(`dungeons/cancel/${taskId}`, {
  characterId: characterId
});
```

---

### 5.6 POST `worldboss/queue/{worldBossId}`

Rejoindre la queue d'un World Boss.

```javascript
await apiPost(`worldboss/queue/${worldBossId}`, {
  characterId: characterId
});
```

---

### 5.7 POST `map/{characterId}/teleport/managed`

Teleporter un personnage.

```javascript
await apiPost(`map/${characterId}/teleport/managed`, {
  locationName: "Dragon's Lair",
  cancel: {
    tasks: true,
    altar: true,
    idleCombat: true,
    dungeon: true,
    worldBossQueues: true
  },
  dryRun: false
});
```

---

### 5.8 POST `guilds/{guildId}/donate`

Faire une donation a la guilde.

```javascript
await apiPost(`guilds/${guildId}/donate`, {
  characterId: characterId,
  resource: "gold",
  quantity: 100
});
```

---

## 6. Exemple complet : Code minimal

Voici un exemple minimal de userscript qui capture le token et recupere les donnees d'un personnage :

```javascript
// ==UserScript==
// @name         DegenIdle Data Fetcher
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Capture token and fetch character data
// @match        https://degenidle.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  const API_ROOT = "https://api-v1.degenidle.com/api/";

  // ============================================
  // TOKEN MANAGER
  // ============================================
  const TokenManager = {
    authToken: null,
    onTokenCapturedCallbacks: [],

    update(token) {
      if (token && token !== this.authToken) {
        const isFirstCapture = !this.authToken;
        this.authToken = token;
        console.log('[TokenManager] Token captured!');
        if (isFirstCapture) {
          this.onTokenCapturedCallbacks.forEach(cb => cb());
        }
      }
    },

    registerCallback(callback) {
      this.onTokenCapturedCallbacks.push(callback);
    },

    isReady() {
      return !!this.authToken;
    }
  };

  // ============================================
  // FETCH INTERCEPTOR
  // ============================================
  const originalFetch = window.fetch;

  window.fetch = async function(...args) {
    const [url, options] = args;
    const urlStr = typeof url === 'string' ? url : url?.url || '';

    if (urlStr.includes('api-v1.degenidle.com') && options?.headers) {
      let authHeader = null;
      if (options.headers instanceof Headers) {
        authHeader = options.headers.get('Authorization');
      } else if (typeof options.headers === 'object') {
        authHeader = options.headers['Authorization'] || options.headers['authorization'];
      }
      if (authHeader) {
        TokenManager.update(authHeader);
      }
    }

    return originalFetch.apply(this, args);
  };

  // ============================================
  // XHR INTERCEPTOR
  // ============================================
  const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  const originalXHROpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = url;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
    if (name.toLowerCase() === 'authorization' && this._url?.includes('api-v1.degenidle.com')) {
      TokenManager.update(value);
    }
    return originalXHRSetRequestHeader.apply(this, arguments);
  };

  // ============================================
  // API FUNCTIONS
  // ============================================
  async function apiCall(endpoint) {
    if (!TokenManager.isReady()) {
      throw new Error('Token not available');
    }

    const response = await originalFetch(`${API_ROOT}${endpoint}`, {
      headers: {
        'Authorization': TokenManager.authToken,
        'Accept': 'application/json',
        'Origin': 'https://degenidle.com',
        'Referer': 'https://degenidle.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  }

  // ============================================
  // MAIN SCRIPT
  // ============================================
  async function main() {
    console.log('[Script] Token ready, fetching data...');

    // Get all characters
    const charList = await apiCall('characters/all');
    console.log('[Script] Characters:', charList.characters);

    // Get full data for first character
    if (charList.characters && charList.characters.length > 0) {
      const charId = charList.characters[0].id;
      const fullData = await apiCall(`characters/${charId}/all-data`);
      console.log('[Script] Full data:', fullData.data);

      // Example: log skills XP
      console.log('[Script] Skills XP:', fullData.data.skills);
    }
  }

  // Wait for token then run
  TokenManager.registerCallback(main);

  console.log('[Script] Waiting for token... Navigate in the game to trigger API calls.');
})();
```

---

## Notes importantes

1. **Le token expire** apres quelques heures. Le jeu le rafraichit automatiquement, et votre intercepteur capturera le nouveau token.

2. **Rate limiting** : Evitez de faire trop de requetes rapidement. Ajoutez des delais entre les appels (500-1500ms).

3. **`originalFetch`** : Utilisez toujours `originalFetch` (la version non-interceptee) pour vos propres appels API, sinon vous risquez des boucles infinies.

4. **UUIDs** : Les IDs de personnages, items, taches, etc. sont des UUIDs (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

5. **item_id vs id** : 
   - `item_id` = type d'item (ex: 301 = Iron Pickaxe)
   - `id` = instance unique de l'item dans l'inventaire

---

*Derniere mise a jour : Decembre 2025*
