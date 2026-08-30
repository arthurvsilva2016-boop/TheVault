with open("src/components/StudentApp.tsx", "r") as f:
    content = f.read()

import re

# Add 'files' to the activeTab type
content = re.sub(
    r"useState\<'overview' \| 'chat' \| 'whiteboard' \| 'calendar' \| 'grades' \| 'finance' \| 'profile'\>",
    "useState<'overview' | 'chat' | 'whiteboard' | 'calendar' | 'grades' | 'finance' | 'profile' | 'files'>",
    content
)

# Add nav item in Sidebar
nav_target = """  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'chat', label: 'Group Chat', icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'whiteboard', label: 'Whiteboard', icon: Presentation },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'grades', label: 'Grades', icon: Award },
    { id: 'finance', label: 'Financials', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: UserCircle }
  ];"""

nav_replacement = """  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'chat', label: 'Group Chat', icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'files', label: 'Files & Resources', icon: FolderOpen },
    { id: 'whiteboard', label: 'Whiteboard', icon: Presentation },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'grades', label: 'Grades', icon: Award },
    { id: 'finance', label: 'Financials', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: UserCircle }
  ];"""

content = content.replace(nav_target, nav_replacement)

# Add files tab render
files_render = """
            {/* ========================================================================= */}
            {/* TAB: FILES & RESOURCES                                                       */}
            {/* ========================================================================= */}
            {activeTab === 'files' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-100">Files & Resources</h1>
                </div>
                
                <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
                  <div className="p-4 border-b border-brand-border bg-brand-dark/50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-purple-400" />
                      Class Session Files
                    </h3>
                  </div>
                  <div className="p-4 divide-y divide-brand-border/30">
                    {groupSessions.length === 0 ? (
                       <div className="text-center p-6 text-slate-500 text-sm">No class sessions found.</div>
                    ) : groupSessions.map(session => {
                      const sessionWbFiles = session.whiteboardFiles || [];
                      const hasRecording = new Date(session.date).getTime() < new Date().setHours(0,0,0,0);
                      
                      if (sessionWbFiles.length === 0 && !hasRecording) return null;

                      return (
                        <div key={session.id} className="py-4 first:pt-0 last:pb-0">
                          <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                             <CalendarDays className="w-4 h-4 text-purple-400" />
                             {session.date} - {session.topic}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {sessionWbFiles.map((wb, idx) => (
                               <div key={idx} className="bg-slate-900 border border-brand-border rounded-lg p-3 flex flex-col justify-between hover:border-purple-500/50 transition">
                                 <div className="flex items-start gap-2 mb-3">
                                   <FileText className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                                   <div>
                                     <p className="text-xs font-semibold text-slate-200 line-clamp-2">{wb.title}</p>
                                     <p className="text-[10px] text-slate-500">{new Date(wb.timestamp).toLocaleDateString()}</p>
                                   </div>
                                 </div>
                                 <button onClick={() => setPreviewWhiteboardFile(wb)} className="w-full px-2 py-1 bg-brand-dark border border-brand-border text-xs text-slate-300 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1">
                                   <Eye className="w-3 h-3" /> View Whiteboard
                                 </button>
                               </div>
                            ))}
                            {hasRecording && (
                               <div className="bg-slate-900 border border-brand-border rounded-lg p-3 flex flex-col justify-between hover:border-purple-500/50 transition">
                                 <div className="flex items-start gap-2 mb-3">
                                   <Video className="w-4 h-4 text-sky-400 mt-1 shrink-0" />
                                   <div>
                                     <p className="text-xs font-semibold text-slate-200 line-clamp-2">Class Recording MP4</p>
                                     <p className="text-[10px] text-slate-500">Expires in 7 days</p>
                                   </div>
                                 </div>
                                 <button onClick={() => alert('Downloading recording... (Mock)')} className="w-full px-2 py-1 bg-sky-900/30 border border-sky-500/30 text-xs text-sky-300 hover:text-white rounded hover:bg-sky-900/60 transition cursor-pointer flex items-center justify-center gap-1">
                                   <Download className="w-3 h-3" /> Download MP4
                                 </button>
                               </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
"""

content = content.replace("{/* TAB: CLASS CHAT", files_render + "\n            {/* TAB: CLASS CHAT")

# Mobile nav
mobile_nav_target = """        ].map(item => {"""
mobile_nav_replacement = """          { id: 'files', label: 'Files', icon: FolderOpen },
        ].map(item => {"""
content = content.replace(mobile_nav_target, mobile_nav_replacement)

# Import FolderOpen
if "FolderOpen" not in content:
    content = content.replace("FileText,", "FileText, FolderOpen, Download,")

with open("src/components/StudentApp.tsx", "w") as f:
    f.write(content)
