with open("src/types.ts", "r") as f:
    content = f.read()

target = "export type Permission = Tab | 'edit:students' | 'edit:groups' | 'edit:collections' | 'edit:finance' | 'edit:occurrences' | 'edit:tasks' | 'edit:staff' | 'edit:chat';"
replacement = "export type Permission = Tab | 'edit:students' | 'edit:groups' | 'edit:collections' | 'edit:finance' | 'edit:occurrences' | 'edit:tasks' | 'edit:staff' | 'edit:chat' | 'admin' | 'manage:staff' | 'manage:roles' | 'delete:records';"
content = content.replace(target, replacement)

with open("src/types.ts", "w") as f:
    f.write(content)
