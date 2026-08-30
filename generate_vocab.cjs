const fs = require('fs');

const items = [
  "Oak wood", "Pine wood", "Birch wood", "Maple wood", "Spruce wood", "Ash wood", "Mahogany wood", "Cedar wood", "Willow branch", "Yew wood", "Bamboo", "Driftwood", "Tree bark", "Pinecone", "Acorn", "Wood sap", "Pine resin", "Rubber latex", "Cork", "Palm frond", 
  "Granite", "Basalt", "Limestone", "Sandstone", "Slate", "Marble", "Obsidian", "Flint", "Quartz", "Shale", "Pumice", "Chalk", "River rock", "Gravel", "Geode", "Talc", "Gypsum", "Mica", "Jade", "Amethyst", 
  "Iron ore", "Copper ore", "Tin ore", "Zinc ore", "Lead ore", "Silver ore", "Gold ore", "Platinum ore", "Bauxite (Aluminum ore)", "Nickel ore", "Cobalt ore", "Coal", "Lignite", "Peat", "Sulfur", "Saltpeter", "Rock salt", "Cinnabar", "Lodestone", "Alum", 
  "Cotton boll", "Flax stem", "Hemp fiber", "Jute", "Sisal", "Silk cocoon", "Spider silk", "Wool fleece", "Cashmere", "Alpaca fleece", "Down feather", "Flight feather", "Animal hair", "Horsehair", 
  "Straw", "Hay", "Reed", "Cattail", "Vine", "Kelp", 
  "Cowhide", "Pigskin", "Sheepskin", "Deerskin", "Bear pelt", "Wolf pelt", "Fox pelt", "Rabbit pelt", "Beaver pelt", "Seal skin", "Crocodile scales", "Snake skin", "Fish scales", "Turtle shell", "Snail shell", "Oyster shell", "Clam shell", "Crab shell", "Lobster carapace", "Coral", 
  "Animal bone", "Animal skull", "Rib bone", "Femur", "Ivory tusk", "Boar tusk", "Deer antler", "Moose antler", "Bull horn", "Ram horn", "Animal tooth", "Shark tooth", "Bear claw", "Eagle talon", "Porcupine quill", "Animal sinew", "Animal intestine", "Animal bladder", "Leather scrap", "Rawhide", 
  "Wild carrot", "Wild potato", "Turnip", "Radish", "Onion bulb", "Garlic clove", "Ginger root", "Ginseng root", "Cassava root", "Beetroot", 
  "Blueberry", "Blackberry", "Raspberry", "Strawberry", "Cranberry", "Elderberry", "Juniper berry", "Apple", "Pear", "Peach", 
  "Raw beef", "Raw pork", "Raw mutton", "Venison", "Rabbit meat", "Bear meat", "Raw poultry", "Pheasant meat", "Duck meat", "Raw fish", "Salmon", "Trout", "Cod", "Eel", "Animal fat (Tallow)", "Lard", "Blubber", "Animal liver", "Animal heart", "Bird egg", 
  "Fresh water", "Salt water", "Rainwater", "Morning dew", "Ice chunk", "Snowball", 
  "Honeycomb", "Raw honey", "Beeswax", "Maple syrup", "Aloe vera gel", "Natural rubber", "Amber", "Tar", "Pitch", "Animal blood", "Venom gland", "Ink sac", "Musk gland", "Guano", 
  "Topsoil", "Potting soil", "Peat moss", "River mud", "Swamp muck", "Sand", "Silica sand", "Red clay", "White clay (Kaolin)", "Terracotta clay", "Silt", "Loam", "Volcanic ash", "Charcoal", "Wood ash", "Bone meal", "Seashell dust", "Crushed quartz", "Seaweed", "Moss"
];

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const vocab = items.map(item => {
  const id = item.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `  { id: '${id}', era: 'stone', color: '${getRandomColor()}', nativeWord: '${item}', targetWord: '${item}' }`; // Mock translation
});

let output = `export interface VocabularyBlock {
  id: string;
  era: 'stone' | 'bronze' | 'iron' | 'medieval' | 'industrial' | 'modern';
  color: string;
  nativeWord: string;
  targetWord: string;
}

export const vocabData: VocabularyBlock[] = [
${vocab.join(',\n')}
];
`;

fs.writeFileSync('src/components/game/vocabData.ts', output);
