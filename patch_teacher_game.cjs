const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherPortal.tsx', 'utf8');

const anchor = `        </div>\n      </div>`;
const button = `
      <div className="p-6 rounded-2xl border border-purple-500/20 bg-brand-card flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Vivlío (3D Game)</h3>
          <p className="text-sm text-slate-400">Enter the immersive 3D world.</p>
        </div>
        <button 
          onClick={() => onNavigate && onNavigate('game' as any, '')}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition"
        >
          Play Vivlío
        </button>
      </div>
`;
if (!code.includes("Play Vivlío")) {
  code = code.replace(anchor, anchor + button);
}

fs.writeFileSync('src/components/TeacherPortal.tsx', code);
