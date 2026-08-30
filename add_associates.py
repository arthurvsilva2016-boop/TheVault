with open("src/data.ts", "r") as f:
    content = f.read()

target = """export const MOCK_EMPLOYEES: Employee[] = ["""
replacement = """export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-isa',
    username: 'Isa',
    password: '250406',
    name: 'Isabella Rodrigues Motta',
    rolePresetId: 'rp-admin',
    roleTitle: 'Super Admin',
    isAssociate: true,
    permissions: ['dashboard', 'calendar', 'students', 'groups', 'teacher', 'finance', 'occurrences', 'tasks', 'staff', 'meetings', 'admin', 'manage:staff', 'manage:roles', 'edit:students', 'edit:groups', 'edit:finance', 'edit:occurrences', 'edit:tasks', 'delete:records'],
    birthday: '2006-04-25',
    department: 'Administration',
    startDate: '2023-01-01',
    status: 'active'
  },
  {
    id: 'emp-doin',
    username: 'doin',
    password: '190302',
    name: 'Gabriel Doin',
    rolePresetId: 'rp-admin',
    roleTitle: 'Super Admin',
    isAssociate: true,
    permissions: ['dashboard', 'calendar', 'students', 'groups', 'teacher', 'finance', 'occurrences', 'tasks', 'staff', 'meetings', 'admin', 'manage:staff', 'manage:roles', 'edit:students', 'edit:groups', 'edit:finance', 'edit:occurrences', 'edit:tasks', 'delete:records'],
    birthday: '2002-03-19',
    department: 'Administration',
    startDate: '2023-01-01',
    status: 'active'
  },
  {
    id: 'emp-benji',
    username: 'benji',
    password: '04032000',
    name: 'Benyamin Ortiz Godolfredo',
    rolePresetId: 'rp-admin',
    roleTitle: 'Super Admin',
    isAssociate: true,
    permissions: ['dashboard', 'calendar', 'students', 'groups', 'teacher', 'finance', 'occurrences', 'tasks', 'staff', 'meetings', 'admin', 'manage:staff', 'manage:roles', 'edit:students', 'edit:groups', 'edit:finance', 'edit:occurrences', 'edit:tasks', 'delete:records'],
    birthday: '2000-03-04',
    department: 'Administration',
    startDate: '2023-01-01',
    status: 'active'
  },"""

content = content.replace(target, replacement)
with open("src/data.ts", "w") as f:
    f.write(content)
