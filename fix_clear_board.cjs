const fs = require('fs');
let code = fs.readFileSync('src/components/VirtualWhiteboard.tsx', 'utf8');

const clearStr = `  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear the entire whiteboard? This cannot be undone easily.')) {
      pushHistory();
      setTexts([]);
      setStickies([]);
      setImages([]);
      setCurrentStroke(null);
      setActiveTextInput(null);
      showToast('Whiteboard cleared');
    }
  };`;

const newClearStr = `  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear the entire whiteboard? This cannot be undone easily.')) {
      pushHistory();
      setStrokes([]);
      setTexts([]);
      setStickies([]);
      setImages([]);
      setCurrentStroke(null);
      setActiveTextInput(null);
      showToast('Whiteboard cleared');
    }
  };`;

code = code.replace(clearStr, newClearStr);
fs.writeFileSync('src/components/VirtualWhiteboard.tsx', code);
console.log('Fixed clear button');
