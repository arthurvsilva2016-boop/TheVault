const fs = require('fs');
let code = fs.readFileSync('src/components/StaffManager.tsx', 'utf8');

// Add newIsCoordinator
code = code.replace(
  "const [newIsMaster, setNewIsMaster] = useState(false);",
  "const [newIsMaster, setNewIsMaster] = useState(false);\n  const [newIsCoordinator, setNewIsCoordinator] = useState(false);"
);

// Add to Employee creation
code = code.replace(
  "isMaster: isMasterRole,",
  "isMaster: isMasterRole,\n      isCoordinator: newIsCoordinator,"
);

// Reset field
code = code.replace(
  "setNewIsMaster(false);",
  "setNewIsMaster(false);\n    setNewIsCoordinator(false);"
);

// Edit employee states
code = code.replace(
  "const [editIsMaster, setEditIsMaster] = useState(false);",
  "const [editIsMaster, setEditIsMaster] = useState(false);\n  const [editIsCoordinator, setEditIsCoordinator] = useState(false);"
);

// Set editing values
code = code.replace(
  "setEditIsMaster(emp.isMaster || false);",
  "setEditIsMaster(emp.isMaster || false);\n    setEditIsCoordinator(emp.isCoordinator || false);"
);

// Edit employee creation
code = code.replace(
  "isMaster: editIsMasterRole,",
  "isMaster: editIsMasterRole,\n      isCoordinator: editIsCoordinator,"
);

// UI for new employee
const newCheckboxes = `
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="newIsCoordinator"
                      checked={newIsCoordinator}
                      onChange={(e) => setNewIsCoordinator(e.target.checked)}
                      className="accent-purple-600 rounded bg-brand-dark border-brand-border cursor-pointer"
                    />
                    <label htmlFor="newIsCoordinator" className="text-xs text-slate-300 font-semibold cursor-pointer">
                      Grant Coordinator Functions
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">`;

code = code.replace(
  /<div className="flex items-center space-x-2">\s*<input\s*type="checkbox"\s*id="newIsAssociate"/,
  newCheckboxes + '\n                    <input type="checkbox" id="newIsAssociate"'
);

// UI for edit employee
const editCheckboxes = `
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="editIsCoordinator"
                      checked={editIsCoordinator}
                      onChange={(e) => setEditIsCoordinator(e.target.checked)}
                      className="accent-purple-600 rounded bg-brand-dark border-brand-border cursor-pointer"
                    />
                    <label htmlFor="editIsCoordinator" className="text-xs text-slate-300 font-semibold cursor-pointer">
                      Grant Coordinator Functions
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">`;

code = code.replace(
  /<div className="flex items-center space-x-2">\s*<input\s*type="checkbox"\s*id="editIsAssociate"/,
  editCheckboxes + '\n                    <input type="checkbox" id="editIsAssociate"'
);

fs.writeFileSync('src/components/StaffManager.tsx', code);
