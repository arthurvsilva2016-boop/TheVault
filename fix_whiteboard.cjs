const fs = require('fs');
let code = fs.readFileSync('src/components/VirtualWhiteboard.tsx', 'utf8');

// 1. Fix canvas alignment
code = code.replace(
`  const updateCanvasSize = () => {
    if (containerRef.current && canvasRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        redrawCanvas();
      }
    }
  };`,
`  const updateCanvasSize = () => {
    if (canvasRef.current && canvasRef.current.parentElement) {
      const rect = canvasRef.current.parentElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        redrawCanvas();
      }
    }
  };`);

code = code.replace(
`    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }`,
`    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    if (canvasRef.current && canvasRef.current.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }`);

// 2. Add shape drawing tools (rect, circle, line, arrow) to toolbar.
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

code = code.replace(`          {/* Eraser (Real Cutout) */}`, toolReplacement + `\n          {/* Eraser (Real Cutout) */}`);

// Add dragging text logic
const stateReplacement = `
  const [activeTextInput, setActiveTextInput] = useState<{x: number, y: number, text: string} | null>(null);
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
`;
code = code.replace(`  const [activeTextInput, setActiveTextInput] = useState<{x: number, y: number, text: string} | null>(null);`, stateReplacement);

// Handle text move
const handleTextMoveReplacement = `
  const handleStickyMouseMove = (e: React.MouseEvent) => {
    if ((!draggingStickyId && !draggingTextId) || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldX = (screenX - pan.x) / zoom - dragOffset.x;
    const worldY = (screenY - pan.y) / zoom - dragOffset.y;

    if (draggingStickyId) {
       setStickies(prev => prev.map(s => s.id === draggingStickyId ? { ...s, x: worldX, y: worldY } : s));
    } else if (draggingTextId) {
       setTexts(prev => prev.map(t => t.id === draggingTextId ? { ...t, x: worldX, y: worldY } : t));
    }
  };

  const handleStickyMouseUp = () => {
    if (draggingStickyId) setDraggingStickyId(null);
    if (draggingTextId) setDraggingTextId(null);
  };
`;
code = code.replace(/const handleStickyMouseMove.*?\n  };\n\n  const handleStickyMouseUp = \(\) => {.*?\n  };\n/s, handleTextMoveReplacement);


// Remove rendering texts from canvas
const drawTextsStr = `
    // Texts
    texts.forEach(t => {
      ctx.save();
      ctx.font = \`600 \${t.fontSize}px sans-serif\`;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });
`;
code = code.replace(drawTextsStr, '');

// DOM Text Elements
const domTextsStr = `
          {/* DRAGGABLE / EDITABLE TEXTS */}
          {texts.map(text => (
            <div
              key={text.id}
              style={{ left: \`\${text.x}px\`, top: \`\${text.y}px\`, color: text.color, fontSize: \`\${text.fontSize}px\` }}
              className="absolute pointer-events-auto group cursor-move select-none animate-fadeIn"
              onMouseDown={(e) => {
                if (selectedTool === 'eraser') {
                  pushHistory();
                  setTexts(prev => prev.filter(t => t.id !== text.id));
                  return;
                }
                if (editingTextId === text.id) return;
                pushHistory();
                setDraggingTextId(text.id);
                const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
                const screenX = e.clientX - rect.left;
                const screenY = e.clientY - rect.top;
                const worldX = (screenX - pan.x) / zoom;
                const worldY = (screenY - pan.y) / zoom;
                setDragOffset({
                  x: worldX - text.x,
                  y: worldY - text.y
                });
              }}
              onDoubleClick={() => setEditingTextId(text.id)}
            >
              {editingTextId === text.id ? (
                <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-md border border-purple-500">
                  <input
                    autoFocus
                    type="text"
                    value={text.text}
                    onChange={(e) => setTexts(prev => prev.map(t => t.id === text.id ? { ...t, text: e.target.value } : t))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') setEditingTextId(null);
                    }}
                    className="bg-transparent font-semibold text-inherit focus:outline-none w-48"
                  />
                  <div className="flex flex-col gap-1">
                    <button onClick={() => setTexts(prev => prev.map(t => t.id === text.id ? { ...t, fontSize: t.fontSize + 2 } : t))} className="bg-slate-700 hover:bg-slate-600 rounded px-1 text-[10px] text-white">+</button>
                    <button onClick={() => setTexts(prev => prev.map(t => t.id === text.id ? { ...t, fontSize: Math.max(10, t.fontSize - 2) } : t))} className="bg-slate-700 hover:bg-slate-600 rounded px-1 text-[10px] text-white">-</button>
                  </div>
                  <button onClick={() => setEditingTextId(null)} className="p-1 bg-purple-600 hover:bg-purple-500 text-white rounded">
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -top-6 -right-6 opacity-0 group-hover:opacity-100 transition z-30 flex gap-1 bg-slate-900/90 rounded-md p-1 border border-brand-border">
                    <button
                      onClick={() => setEditingTextId(text.id)}
                      className="p-1 hover:text-sky-400 transition cursor-pointer text-slate-300"
                      title="Edit Text"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        pushHistory();
                        setTexts(prev => prev.filter(t => t.id !== text.id));
                      }}
                      className="p-1 hover:text-rose-400 transition cursor-pointer text-slate-300"
                      title="Delete Text"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-semibold whitespace-pre font-sans" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{text.text}</span>
                </div>
              )}
            </div>
          ))}
`;

code = code.replace(`          {/* DRAGGABLE / EDITABLE STICKY NOTES */}`, domTextsStr + `\n          {/* DRAGGABLE / EDITABLE STICKY NOTES */}`);

// Allow resizing stickies as well
const stickyReplace = `<textarea
                  value={sticky.text}
                  onChange={(e) => {
                    setStickies(prev => prev.map(s => s.id === sticky.id ? { ...s, text: e.target.value } : s));
                  }}
                  className="w-full bg-transparent border-none outline-none resize-none text-sm font-medium text-amber-950 placeholder-amber-900/40 min-h-[100px]"
                  placeholder="Type a note..."
                />`;
const newStickyReplace = `<textarea
                  value={sticky.text}
                  onChange={(e) => {
                    setStickies(prev => prev.map(s => s.id === sticky.id ? { ...s, text: e.target.value } : s));
                  }}
                  className="w-full bg-transparent border-none outline-none resize-y text-sm font-medium text-amber-950 placeholder-amber-900/40 min-h-[100px]"
                  placeholder="Type a note..."
                />`;

code = code.replace(stickyReplace, newStickyReplace);

fs.writeFileSync('src/components/VirtualWhiteboard.tsx', code);
console.log('Done editing');
