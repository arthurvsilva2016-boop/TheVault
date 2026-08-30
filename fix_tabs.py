with open("src/components/GroupProfile.tsx", "r") as f:
    content = f.read()

import re

# 1. Update state definition
content = content.replace("useState<'classroom' | 'classes' | 'slideshows' | 'overview' | 'chat' | 'whiteboard'>('classroom');", "useState<'classroom' | 'classes' | 'slideshows' | 'overview' | 'chat'>('classroom');")

# 2. Update Chat tab label and icon to look good
target_chat_btn = """          <button 
            onClick={() => setGroupView('chat')} 
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${groupView === 'chat' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Group Chat & Board</span>
          </button>"""

replacement_chat_btn = """          <button 
            onClick={() => setGroupView('chat')} 
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${groupView === 'chat' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Chat & Whiteboard</span>
          </button>"""
content = content.replace(target_chat_btn, replacement_chat_btn)

# 3. Remove Whiteboard button
target_whiteboard_btn = """          <button 
            onClick={() => setGroupView('whiteboard')} 
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${groupView === 'whiteboard' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Presentation className="w-3.5 h-3.5 text-purple-300" />
            <span>Full Whiteboard</span>
          </button>"""

content = content.replace(target_whiteboard_btn, "")

# 4. Remove {groupView === 'whiteboard' && ...} block
target_whiteboard_block = """      {/* TAB: DEDICATED GROUP WHITEBOARD STUDIO */}
      {groupView === 'whiteboard' && (
        <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden flex-1 flex flex-col min-h-[600px] shadow-lg">
          <VirtualWhiteboard
            boardId={`group_main_${group.id}`}
            title={`Group ${group.code} (${group.level}) • Collaborative Board`}
            authorName={activeEmployee.name}
            heightClass="h-full min-h-[580px]"
            showTeacherControls={true}
            onBrush={handleTeacherBrushGroupWhiteboard}
            onSendCurrentBoard={handleTeacherSendGroupWhiteboard}
          />
        </div>
      )}"""
content = content.replace(target_whiteboard_block, "")

# Also make the other labels shorter and use whitespace-nowrap just in case
content = content.replace("<span>Classroom (Slides & Board)</span>", "<span className=\"whitespace-nowrap\">Classroom</span>")
content = content.replace("<span>Upcoming Classes</span>", "<span className=\"whitespace-nowrap\">Classes</span>")
content = content.replace("<span>Custom Slideshows</span>", "<span className=\"whitespace-nowrap\">Slideshows</span>")
content = content.replace("Overview & Info", "<span className=\"whitespace-nowrap\">Overview</span>")


with open("src/components/GroupProfile.tsx", "w") as f:
    f.write(content)
