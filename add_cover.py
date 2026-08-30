with open("src/components/GroupProfile.tsx", "r") as f:
    content = f.read()

target = """      {/* Group Profile Top Header */}"""
replacement = """      {group.coverImage && (
        <div className="w-full h-32 md:h-48 rounded-xl overflow-hidden shrink-0 border border-brand-border">
          <img src={group.coverImage} alt="Group Cover" className="w-full h-full object-cover" />
        </div>
      )}
      {/* Group Profile Top Header */}"""

content = content.replace(target, replacement)
with open("src/components/GroupProfile.tsx", "w") as f:
    f.write(content)
