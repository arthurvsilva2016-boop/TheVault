const fs = require('fs');
let code = fs.readFileSync('src/components/game/VoxelWorld.ts', 'utf8');
code = code.replace(
  "return () => this.listeners.delete(listener);",
  "return () => { this.listeners.delete(listener); };"
);
fs.writeFileSync('src/components/game/VoxelWorld.ts', code);
