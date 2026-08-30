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

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

const vocab = items.map((item, index) => {
  const id = item.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const isWater = item.toLowerCase().includes('water');
  return `  { id: '${id}', index: ${index + 1}, color: '${stringToColor(item)}', name: '${item}', isWater: ${isWater} }`;
});

// also add a base dirt and grass
vocab.unshift(`  { id: 'grass', index: 0, color: '#3b82f6', name: 'Grass', isWater: false }`);

let output = `export interface BlockDef {
  id: string;
  index: number;
  color: string;
  name: string;
  isWater: boolean;
}

export const BLOCKS: BlockDef[] = [
${vocab.join(',\n')}
];

export const BLOCK_MAP = new Map(BLOCKS.map(b => [b.id, b]));
export const BLOCK_BY_INDEX = new Map(BLOCKS.map(b => [b.index, b]));
`;

fs.writeFileSync('src/components/game/vocabData.ts', output);
