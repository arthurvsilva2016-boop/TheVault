const fs = require('fs');
let code = fs.readFileSync('src/components/VirtualWhiteboard.tsx', 'utf8');

if (!code.includes('isInsertMenuOpen')) {
  code = code.replace(
    '  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);',
    '  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);\n  const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false);\n  const [insertMenuTab, setInsertMenuTab] = useState<\'shapes\'|\'annotations\'|\'emojis\'>(\'shapes\');'
  );
}

if (!code.includes('PlusCircle,')) {
  code = code.replace(
    '  RotateCcw\n} from \'lucide-react\';',
    '  RotateCcw,\n  PlusCircle,\n  Smile\n} from \'lucide-react\';'
  );
}

const targetStart = '<button\n            id="wb-tool-line"';
const targetEnd = '<StickyNote className="w-4 h-4 text-amber-400" />\n          </button>';

const p1 = code.indexOf(targetStart);
const p2 = code.indexOf(targetEnd) + targetEnd.length;

const insertReplacement = `
          {/* Text Tool */}
          <button
            id="wb-tool-text"
            onClick={() => setSelectedTool('text')}
            className={\`p-1.5 rounded-lg transition cursor-pointer \${
              selectedTool === 'text' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }\`}
            title="Insert Text"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* INSERT MENU (Shapes, Emojis, Annotations) */}
          <div className="relative">
            <button
              id="wb-tool-insert"
              onClick={() => setIsInsertMenuOpen(!isInsertMenuOpen)}
              className={\`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 \${
                isInsertMenuOpen || ['line', 'arrow', 'rect', 'circle', 'sticky'].includes(selectedTool) ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }\`}
              title="Insert Shapes, Annotations, Emojis"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
            
            {isInsertMenuOpen && (
              <div className="absolute top-12 left-0 w-64 bg-slate-900 border border-brand-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                <div className="flex border-b border-brand-border">
                  <button onClick={() => setInsertMenuTab('shapes')} className={\`flex-1 py-2 text-[10px] font-bold uppercase transition \${insertMenuTab === 'shapes' ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-slate-400 hover:bg-white/5'}\`}>Shapes</button>
                  <button onClick={() => setInsertMenuTab('annotations')} className={\`flex-1 py-2 text-[10px] font-bold uppercase transition \${insertMenuTab === 'annotations' ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-slate-400 hover:bg-white/5'}\`}>Notes</button>
                  <button onClick={() => setInsertMenuTab('emojis')} className={\`flex-1 py-2 text-[10px] font-bold uppercase transition \${insertMenuTab === 'emojis' ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-slate-400 hover:bg-white/5'}\`}>Emojis</button>
                </div>
                
                <div className="p-3">
                  {insertMenuTab === 'shapes' && (
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => { setSelectedTool('rect'); setIsInsertMenuOpen(false); }} className={\`p-2 rounded flex flex-col items-center gap-1 \${selectedTool === 'rect' ? 'bg-purple-500/30' : 'hover:bg-white/5'}\`}><Square className="w-5 h-5 text-slate-300" /><span className="text-[9px] text-slate-400">Rect</span></button>
                      <button onClick={() => { setSelectedTool('circle'); setIsInsertMenuOpen(false); }} className={\`p-2 rounded flex flex-col items-center gap-1 \${selectedTool === 'circle' ? 'bg-purple-500/30' : 'hover:bg-white/5'}\`}><Circle className="w-5 h-5 text-slate-300" /><span className="text-[9px] text-slate-400">Circle</span></button>
                      <button onClick={() => { setSelectedTool('line'); setIsInsertMenuOpen(false); }} className={\`p-2 rounded flex flex-col items-center gap-1 \${selectedTool === 'line' ? 'bg-purple-500/30' : 'hover:bg-white/5'}\`}><Minus className="w-5 h-5 text-slate-300" /><span className="text-[9px] text-slate-400">Line</span></button>
                      <button onClick={() => { setSelectedTool('arrow'); setIsInsertMenuOpen(false); }} className={\`p-2 rounded flex flex-col items-center gap-1 \${selectedTool === 'arrow' ? 'bg-purple-500/30' : 'hover:bg-white/5'}\`}><ArrowRight className="w-5 h-5 text-slate-300" /><span className="text-[9px] text-slate-400">Arrow</span></button>
                    </div>
                  )}
                  {insertMenuTab === 'annotations' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { setSelectedTool('sticky'); setIsInsertMenuOpen(false); }} className={\`p-2 rounded flex flex-col items-center gap-2 border border-slate-700 \${selectedTool === 'sticky' ? 'bg-amber-500/20 border-amber-500' : 'hover:bg-white/5'}\`}>
                        <StickyNote className="w-6 h-6 text-amber-400" />
                        <span className="text-[10px] text-slate-300">Sticky Note</span>
                      </button>
                      <button onClick={() => { document.getElementById('wb-tool-image')?.click(); setIsInsertMenuOpen(false); }} className="p-2 rounded flex flex-col items-center gap-2 border border-slate-700 hover:bg-white/5">
                        <ImageIcon className="w-6 h-6 text-emerald-400" />
                        <span className="text-[10px] text-slate-300">Image</span>
                      </button>
                    </div>
                  )}
                  {insertMenuTab === 'emojis' && (
                    <div className="grid grid-cols-6 gap-1 h-32 overflow-y-auto">
                      {['👍','👎','❤️','🔥','⭐','🎉','💡','🚀','👀','✅','❌','💯','😄','🤔','🙌','👏','🎨','📝','🔍','📌','⭐','⚠️','⛔','✅'].map(emoji => (
                        <button 
                          key={emoji}
                          onClick={() => {
                             pushHistory();
                             const newText = {
                                id: \`txt-\${Date.now()}\`,
                                x: -pan.x / zoom + (containerRef.current?.clientWidth || 800) / 2 / zoom,
                                y: -pan.y / zoom + (containerRef.current?.clientHeight || 600) / 2 / zoom,
                                text: emoji,
                                color: selectedColor,
                                fontSize: 48,
                                isEditing: false
                             };
                             setTexts(prev => [...prev, newText]);
                             setIsInsertMenuOpen(false);
                          }}
                          className="text-2xl hover:bg-white/10 rounded transition cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
`;

if (p1 > -1 && p2 > -1) {
  code = code.substring(0, p1) + insertReplacement + code.substring(p2);
  fs.writeFileSync('src/components/VirtualWhiteboard.tsx', code);
  console.log('Update successful');
} else {
  console.log('Target not found', p1, p2);
}
