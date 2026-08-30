import React, { useState, useEffect } from 'react';
import SaveButton from './SaveButton';
import { Employee, Permission, RolePreset } from '../types';
import { Users, UserPlus, Shield, CheckCircle2, Edit3, Trash2, X, AlertTriangle, Mail, Phone, Settings2, Plus, Crown, Sparkles } from 'lucide-react';
import { isMaster, isSuperAdmin, canDeleteTargetEmployee } from '../utils/roles';

interface StaffManagerProps {
  employees: Employee[];
  activeEmployee: Employee;
  rolePresets: RolePreset[];
  setRolePresets: React.Dispatch<React.SetStateAction<RolePreset[]>>;
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

export default function StaffManager({ 
  employees, 
  activeEmployee,
  rolePresets,
  setRolePresets,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee 
}: StaffManagerProps) {
  const [activeTab, setActiveTab] = useState<'employees' | 'roles'>('employees');
  const [isCreating, setIsCreating] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);

  const activeIsMaster = isMaster(activeEmployee);

  // Role creation/editing state
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<RolePreset | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleIsAssociate, setRoleIsAssociate] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);

  // New employee form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBirthday, setNewBirthday] = useState('');
  const [newIsAssociate, setNewIsAssociate] = useState(false);
  const [newIsMaster, setNewIsMaster] = useState(false);
  const [newIsCoordinator, setNewIsCoordinator] = useState(false);
  const [newPermissions, setNewPermissions] = useState<Permission[]>(['dashboard', 'calendar', 'chat']);
  const [selectedRolePresetId, setSelectedRolePresetId] = useState<string>('');

  // Edit employee form state
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRoleTitle, setEditRoleTitle] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editIsAssociate, setEditIsAssociate] = useState(false);
  const [editIsMaster, setEditIsMaster] = useState(false);
  const [editIsCoordinator, setEditIsCoordinator] = useState(false);
  const [editPermissions, setEditPermissions] = useState<Permission[]>([]);
  
  const screenTabs: { id: Permission; label: string }[] = [
    { id: 'dashboard', label: 'Pedagogical Dashboard' },
    { id: 'calendar', label: 'Teacher Calendar' },
    { id: 'students', label: 'Student Directory' },
    { id: 'groups', label: 'Study Groups' },
    { id: 'collections', label: 'Collections' },
    { id: 'teacher', label: 'Teacher Portal' },
    { id: 'finance', label: 'Financials' },
    { id: 'occurrences', label: 'Occurrences' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'chat', label: 'Staff Chat' },
  ];

  const actionPerms: { id: Permission; label: string }[] = [
    { id: 'edit:students', label: 'Edit & Add Students' },
    { id: 'edit:groups', label: 'Manage Groups & Classes' },
    { id: 'edit:collections', label: 'Manage Collections & Slides' },
    { id: 'edit:finance', label: 'Manage Financials & Tuition' },
    { id: 'edit:occurrences', label: 'Add/Edit Occurrences' },
    { id: 'edit:tasks', label: 'Manage Tasks' },
    { id: 'edit:staff', label: 'Manage Staff & Roles' },
    { id: 'edit:chat', label: 'Moderate Chat & Delete Messages' },
  ];
  
  const allPossiblePermissions: Permission[] = [
    'dashboard', 'calendar', 'students', 'groups', 'collections', 'teacher', 'finance', 'occurrences', 'tasks', 'staff', 'preferences', 'meetings', 'chat',
    'edit:students', 'edit:groups', 'edit:collections', 'edit:finance', 'edit:occurrences', 'edit:tasks', 'edit:staff', 'edit:chat',
    'admin', 'manage:staff', 'manage:roles', 'delete:records', 'delete:superadmin', 'manage:master'
  ];

  useEffect(() => {
    if (selectedRolePresetId) {
      const preset = rolePresets.find(r => r.id === selectedRolePresetId);
      if (preset) {
        setNewRoleTitle(preset.name);
        setNewIsAssociate(preset.isAssociate || false);
        setNewIsMaster(preset.name.toLowerCase().includes('master'));
        setNewPermissions(preset.permissions as Permission[]);
      }
    }
  }, [selectedRolePresetId, rolePresets]);

  const handleToggleNewPermission = (perm: Permission) => {
    if (newPermissions.includes(perm)) {
      setNewPermissions(newPermissions.filter(p => p !== perm));
    } else {
      setNewPermissions([...newPermissions, perm]);
    }
  };

  const handleToggleEditPermission = (perm: Permission) => {
    if (editPermissions.includes(perm)) {
      setEditPermissions(editPermissions.filter(p => p !== perm));
    } else {
      setEditPermissions([...editPermissions, perm]);
    }
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim() || !newRoleTitle.trim()) return;

    const isMasterRole = newIsMaster || newRoleTitle.trim().toLowerCase() === 'master';
    const isSuper = newIsAssociate || isMasterRole;

    const newEmployee: Employee = {
      id: Date.now().toString(),
      username: newUsername.trim().toLowerCase(),
      name: newName.trim(),
      password: newPassword || undefined,
      birthday: newBirthday || undefined,
      roleTitle: isMasterRole ? 'Master' : newRoleTitle.trim(),
      email: newEmail.trim() || undefined,
      phone: newPhone.trim() || undefined,
      permissions: isMasterRole ? allPossiblePermissions : (isSuper ? allPossiblePermissions.filter(p => p !== 'manage:master') : newPermissions),
      isAssociate: isSuper,
      isMaster: isMasterRole,
      isCoordinator: newIsCoordinator,
    };

    onAddEmployee(newEmployee);
    setNewName('');
    setNewUsername('');
    setNewRoleTitle('');
    setNewEmail('');
    setNewPhone('');
    setNewIsAssociate(false);
    setNewIsMaster(false);
    setNewIsCoordinator(false);
    setNewPermissions(['dashboard', 'calendar', 'chat']);
    setIsCreating(false);
  };

  const startEditing = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditUsername(emp.username);
    setEditPassword(emp.password || '');
    setEditBirthday(emp.birthday || '');
    setEditRoleTitle(emp.roleTitle);
    setEditEmail(emp.email || '');
    setEditPhone(emp.phone || '');
    setEditAvatarUrl(emp.avatarUrl || '');
    setEditIsAssociate(isSuperAdmin(emp));
    setEditIsMaster(isMaster(emp));
    setEditPermissions([...emp.permissions]);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editName.trim() || !editUsername.trim() || !editRoleTitle.trim()) return;

    const isMasterRole = editIsMaster || editRoleTitle.trim().toLowerCase() === 'master';
    const isSuper = editIsAssociate || isMasterRole;

    const updated: Employee = {
      ...editingEmployee,
      name: editName.trim(),
      username: editUsername.trim().toLowerCase(),
      password: editPassword || editingEmployee.password,
      birthday: editBirthday || undefined,
      roleTitle: isMasterRole ? 'Master' : editRoleTitle.trim(),
      email: editEmail.trim() || undefined,
      phone: editPhone.trim() || undefined,
      avatarUrl: editAvatarUrl || undefined,
      isAssociate: isSuper,
      isMaster: isMasterRole,
      permissions: isMasterRole ? allPossiblePermissions : (isSuper ? (editPermissions.length ? editPermissions : allPossiblePermissions.filter(p => p !== 'manage:master')) : editPermissions),
    };

    onUpdateEmployee(updated);
    setEditingEmployee(null);
  };

  const confirmDelete = (id: string) => {
    onDeleteEmployee(id);
    setDeletingEmployeeId(null);
  };

  if (!activeEmployee.isAssociate && !activeIsMaster) {
    return (
      <div className="bg-brand-card p-8 rounded-xl border border-brand-border text-center flex flex-col items-center">
        <Shield className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-100">Access Denied</h2>
        <p className="text-slate-400 mt-2">You do not have permission to view or manage staff.</p>
      </div>
    );
  }

  const deletingTarget = employees.find(e => e.id === deletingEmployeeId);

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-100 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-400" />
              Staff & Permissions Management
            </h2>
            {activeIsMaster && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold text-amber-300 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full shadow-sm">
                <Crown className="w-3 h-3 text-amber-400" /> Master Authority
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeIsMaster 
              ? 'Full unrestricted administrative jurisdiction: manage roles, staff accounts, and remove Super Admins.' 
              : 'Manage employee roles, access permissions, profile edits, and team records.'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3 py-1.5 text-xs rounded-lg transition cursor-pointer ${activeTab === 'employees' ? 'bg-purple-600 text-white' : 'bg-brand-card text-slate-400 hover:text-slate-200'}`}
          >
            Staff Members ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 text-xs rounded-lg transition cursor-pointer ${activeTab === 'roles' ? 'bg-purple-600 text-white' : 'bg-brand-card text-slate-400 hover:text-slate-200'}`}
          >
            Role Presets
          </button>
        </div>
      </div>

      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => {
                setIsCreating(!isCreating);
                setEditingEmployee(null);
              }}
              className="px-3.5 py-2 bg-purple-600 text-white text-xs rounded-lg font-semibold hover:bg-purple-500 transition flex items-center self-start sm:self-auto cursor-pointer shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              {isCreating ? 'Cancel Creation' : 'Add Staff Member'}
            </button>
          </div>

          {/* CREATE EMPLOYEE MODAL / DRAWER */}
          {isCreating && (
            <div className="bg-brand-card p-6 rounded-xl border border-purple-500/50 shadow-2xl animate-fadeIn">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-brand-border">
                <h3 className="text-sm font-bold text-purple-300 flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" /> Create New Employee
                </h3>
                <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitCreate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Load from Role Preset</label>
                    <div className="relative">
                      <select
                        value={selectedRolePresetId}
                        onChange={(e) => setSelectedRolePresetId(e.target.value)}
                        className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition appearance-none cursor-pointer"
                      >
                        <option value="">-- No Preset (Custom) --</option>
                        {rolePresets.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                      <Settings2 className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Gabriel Santos"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Username (Login ID) *</label>
                    <input
                      type="text"
                      placeholder="e.g. gabriel"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Role Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Pedagogical Coordinator / Teacher"
                      value={newRoleTitle}
                      onChange={(e) => setNewRoleTitle(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Password</label>
                    <input
                      type="text"
                      placeholder="Leave blank for none"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Birthday</label>
                    <input
                      type="date"
                      value={newBirthday}
                      onChange={(e) => setNewBirthday(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="e.g. teacher@academy.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="+55 (11) 99999-0000"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                {/* Role Elevators */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer bg-brand-dark p-3 rounded-lg border border-amber-500/30 hover:border-amber-500 transition">
                    <input
                      type="checkbox"
                      checked={newIsAssociate}
                      onChange={(e) => setNewIsAssociate(e.target.checked)}
                      className="rounded bg-brand-card border-brand-border text-amber-500 focus:ring-amber-500/30 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs text-amber-300 font-bold flex items-center">
                        <Shield className="w-3.5 h-3.5 mr-1 text-amber-400" /> Super Admin Status
                      </span>
                      <p className="text-[10px] text-slate-400">Grants full admin access to all operational features.</p>
                    </div>
                  </label>

                  {activeIsMaster && (
                    <label className="flex items-center space-x-2 cursor-pointer bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent p-3 rounded-lg border border-amber-400/40 hover:border-amber-400 transition">
                      <input
                        type="checkbox"
                        checked={newIsMaster}
                        onChange={(e) => {
                          setNewIsMaster(e.target.checked);
                          if (e.target.checked) setNewIsAssociate(true);
                        }}
                        className="rounded bg-brand-card border-brand-border text-amber-400 focus:ring-amber-400/30 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs text-amber-200 font-black flex items-center">
                          <Crown className="w-3.5 h-3.5 mr-1 text-amber-400" /> Master Privilege
                        </span>
                        <p className="text-[10px] text-amber-300/80">Grants ultimate authority including deletion of Super Admins.</p>
                      </div>
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-semibold">Screen Access (Views)</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {screenTabs.map(tab => (
                        <label key={tab.id} className="flex items-center space-x-2 cursor-pointer bg-brand-dark p-2 rounded-lg border border-brand-border hover:border-purple-500/50 transition">
                          <input
                            type="checkbox"
                            checked={newPermissions.includes(tab.id) || newIsAssociate || newIsMaster}
                            disabled={newIsAssociate || newIsMaster}
                            onChange={() => handleToggleNewPermission(tab.id)}
                            className="rounded bg-brand-card border-brand-border text-purple-500 focus:ring-purple-500/30 w-3.5 h-3.5"
                          />
                          <span className="text-xs text-slate-300">{tab.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-semibold">Action Permissions (Write Access)</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {actionPerms.map(perm => (
                        <label key={perm.id} className="flex items-center space-x-2 cursor-pointer bg-brand-dark p-2 rounded-lg border border-brand-border hover:border-purple-500/50 transition">
                          <input
                            type="checkbox"
                            checked={newPermissions.includes(perm.id) || newIsAssociate || newIsMaster}
                            disabled={newIsAssociate || newIsMaster}
                            onChange={() => handleToggleNewPermission(perm.id)}
                            className="rounded bg-brand-card border-brand-border text-purple-500 focus:ring-purple-500/30 w-3.5 h-3.5"
                          />
                          <span className="text-xs text-slate-300">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-brand-border">
                  <button 
                    type="button" 
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <SaveButton type="submit" isFormSubmit={true} className="px-5 py-2 bg-purple-600 text-white text-xs rounded-lg font-semibold hover:bg-purple-500 transition cursor-pointer shadow-sm" label="Save Changes" savedLabel="Saved" />
                </div>
              </form>
            </div>
          )}

          {/* EDIT EMPLOYEE MODAL */}
          {editingEmployee && (
            <div className="bg-brand-card p-6 rounded-xl border border-purple-500/50 shadow-2xl animate-fadeIn">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-brand-border">
                <h3 className="text-sm font-bold text-purple-300 flex items-center">
                  <Edit3 className="w-4 h-4 mr-2" /> Edit Employee: {editingEmployee.name}
                </h3>
                <button onClick={() => setEditingEmployee(null)} className="text-slate-400 hover:text-white transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitEdit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-brand-border pb-2">Profile & Credentials</h4>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Username (Login ID) *</label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Password (Leave blank to keep current)</label>
                      <input
                        type="text"
                        placeholder="New password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Birthday</label>
                      <input
                        type="date"
                        value={editBirthday}
                        onChange={(e) => setEditBirthday(e.target.value)}
                        className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Role Title *</label>
                      <input
                        type="text"
                        value={editRoleTitle}
                        onChange={(e) => setEditRoleTitle(e.target.value)}
                        className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Phone</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Avatar Image URL</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={editAvatarUrl}
                        onChange={(e) => setEditAvatarUrl(e.target.value)}
                        className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-brand-border pb-2">Access & Permissions</h4>
                    
                    {/* Super Admin Switch */}
                    <label className="flex items-start space-x-3 p-3 bg-brand-dark border border-amber-500/30 rounded-lg cursor-pointer hover:bg-amber-500/5 transition">
                      <input
                        type="checkbox"
                        checked={editIsAssociate || editIsMaster}
                        onChange={(e) => {
                          setEditIsAssociate(e.target.checked);
                          if (!e.target.checked) setEditIsMaster(false);
                        }}
                        className="mt-1"
                      />
                      <div>
                        <span className="text-sm font-bold text-amber-400 flex items-center">
                          <Shield className="w-4 h-4 mr-1 text-amber-400"/> Super Admin Access
                        </span>
                        <p className="text-[10px] text-amber-500/70 mt-1">Super Admins have unrestricted access to all operational modules.</p>
                      </div>
                    </label>

                    {/* Master Switch (Accessible to Master only) */}
                    {activeIsMaster && (
                      <label className="flex items-start space-x-3 p-3 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent border border-amber-400/50 rounded-lg cursor-pointer hover:border-amber-400 transition">
                        <input
                          type="checkbox"
                          checked={editIsMaster}
                          onChange={(e) => {
                            setEditIsMaster(e.target.checked);
                            if (e.target.checked) setEditIsAssociate(true);
                          }}
                          className="mt-1"
                        />
                        <div>
                          <span className="text-sm font-black text-amber-200 flex items-center">
                            <Crown className="w-4 h-4 mr-1 text-amber-400"/> Master Account Authority
                          </span>
                          <p className="text-[10px] text-amber-300/80 mt-1">Ultimate system jurisdiction with the power to delete Super Admins.</p>
                        </div>
                      </label>
                    )}

                    <div className={`space-y-2 ${editIsAssociate || editIsMaster ? 'opacity-50 pointer-events-none' : ''}`}>
                      <label className="block text-xs font-bold text-slate-300 mb-2">Module Access</label>
                      <div className="grid grid-cols-2 gap-2">
                        {screenTabs.map(tab => (
                          <label key={tab.id} className="flex items-center space-x-2 p-2 bg-brand-dark border border-brand-border rounded cursor-pointer hover:border-purple-500/50 transition">
                            <input
                              type="checkbox"
                              checked={editPermissions.includes(tab.id)}
                              onChange={(e) => {
                                if (e.target.checked) setEditPermissions([...editPermissions, tab.id]);
                                else setEditPermissions(editPermissions.filter(p => p !== tab.id));
                              }}
                              className="text-purple-500"
                            />
                            <span className="text-xs text-slate-300">{tab.label}</span>
                          </label>
                        ))}
                      </div>

                      <label className="block text-xs font-bold text-slate-300 mb-2 mt-4">Action Permissions</label>
                      <div className="grid grid-cols-2 gap-2">
                        {actionPerms.map(perm => (
                          <label key={perm.id} className="flex items-center space-x-2 p-2 bg-brand-dark border border-brand-border rounded cursor-pointer hover:border-purple-500/50 transition">
                            <input
                              type="checkbox"
                              checked={editPermissions.includes(perm.id)}
                              onChange={(e) => {
                                if (e.target.checked) setEditPermissions([...editPermissions, perm.id]);
                                else setEditPermissions(editPermissions.filter(p => p !== perm.id));
                              }}
                              className="text-purple-500"
                            />
                            <span className="text-xs text-slate-300">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t border-brand-border">
                  <button 
                    type="button" 
                    onClick={() => setEditingEmployee(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <SaveButton isFormSubmit={true} className="px-5 py-2 bg-purple-600 text-white text-xs rounded-lg font-semibold hover:bg-purple-500 transition cursor-pointer shadow-sm" label="Save Changes" savedLabel="Saved" />
                </div>
              </form>
            </div>
          )}

          {/* CONFIRM DELETE MODAL / BANNER */}
          {deletingEmployeeId && deletingTarget && (
            <div className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn border ${
              isSuperAdmin(deletingTarget)
                ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/30'
                : 'bg-rose-950/40 border-rose-500/50'
            }`}>
              <div className="flex items-center space-x-3">
                {isSuperAdmin(deletingTarget) ? (
                  <Crown className="w-6 h-6 text-amber-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <h4 className={`text-xs font-bold ${isSuperAdmin(deletingTarget) ? 'text-amber-200' : 'text-rose-200'}`}>
                    {isSuperAdmin(deletingTarget) ? 'Master Privilege: Remove Super Admin?' : 'Remove Staff Member?'}
                  </h4>
                  <p className={`text-[11px] ${isSuperAdmin(deletingTarget) ? 'text-amber-300/90' : 'text-rose-300/80'}`}>
                    {isSuperAdmin(deletingTarget) ? (
                      <>You are executing Master deletion on Super Admin <span className="font-bold underline">{deletingTarget.name}</span> (@{deletingTarget.username}). All administrative credentials will be revoked immediately.</>
                    ) : (
                      <>Are you sure you want to remove <span className="font-bold">{deletingTarget.name}</span>? This action cannot be undone.</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setDeletingEmployeeId(null)}
                  className="px-3 py-1.5 bg-brand-dark border border-brand-border text-xs text-slate-300 hover:text-white rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDelete(deletingEmployeeId)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Confirm Deletion
                </button>
              </div>
            </div>
          )}

          {/* EMPLOYEES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {employees.map(emp => {
              const targetIsMaster = isMaster(emp);
              const targetIsSuper = isSuperAdmin(emp);
              const deleteAuth = canDeleteTargetEmployee(activeEmployee, emp);

              return (
                <div 
                  key={emp.id} 
                  className={`bg-brand-card p-5 rounded-xl border space-y-4 relative overflow-hidden group transition shadow-sm ${
                    targetIsMaster 
                      ? 'border-amber-500/40 hover:border-amber-400 shadow-amber-950/20 ring-1 ring-amber-500/20' 
                      : targetIsSuper 
                      ? 'border-purple-500/40 hover:border-purple-400' 
                      : 'border-brand-border hover:border-purple-500/30'
                  }`}
                >
                  {/* Badge */}
                  {targetIsMaster ? (
                    <div className="absolute top-0 right-0 p-3 flex items-center space-x-1">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-300 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/40 shadow-sm flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        Master
                      </span>
                    </div>
                  ) : targetIsSuper ? (
                    <div className="absolute top-0 right-0 p-3 flex items-center space-x-1">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-amber-400" />
                        Super Admin
                      </span>
                    </div>
                  ) : null}

                  <div className="pr-16">
                    <h3 className="font-bold text-slate-100 text-base flex items-center">
                      {emp.name}
                      {targetIsMaster && <Sparkles className="w-3.5 h-3.5 ml-1.5 text-amber-400 inline" />}
                    </h3>
                    <p className="text-xs text-purple-400 font-semibold mt-0.5">
                      @{emp.username} • {targetIsMaster ? 'Master' : emp.roleTitle}
                    </p>
                    
                    {(emp.email || emp.phone || emp.birthday) && (
                      <div className="mt-2 text-[11px] text-slate-400 space-y-0.5">
                        {emp.email && (
                          <div className="flex items-center space-x-1.5">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{emp.email}</span>
                          </div>
                        )}
                        {emp.phone && (
                          <div className="flex items-center space-x-1.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Granted Permissions</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {targetIsMaster ? (
                        <span className="text-[9px] border border-amber-500/40 bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded-md flex items-center font-bold">
                          <Crown className="w-2.5 h-2.5 mr-1 text-amber-400" />
                          Unrestricted Master Access (Can Delete Super Admins)
                        </span>
                      ) : targetIsSuper ? (
                        <span className="text-[9px] border border-amber-500/30 bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-md flex items-center font-medium">
                          <Shield className="w-2.5 h-2.5 mr-1 text-amber-400" />
                          Full Super Admin Access
                        </span>
                      ) : (
                        emp.permissions.filter(p => p !== 'staff').map(p => {
                          const isAction = p.startsWith('edit:');
                          return (
                            <span 
                              key={p} 
                              className={`text-[9px] border px-2 py-0.5 rounded-md flex items-center font-medium ${
                                isAction 
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                                  : 'bg-brand-dark border-brand-border text-slate-300'
                              }`}
                            >
                              {!isAction && <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-500" />}
                              {p.replace('edit:', 'Write: ').replace('-', ' ')}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* ACTION BUTTONS (EDIT & DELETE) */}
                  <div className="pt-3 border-t border-brand-border flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">ID: #{emp.id}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => startEditing(emp)}
                        className="px-2.5 py-1 text-xs bg-brand-dark border border-brand-border hover:border-purple-500 hover:text-purple-300 text-slate-300 rounded-lg transition flex items-center cursor-pointer"
                        title="Edit Employee details and permissions"
                      >
                        <Edit3 className="w-3 h-3 mr-1 text-purple-400" />
                        Edit
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setDeletingEmployeeId(emp.id)}
                        disabled={!deleteAuth.canDelete}
                        className={`px-2.5 py-1 text-xs bg-brand-dark border rounded-lg transition flex items-center cursor-pointer ${
                          deleteAuth.canDelete
                            ? 'border-brand-border hover:border-rose-500 hover:text-rose-300 text-slate-400'
                            : 'border-brand-border/40 text-slate-600 opacity-40 cursor-not-allowed'
                        }`}
                        title={deleteAuth.canDelete ? (targetIsSuper ? 'Master Override: Remove Super Admin' : 'Remove Employee') : deleteAuth.reason}
                      >
                        <Trash2 className="w-3 h-3 mr-1 text-rose-400" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => {
                setIsCreatingRole(!isCreatingRole);
                setEditingRole(null);
              }}
              className="px-3.5 py-2 bg-purple-600 text-white text-xs rounded-lg font-semibold hover:bg-purple-500 transition flex items-center self-start sm:self-auto cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {isCreatingRole ? 'Cancel Creation' : 'Create New Role Preset'}
            </button>
          </div>

          {/* CREATE OR EDIT ROLE PRESET */}
          {(isCreatingRole || editingRole) && (
            <div className="bg-brand-card p-6 rounded-xl border border-purple-500/50 shadow-2xl animate-fadeIn">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-brand-border">
                <h3 className="text-sm font-bold text-purple-300 flex items-center">
                  <Shield className="w-4 h-4 mr-2" /> {editingRole ? `Edit Preset: ${editingRole.name}` : 'Create Role Preset'}
                </h3>
                <button 
                  onClick={() => {
                    setIsCreatingRole(false);
                    setEditingRole(null);
                  }} 
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!roleName.trim()) return;
                  if (editingRole) {
                    setRolePresets(rolePresets.map(r => r.id === editingRole.id ? { ...r, name: roleName.trim(), isAssociate: roleIsAssociate, permissions: rolePermissions } : r));
                  } else {
                    const newRole: RolePreset = {
                      id: `rp-${Date.now()}`,
                      name: roleName.trim(),
                      isAssociate: roleIsAssociate,
                      permissions: rolePermissions
                    };
                    setRolePresets([...rolePresets, newRole]);
                  }
                  setIsCreatingRole(false);
                  setEditingRole(null);
                  setRoleName('');
                  setRoleIsAssociate(false);
                  setRolePermissions([]);
                }} 
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Preset Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Teacher"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                      required
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center space-x-2 cursor-pointer bg-brand-dark p-2 rounded-lg border border-brand-border w-full">
                      <input
                        type="checkbox"
                        checked={roleIsAssociate}
                        onChange={(e) => setRoleIsAssociate(e.target.checked)}
                        className="rounded bg-brand-card border-brand-border text-purple-500 focus:ring-purple-500/30 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs text-amber-300 font-semibold flex items-center">
                        <Shield className="w-3.5 h-3.5 mr-1" /> Super Admin Role
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-semibold">Included Views</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {screenTabs.map(tab => (
                        <label key={tab.id} className="flex items-center space-x-2 cursor-pointer bg-brand-dark p-2 rounded-lg border border-brand-border hover:border-purple-500/50 transition">
                          <input
                            type="checkbox"
                            checked={rolePermissions.includes(tab.id)}
                            onChange={() => {
                              if (rolePermissions.includes(tab.id)) {
                                setRolePermissions(rolePermissions.filter(p => p !== tab.id));
                              } else {
                                setRolePermissions([...rolePermissions, tab.id]);
                              }
                            }}
                            className="rounded bg-brand-card border-brand-border text-purple-500 focus:ring-purple-500/30 w-3.5 h-3.5"
                          />
                          <span className="text-xs text-slate-300">{tab.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-semibold">Action Permissions</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {actionPerms.map(perm => (
                        <label key={perm.id} className="flex items-center space-x-2 cursor-pointer bg-brand-dark p-2 rounded-lg border border-brand-border hover:border-purple-500/50 transition">
                          <input
                            type="checkbox"
                            checked={rolePermissions.includes(perm.id)}
                            onChange={() => {
                              if (rolePermissions.includes(perm.id)) {
                                setRolePermissions(rolePermissions.filter(p => p !== perm.id));
                              } else {
                                setRolePermissions([...rolePermissions, perm.id]);
                              }
                            }}
                            className="rounded bg-brand-card border-brand-border text-purple-500 focus:ring-purple-500/30 w-3.5 h-3.5"
                          />
                          <span className="text-xs text-slate-300">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-brand-border">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsCreatingRole(false);
                      setEditingRole(null);
                    }}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <SaveButton type="submit" isFormSubmit={true} className="px-5 py-2 bg-purple-600 text-white text-xs rounded-lg font-semibold hover:bg-purple-500 transition cursor-pointer shadow-sm" label="Save Preset" savedLabel="Saved" />
                </div>
              </form>
            </div>
          )}

          {/* ROLE PRESETS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rolePresets.map(role => (
              <div 
                key={role.id}
                className="bg-brand-card p-5 rounded-xl border border-brand-border space-y-4 relative overflow-hidden group hover:border-purple-500/40 transition shadow-sm"
              >
                {role.isAssociate && (
                  <div className="absolute top-0 right-0 p-3 flex items-center space-x-1">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Super Admin
                    </span>
                    <Shield className="w-4 h-4 text-amber-500" />
                  </div>
                )}

                <div className="pr-12">
                  <h3 className="font-bold text-slate-100 text-base">{role.name}</h3>
                  <p className="text-xs text-purple-400 font-semibold mt-0.5">{role.permissions.length} Included Permissions</p>
                </div>

                <div>
                  <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Configured Permissions</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map(p => {
                      const isAction = p.startsWith('edit:');
                      return (
                        <span 
                          key={p} 
                          className={`text-[9px] border px-2 py-0.5 rounded-md flex items-center font-medium ${
                            isAction 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                              : 'bg-brand-dark border-brand-border text-slate-300'
                          }`}
                        >
                          {!isAction && <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-500" />}
                          {p.replace('edit:', 'Write: ').replace('-', ' ')}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-brand-border flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRole(role);
                      setRoleName(role.name);
                      setRoleIsAssociate(role.isAssociate || false);
                      setRolePermissions([...role.permissions]);
                      setIsCreatingRole(false);
                    }}
                    className="px-2.5 py-1 text-xs bg-brand-dark border border-brand-border hover:border-purple-500 hover:text-purple-300 text-slate-300 rounded-lg transition flex items-center cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 mr-1 text-purple-400" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setRolePresets(rolePresets.filter(r => r.id !== role.id))}
                    className="px-2.5 py-1 text-xs bg-brand-dark border border-brand-border hover:border-rose-500 hover:text-rose-300 text-slate-400 rounded-lg transition flex items-center cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 mr-1 text-rose-400" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
