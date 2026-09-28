const fs = require('fs');
let code = fs.readFileSync('src/components/VirtualWhiteboard.tsx', 'utf8');

const colorPickerStr = `
            {COLOR_PALETTE.map(c => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                style={{ backgroundColor: c }}
                className={\`w-4 h-4 rounded-full transition-transform cursor-pointer \${
                  selectedColor === c ? 'scale-125 ring-2 ring-purple-400 ring-offset-1 ring-offset-slate-900' : 'hover:scale-110 opacity-80'
                }\`}
                title={\`Color: \${c}\`}
              />
            ))}
            <div className="w-px h-3 bg-slate-700 mx-1" />
            <input 
              type="color" 
              value={selectedColor} 
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
              title="Custom Color"
            />
`;

code = code.replace(
  /\{COLOR_PALETTE\.map\(c => \([\s\S]*?\}\)\)\}/m,
  colorPickerStr
);

fs.writeFileSync('src/components/VirtualWhiteboard.tsx', code);
