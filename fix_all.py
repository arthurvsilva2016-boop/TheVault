import re

# 1. Fix App.tsx
with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("groups={groups}\n\n                 onBack=", "groups={groups}\n                 classSessions={classSessions}\n                 onBack=")

with open("src/App.tsx", "w") as f:
    f.write(content)

# 2. Fix StudentProfile.tsx import
with open("src/components/StudentProfile.tsx", "r") as f:
    content = f.read()

content = content.replace("import { Student, Employee, Occurrence, Transaction, Group } from '../types';", "import { Student, Employee, Occurrence, Transaction, Group, ClassSession } from '../types';")

with open("src/components/StudentProfile.tsx", "w") as f:
    f.write(content)

# 3. Fix types.ts
with open("src/types.ts", "r") as f:
    content = f.read()

target = "export type EmployeePermission ="
replacement = "export type EmployeePermission = 'admin' | 'manage:staff' | 'manage:roles' | 'delete:records' |"
content = content.replace(target, replacement)

with open("src/types.ts", "w") as f:
    f.write(content)
