with open("src/components/StudentApp.tsx", "r") as f:
    content = f.read()

target2 = """                                <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                                {/* Attachments */}"""

replacement2 = """                                <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                                <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition absolute -bottom-3 bg-brand-dark/90 px-2 py-0.5 rounded-full border border-brand-border z-10">
                                 {['👍', '❤️', '😂', '👏'].map(emoji => (
                                    <button key={emoji} onClick={() => alert(`Reacted with ${emoji} (Mock)`)} className="text-xs hover:scale-125 transition cursor-pointer">{emoji}</button>
                                 ))}
                                </div>

                                {/* Attachments */}"""

content = content.replace(target2, replacement2)
with open("src/components/StudentApp.tsx", "w") as f:
    f.write(content)
