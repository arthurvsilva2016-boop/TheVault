with open("src/components/StudentProfile.tsx", "r") as f:
    content = f.read()

import re
# update state
content = content.replace("useState<'overview' | 'occurrences' | 'finance'>('overview');", "useState<'overview' | 'occurrences' | 'finance' | 'grades'>('overview');")

# add to nav
target_nav = """          <button 
            onClick={() => setProfileView('finance')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition cursor-pointer whitespace-nowrap ${profileView === 'finance' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t('finance', 'Financials')}
          </button>"""

replacement_nav = """          <button 
            onClick={() => setProfileView('finance')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition cursor-pointer whitespace-nowrap ${profileView === 'finance' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t('finance', 'Financials')}
          </button>
          <button 
            onClick={() => setProfileView('grades')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition cursor-pointer whitespace-nowrap ${profileView === 'grades' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Grades & Homework
          </button>"""

content = content.replace(target_nav, replacement_nav)

# add grades view logic
target_view = """      {profileView === 'finance' && ("""

replacement_view = """      {/* GRADES VIEW */}
      {profileView === 'grades' && (
        <div className="space-y-6">
          <div className="bg-brand-card rounded-xl border border-brand-border p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-200 mb-4 border-b border-brand-border/50 pb-2 flex items-center gap-2">
              <span className="bg-purple-500/20 text-purple-300 p-1.5 rounded-lg">🎓</span>
              Academic Performance & Grades
            </h3>
            
            <div className="space-y-4">
              {classSessions
                .filter(session => session.grades && session.grades.some(g => g.studentId === student.id))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((session) => {
                  const myGrade = session.grades!.find(g => g.studentId === student.id);
                  if (!myGrade) return null;
                  return (
                    <div key={session.id} className="bg-brand-dark rounded-xl border border-brand-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-purple-400 font-mono">{session.date}</span>
                          <span className="text-xs bg-brand-card px-2 py-0.5 rounded border border-brand-border text-slate-300">{session.groupCode}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-200">{session.topic}</h4>
                        <p className="text-xs text-slate-500 mt-1">Teacher: {session.teacher}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="bg-brand-card border border-brand-border rounded-lg p-2 flex flex-col items-center justify-center w-16">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Speak</span>
                          <span className="text-sm font-black text-slate-200">{myGrade.speaking || '-'}</span>
                        </div>
                        <div className="bg-brand-card border border-brand-border rounded-lg p-2 flex flex-col items-center justify-center w-16">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Listen</span>
                          <span className="text-sm font-black text-slate-200">{myGrade.listening || '-'}</span>
                        </div>
                        <div className="bg-brand-card border border-brand-border rounded-lg p-2 flex flex-col items-center justify-center w-16">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">HW</span>
                          <span className="text-sm font-black text-slate-200">{myGrade.homework || '-'}</span>
                        </div>
                      </div>
                    </div>
                  );
              })}
              
              {classSessions.filter(session => session.grades && session.grades.some(g => g.studentId === student.id)).length === 0 && (
                <div className="text-center p-8 text-slate-500 border border-dashed border-brand-border rounded-xl bg-brand-dark/50">
                  No grades or homework records found for this student.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {profileView === 'finance' && ("""

content = content.replace(target_view, replacement_view)

with open("src/components/StudentProfile.tsx", "w") as f:
    f.write(content)
