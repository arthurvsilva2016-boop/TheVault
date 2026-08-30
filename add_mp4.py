with open("src/components/GroupProfile.tsx", "r") as f:
    content = f.read()

target = """                        </div>
                      </div>

                      {/* Attached Class Whiteboard Files Strip */}"""

replacement = """                        </div>
                      </div>

                      {isPast && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-brand-border/50">
                          <span className="text-xs text-slate-400 flex items-center gap-1"><Video className="w-3.5 h-3.5 text-sky-400"/> Recording available (expires in 7 days)</span>
                          <button onClick={() => alert('Downloading recording... (Mock)')} className="ml-auto px-2 py-1 bg-sky-900/30 hover:bg-sky-900/50 text-sky-300 rounded border border-sky-500/30 text-[11px] font-bold transition cursor-pointer">
                            Download MP4
                          </button>
                        </div>
                      )}

                      {/* Attached Class Whiteboard Files Strip */}"""

content = content.replace(target, replacement)

with open("src/components/GroupProfile.tsx", "w") as f:
    f.write(content)
