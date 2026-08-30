import { useLanguage } from "../context/LanguageContext";
import React, { useState } from 'react';
import { Student, Group, Employee } from '../types';
import { Search, GraduationCap } from 'lucide-react';

interface StudentDirectoryProps {
  students: Student[];
  groups: Group[];
  activeEmployee: Employee;
  onSelectStudent: (student: Student) => void;
  onAddStudent: (student: Student) => void;
  onNavigate?: (type: 'group' | 'staff', id: string) => void;
  onSwitchToStudentMode?: (studentId?: string) => void;
}

export default function StudentDirectory({ students, groups, activeEmployee, onSelectStudent, onAddStudent, onNavigate, onSwitchToStudentMode }: StudentDirectoryProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [group, setGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('');
  const [birthday, setBirthday] = useState('');

  const isAdmin = activeEmployee.isAssociate || activeEmployee.permissions.includes('staff') || activeEmployee.permissions.includes('edit:groups');

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.group && student.group.toLowerCase().includes(searchQuery.toLowerCase())) ||
      student.major.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    
    let baseUsername = name.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    let finalUsername = baseUsername;
    let counter = 1;
    while (students.some(s => s.username === finalUsername)) {
      finalUsername = `${baseUsername}${counter}`;
      counter++;
    }
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    
    const newStudent: Student = {
      id: Date.now().toString(),
      name: name.trim(),
      major: major.trim(),
      group: group || undefined,
      phone: phone.trim(),
      email: email.trim(),
      timezone: timezone.trim() || 'BRT (Brasília)',
      birthday: birthday || undefined,
      username: finalUsername,

      
      status: 'active',
    };

    onAddStudent(newStudent);
    setIsCreating(false);
    setName('');
    setMajor('');
    setGroup('');
    setPhone('');
    setEmail('');
    setTimezone('');
    setBirthday('');
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-lg font-bold text-slate-100">Student Directory & Profiles</h2>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or group..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-card border border-brand-border text-sm rounded-lg pl-9 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
          {onSwitchToStudentMode && (
            <button
              onClick={() => onSwitchToStudentMode()}
              className="px-3 py-1.5 shrink-0 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/40 text-xs rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
              title="Launch Student Portal Preview"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Portal</span>
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="px-3 py-1.5 shrink-0 bg-purple-600 text-white text-xs rounded-lg font-medium hover:bg-purple-500 transition cursor-pointer"
            >
              {isCreating ? 'Cancel' : '+ Add Student'}
            </button>
          )}
        </div>
      </div>

      {isCreating && isAdmin && (
        <div className="bg-brand-card p-5 rounded-xl border border-purple-500/50 shadow-lg">
          <h3 className="text-sm font-semibold text-purple-300 mb-4">Enroll New Student</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="e.g. john@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Major / Occupation</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science Student"
                  value={major}
                  onChange={e => setMajor(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Study Group (Optional)</label>
                <select
                  value={group}
                  onChange={e => setGroup(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                >
                  <option value="">Unassigned (Enroll Later)</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.code}>{g.name || g.code}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. +55 (11) 99999-9999"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                >
                  <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white text-xs rounded-lg font-medium hover:bg-purple-500 transition"
              >
                Enroll Student
              </button>
            </div>
          </form>
        </div>
      )}

      {filteredStudents.length === 0 ? (
        <div className="bg-brand-card p-8 rounded-xl border border-brand-border text-center">
          <p className="text-slate-400 text-sm">No students found matching "{searchQuery}"</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          {filteredStudents.map((student) => {
            const cleanGroup = student.group ? String(student.group).trim().toLowerCase() : '';
            const studentGroup = groups.find(g => 
              (g.code && String(g.code).trim().toLowerCase() === cleanGroup) || 
              (g.id && String(g.id).trim().toLowerCase() === cleanGroup) || 
              (g.name && String(g.name).trim().toLowerCase() === cleanGroup)
            );
            const groupName = studentGroup ? (studentGroup.name || studentGroup.code) : 'Unassigned';

            return (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className="bg-brand-card p-4 rounded-xl border border-brand-border cursor-pointer hover:border-purple-500/50 transition group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-slate-100 group-hover:text-purple-300 transition text-base">{student.name}</h4>
                    <span className={`px-2 py-0.5 text-[10px] uppercase rounded border font-semibold ${
                      student.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      student.status === 'enrolled' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      student.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {student.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="text-xs text-slate-400">{student.major}</span>
                    <span className="text-xs font-mono text-purple-400/80 bg-purple-950/30 px-2 py-0.5 rounded border border-purple-500/20">
                      Code: {student.username}
                    </span>
                    {student.lastBook && (
                      <span className="text-xs text-blue-400/80 bg-blue-950/30 px-2 py-0.5 rounded border border-blue-500/20">
                        Book: {student.lastBook}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {onSwitchToStudentMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwitchToStudentMode(student.id);
                      }}
                      className="p-1.5 bg-purple-600/10 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/20 rounded-lg transition cursor-pointer flex items-center space-x-1 text-xs"
                      title={`Preview ${student.name} in Student Portal`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Portal</span>
                    </button>
                  )}
                  <span className={`px-2.5 py-1 text-xs rounded-lg border font-medium ${
                    student.group 
                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20' 
                      : 'bg-slate-500/10 text-slate-300 border-slate-500/20'
                  }`}>
                    <span onClick={(e) => { e.stopPropagation(); if (student.group && onNavigate) onNavigate('group', student.group); }} className={student.group ? 'cursor-pointer' : ''}>
                      {groupName}
                    </span>
                  </span>
                  
                  <span className="text-slate-500 group-hover:text-purple-400 transition ml-2">→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
