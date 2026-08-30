with open("src/components/GroupProfile.tsx", "r") as f:
    content = f.read()

target = """              <div className="flex justify-between border-b border-brand-border/50 pb-2 items-center">
                <span className="text-slate-400">Group Code Number:</span>
                <span className="text-slate-200 font-mono font-bold cursor-not-allowed opacity-80">{group.code}</span>
              </div>"""

replacement = """              <div className="flex justify-between border-b border-brand-border/50 pb-2 items-center">
                <span className="text-slate-400">Group Name:</span>
                {isEditing ? (
                  <input type="text" placeholder="e.g. Super English" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-right w-48" />
                ) : <span className="text-slate-200 font-bold">{group.name || '-'}</span>}
              </div>
              <div className="flex justify-between border-b border-brand-border/50 pb-2 items-center">
                <span className="text-slate-400">Cover Image URL:</span>
                {isEditing ? (
                  <input type="text" placeholder="https://..." value={editData.coverImage || ''} onChange={e => setEditData({...editData, coverImage: e.target.value})} className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-right w-48" />
                ) : <span className="text-slate-200 truncate max-w-[200px]">{group.coverImage || '-'}</span>}
              </div>
              <div className="flex justify-between border-b border-brand-border/50 pb-2 items-center">
                <span className="text-slate-400">Group Code Number:</span>
                <span className="text-slate-200 font-mono font-bold cursor-not-allowed opacity-80">{group.code}</span>
              </div>"""

content = content.replace(target, replacement)
with open("src/components/GroupProfile.tsx", "w") as f:
    f.write(content)
