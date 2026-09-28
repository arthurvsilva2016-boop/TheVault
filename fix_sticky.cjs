const fs = require('fs');
let code = fs.readFileSync('src/components/VirtualWhiteboard.tsx', 'utf8');

const stickyDOMStr = `<div
              key={sticky.id}
              id={\`sticky-\${sticky.id}\`}
              style={{ left: \`\${sticky.x}px\`, top: \`\${sticky.y}px\` }}
              className="absolute pointer-events-auto w-44 rounded-xl p-3 shadow-xl border bg-amber-200 text-amber-950 border-amber-300 flex flex-col group cursor-move select-none animate-fadeIn"`;

const newStickyDOMStr = `<div
              key={sticky.id}
              id={\`sticky-\${sticky.id}\`}
              style={{ left: \`\${sticky.x}px\`, top: \`\${sticky.y}px\` }}
              className={\`absolute pointer-events-auto w-44 rounded-xl p-3 shadow-xl border flex flex-col group cursor-move select-none animate-fadeIn \${STICKY_COLORS.find(c => c.hex === sticky.color)?.bg || 'bg-amber-300 text-amber-950 border-amber-400'}\`}`;

code = code.replace(stickyDOMStr, newStickyDOMStr);

const stickyHeaderStr = `<div className="flex items-center justify-between pb-1 border-b border-amber-300/60 mb-1 text-[10px] font-bold text-amber-900/70">
                <span>{sticky.author || 'Sticky Note'}</span>
                <button
                  onClick={() => {
                    pushHistory();
                    setStickies(prev => prev.filter(s => s.id !== sticky.id));
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-700 transition cursor-pointer"
                  title="Delete note"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>`;

const newStickyHeaderStr = `<div className="flex flex-col gap-1 pb-1 border-b border-black/10 mb-1">
                <div className="flex items-center justify-between text-[10px] font-bold opacity-70">
                  <span>{sticky.author || 'Sticky Note'}</span>
                  <button
                    onClick={() => {
                      pushHistory();
                      setStickies(prev => prev.filter(s => s.id !== sticky.id));
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-700 transition cursor-pointer"
                    title="Delete note"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   {STICKY_COLORS.map(c => (
                     <button
                       key={c.hex}
                       onClick={() => setStickies(prev => prev.map(s => s.id === sticky.id ? { ...s, color: c.hex } : s))}
                       className={\`w-3 h-3 rounded-full border border-black/20 \${c.bg.split(' ')[0]} hover:scale-110 transition\`}
                       title={c.label}
                     />
                   ))}
                </div>
              </div>`;

code = code.replace(stickyHeaderStr, newStickyHeaderStr);
fs.writeFileSync('src/components/VirtualWhiteboard.tsx', code);
