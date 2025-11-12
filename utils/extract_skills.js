const fs = require('fs');

// Liste des skills à extraire
const skillsToExtract = [
    'woodcutting',
    'mining',
    'fishing',
    'herbalism',
    'tracking',
    'gathering',
    'forging',
    'leatherworking',
    'crafting',
    'cooking',
    'woodcrafting',
    'alchemy',
    'tailoring'
];

// Lire le fichier all_data.json
const allData = JSON.parse(fs.readFileSync('./all_data.json', 'utf8'));

console.log('Extraction des données des skills...\n');

let extractedCount = 0;

skillsToExtract.forEach(skill => {
    const dataKey = `${skill}_data`;
    
    if (allData[dataKey]) {
        try {
            // Parser le JSON stringifié
            const skillData = JSON.parse(allData[dataKey]);
            
            // Créer le fichier JSON pour ce skill
            const outputFile = `./${skill}_data.json`;
            fs.writeFileSync(outputFile, JSON.stringify(skillData, null, 2));
            
            console.log(`✓ ${skill}_data.json créé (${skillData.data?.skillItems?.length || 0} items)`);
            extractedCount++;
        } catch (error) {
            console.error(`✗ Erreur lors de l'extraction de ${skill}_data:`, error.message);
        }
    } else {
        console.warn(`⚠ ${dataKey} non trouvé dans all_data.json`);
    }
});

console.log(`\n${extractedCount}/${skillsToExtract.length} skills extraits avec succès!`);
