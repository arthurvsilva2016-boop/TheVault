const fs = require('fs');
let code = fs.readFileSync('src/components/VirtualWhiteboard.tsx', 'utf8');

// Remove the tools I just injected since they already existed lower down
const toolReplacement = `
          {/* Rect */}
          <button
            id="wb-tool-rect"
            onClick={() => setSelectedTool('rect')}
            className={\`p-1.5 rounded-lg transition cursor-pointer \${
              selectedTool === 'rect' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }\`}
            title="Draw Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>
          
          {/* Circle */}
          <button
            id="wb-tool-circle"
            onClick={() => setSelectedTool('circle')}
            className={\`p-1.5 rounded-lg transition cursor-pointer \${
              selectedTool === 'circle' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }\`}
            title="Draw Circle"
          >
            <Circle className="w-4 h-4" />
          </button>
          
          {/* Line */}
          <button
            id="wb-tool-line"
            onClick={() => setSelectedTool('line')}
            className={\`p-1.5 rounded-lg transition cursor-pointer \${
              selectedTool === 'line' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }\`}
            title="Draw Line"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          {/* Arrow */}
          <button
            id="wb-tool-arrow"
            onClick={() => setSelectedTool('arrow')}
            className={\`p-1.5 rounded-lg transition cursor-pointer \${
              selectedTool === 'arrow' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }\`}
            title="Draw Arrow"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
`;

code = code.replace(toolReplacement, '');
fs.writeFileSync('src/components/VirtualWhiteboard.tsx', code);
