const fs = require('fs');
let text = fs.readFileSync('src/components/CollectionsManager.tsx', 'utf8');

const createModal = `
      {/* CREATE COLLECTION MODAL */}
      {isCreatingCollection && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-lg rounded-xl border border-brand-border shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center p-4 border-b border-brand-border">
              <h3 className="text-sm font-bold text-slate-100 flex items-center">
                <FolderPlus className="w-4 h-4 mr-2 text-purple-400" />
                Create New Collection
              </h3>
              <button type="button" onClick={() => setIsCreatingCollection(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCollection} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Collection Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Next Level English"
                  value={newColName}
                  onChange={e => setNewColName(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                <select
                  value={newColCategory}
                  onChange={e => setNewColCategory(e.target.value as BookCollection['category'])}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="General English">General English</option>
                  <option value="Business English">Business English</option>
                  <option value="Exam Prep (IELTS/TOEFL)">Exam Prep (IELTS/TOEFL)</option>
                  <option value="Young Learners">Young Learners</option>
                  <option value="Specialized">Specialized</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  placeholder="Brief summary of the collection..."
                  value={newColDescription}
                  onChange={e => setNewColDescription(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 min-h-[80px]"
                />
              </div>
              
              <div className="bg-brand-dark p-3 rounded-lg border border-brand-border">
                <label className="block text-[11px] font-semibold text-slate-400 mb-2">Initial Volume Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Vol 1, Basic, Starter"
                  value={initialVolumeName}
                  onChange={e => setInitialVolumeName(e.target.value)}
                  className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Leave empty to create collection without any volumes initially.</p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCollection(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

text = text.replace("{/* DELETE COLLECTION CONFIRM MODAL */}", createModal + "\n      {/* DELETE COLLECTION CONFIRM MODAL */}");

fs.writeFileSync('src/components/CollectionsManager.tsx', text);
