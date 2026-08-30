import re

with open("src/components/StudentProfile.tsx", "r") as f:
    content = f.read()

content = content.replace("groups: Group[];", "groups: Group[];\n  classSessions: ClassSession[];")
content = content.replace("  groups,\n  onBack", "  groups,\n  classSessions,\n  onBack")

with open("src/components/StudentProfile.tsx", "w") as f:
    f.write(content)

with open("src/App.tsx", "r") as f:
    app_content = f.read()

app_content = app_content.replace("groups={groups}", "groups={groups}\n                 classSessions={classSessions}")

with open("src/App.tsx", "w") as f:
    f.write(app_content)
