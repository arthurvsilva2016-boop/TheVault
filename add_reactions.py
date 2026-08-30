with open("src/components/StudentApp.tsx", "r") as f:
    content = f.read()

target1 = """                                <p className="text-xs whitespace-pre-wrap">{msg.text}</p>
                              </div>"""

replacement1 = """                                <p className="text-xs whitespace-pre-wrap">{msg.text}</p>
                              </div>
                              <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition">
                                 {['👍', '❤️', '😂', '👏'].map(emoji => (
                                    <button key={emoji} onClick={() => alert(`Reacted with ${emoji} (Mock)`)} className="text-xs hover:scale-125 transition cursor-pointer">{emoji}</button>
                                 ))}
                              </div>"""

content = content.replace(target1, replacement1)

target2 = """                                <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                                {/* Attachments */}"""

replacement2 = """                                <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                                {/* Attachments */}"""

content = content.replace(target2, replacement2)

target3 = """                            <div key={msg.id} className={`flex flex-col ${msg.senderId === student.id ? 'items-end' : 'items-start'}`}>"""
replacement3 = """                            <div key={msg.id} className={`group flex flex-col ${msg.senderId === student.id ? 'items-end' : 'items-start'}`}>"""
content = content.replace(target3, replacement3)

with open("src/components/StudentApp.tsx", "w") as f:
    f.write(content)
