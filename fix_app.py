with open("src/App.tsx", "r") as f:
    content = f.read()

target = """                 groups={groups}
                 onBack={() => setActiveTab('students')}"""
replacement = """                 groups={groups}
                 classSessions={classSessions}
                 onBack={() => setActiveTab('students')}"""
content = content.replace(target, replacement)

with open("src/App.tsx", "w") as f:
    f.write(content)
