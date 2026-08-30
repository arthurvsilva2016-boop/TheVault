with open("src/components/StudentApp.tsx", "r") as f:
    content = f.read()

target = """            {activeTab === 'grades' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-100">
                    Academic Grades & Evaluation
                  </h1>
                </div>

                <div className="space-y-3">"""

replacement = """            {activeTab === 'grades' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-100">
                    Academic Grades & Evaluation
                  </h1>
                  <button 
                    onClick={handleDownloadGradesPDF}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition shadow-lg text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    Share PDF
                  </button>
                </div>

                <div id="grades-summary-container" className="space-y-3 p-2 bg-brand-dark rounded-xl">
                  {/* Header for PDF */}
                  <div className="mb-2 text-center pb-2 border-b border-brand-border/50">
                    <h2 className="text-lg font-bold text-slate-100">{student.name}</h2>
                    <p className="text-xs text-slate-400">Academic Performance Summary</p>
                  </div>
                  
                  <div className="space-y-3">"""

# Close the new div correctly.
# The original has:
#                 </div>
#               </div>
#             )}
# We need to add one more `</div>` at the end of the grades tab to close `grades-summary-container`.

target_close = """                      No grades recorded yet. Grades will appear after class reviews!
                    </div>
                  )}
                </div>
              </div>
            )}"""

replacement_close = """                      No grades recorded yet. Grades will appear after class reviews!
                    </div>
                  )}
                </div>
                </div>
              </div>
            )}"""

content = content.replace(target, replacement)
content = content.replace(target_close, replacement_close)

with open("src/components/StudentApp.tsx", "w") as f:
    f.write(content)
