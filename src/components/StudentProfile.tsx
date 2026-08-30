import React, { useState, useEffect } from 'react';
import SaveButton from './SaveButton';
import { Student, Occurrence, Transaction, Employee, Group, ClassSession } from '../types';
import { FileText, CheckCircle, ArrowLeft, AlertCircle, Clock, Save, CreditCard, Plus, X, Trash2, Edit3, ShieldAlert, GraduationCap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAutoSave } from '../hooks/useAutoSave';
import AutoSaveIndicator from './AutoSaveIndicator';

interface StudentProfileProps {
  student: Student;
  activeEmployee: Employee;
  occurrences: Occurrence[];
  transactions: Transaction[];
  groups: Group[];
  classSessions: ClassSession[];
  onBack: () => void;
  onUpdateStudent: (s: Student) => void;
  onDeleteStudent?: (id: string) => void;
  onAddOccurrence: (o: Occurrence) => void;
  onUpdateOccurrence?: (o: Occurrence) => void;
  onDeleteOccurrence?: (id: string) => void;
  onAddTransaction?: (t: Transaction) => void;
  onNavigate?: (type: 'student' | 'group' | 'staff', id: string) => void;
  onSwitchToStudentMode?: (studentId?: string) => void;
}

export default function StudentProfile({ 
  student, 
  activeEmployee, 
  occurrences, 
  transactions, 
  groups,
  classSessions,
  onBack, 
  onUpdateStudent,
  onDeleteStudent,
  onAddOccurrence,
  onUpdateOccurrence,
  onDeleteOccurrence,
  onAddTransaction,
  onNavigate,
  onSwitchToStudentMode
}: StudentProfileProps) {
  const { t, formatCurrency } = useLanguage();
  const [profileView, setProfileView] = useState<'overview' | 'occurrences' | 'finance' | 'grades'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Student>(student);

  // New Occurrence State
  const [isAddingOcc, setIsAddingOcc] = useState(false);
  const [occType, setOccType] = useState<Occurrence['type']>('academic');
  const [occDesc, setOccDesc] = useState('');

  // Billing Modal State for Student
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingAmount, setBillingAmount] = useState('450');
  const [billingType, setBillingType] = useState<Transaction['type']>('tuition');
  const [billingStatus, setBillingStatus] = useState<Transaction['status']>('paid');
    const [billingMethod, setBillingMethod] = useState<'PIX' | 'Credit Card' | 'Boleto' | 'Bank Transfer' | 'Cash'>('PIX');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignGroupVal, setAssignGroupVal] = useState(student.group || '');
  const [billingNotes, setBillingNotes] = useState('Tuition cycle payment');
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  // Update editData whenever student changes
  useEffect(() => {
    setEditData(student);
  }, [student]);

  // Hook for Auto-Saving Student Profile edits every 30 seconds
  const {
    lastSaved: lastSavedProfile,
    isSaving: isSavingProfile,
    hasUnsavedChanges: hasUnsavedProfile,
    saveNow: saveProfileNow,
    clearDraft: clearProfileDraft
  } = useAutoSave(editData, {
    intervalMs: 30000,
    storageKey: `student_profile_${student.id}`,
    enabled: isEditing,
    onSave: (data) => {
      // Auto-persists changes quietly
      onUpdateStudent(data);
    }
  });

  // Hook for Auto-Saving New Occurrence Draft on student profile
  const {
    lastSaved: lastSavedOcc,
    isSaving: isSavingOcc,
    hasUnsavedChanges: hasUnsavedOcc,
    saveNow: saveOccNow,
    clearDraft: clearOccDraft
  } = useAutoSave({ occType, occDesc }, {
    intervalMs: 30000,
    storageKey: `student_occ_draft_${student.id}`,
    enabled: isAddingOcc && occDesc.length > 0
  });

  const canEdit = activeEmployee.isAssociate || activeEmployee.permissions.includes('edit:students');
  const canEditFinance = activeEmployee.isAssociate || activeEmployee.permissions.includes('edit:finance');
  const canEditOcc = activeEmployee.isAssociate || activeEmployee.permissions.includes('edit:occurrences');

  const studentOccurrences = occurrences.filter(occ => occ.studentId === student.id || occ.studentName.toLowerCase() === student.name.toLowerCase());
  const studentTxs = transactions.filter(tx => tx.studentName.toLowerCase() === student.name.toLowerCase());

  const handleSaveProfile = () => {
    onUpdateStudent(editData);
    clearProfileDraft();
    setIsEditing(false);
  };

  const handleAddOccurrence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!occDesc.trim()) return;
    
    const newOcc: Occurrence = {
      id: Date.now().toString(),
      studentId: student.id,
      studentName: student.name,
      date: new Date().toISOString().split('T')[0],
      type: occType,
      description: occDesc.trim(),
      reportedBy: activeEmployee.name,
      status: 'open'
    };
    onAddOccurrence(newOcc);
    clearOccDraft();
    setIsAddingOcc(false);
    setOccDesc('');
    setOccType('academic');
  };

  const handleAddStudentPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingAmount) return;

    const newTx: Transaction = {
      id: Date.now().toString(),
      studentId: student.id,
      studentName: student.name,
      amount: parseFloat(billingAmount) || 0,
      date: new Date().toISOString().split('T')[0],
      type: billingType,
      status: billingStatus,
      paymentMethod: billingMethod,
      notes: billingNotes
    };

    onAddTransaction?.(newTx);
    setIsBillingModalOpen(false);
  };

  return (
    <section className="space-y-6">
      {/* Header & Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          
          {activeEmployee.isAssociate && onDeleteStudent && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to completely delete this student? This action cannot be undone.')) {
                  onDeleteStudent(student.id);
                  onBack();
                }
              }}
              className="p-2 text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition cursor-pointer flex items-center justify-center border border-rose-500/30"
              title="Delete Student"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white transition bg-brand-card px-3 py-1.5 rounded-lg border border-brand-border text-sm flex items-center shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back', 'Back')}
          </button>
          <h2 className="text-xl font-bold text-slate-100 truncate">{student.name}</h2>
          <span className={`px-2.5 py-1 text-xs uppercase rounded-md border shrink-0 font-semibold ${
            student.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
            student.status === 'enrolled' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
            student.status === 'paused' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
            'bg-slate-500/20 text-slate-300 border-slate-500/30'
          }`}>
            {student.group ? (groups.find(g => g.code === student.group || g.id === student.group || g.name === student.group)?.name || student.group) : student.status}
          </span>
        </div>
        
        {/* Profile Internal Tabs */}
        <div className="flex bg-brand-dark border border-brand-border rounded-lg p-1 overflow-x-auto">
          <button 
            onClick={() => setProfileView('overview')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition cursor-pointer whitespace-nowrap ${profileView === 'overview' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t('overview', 'Overview')}
          </button>
          <button 
            onClick={() => setProfileView('occurrences')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center whitespace-nowrap ${profileView === 'occurrences' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t('occurrences', 'Occurrences & Notes')}
            {studentOccurrences.length > 0 && (
              <span className="ml-2 bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {studentOccurrences.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setProfileView('finance')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition cursor-pointer whitespace-nowrap ${profileView === 'finance' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t('finance', 'Financials')}
          </button>
          <button 
            onClick={() => setProfileView('grades')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition cursor-pointer whitespace-nowrap ${profileView === 'grades' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Grades & Homework
          </button>
        </div>
      </div>

      {profileView === 'overview' && (
        <>
          <div className="flex items-center justify-between">
            {isEditing && (
              <AutoSaveIndicator 
                lastSaved={lastSavedProfile}
                isSaving={isSavingProfile}
                hasUnsavedChanges={hasUnsavedProfile}
                onSaveNow={saveProfileNow}
              />
            )}
            <div className="flex items-center space-x-2 justify-end ml-auto">
              {onSwitchToStudentMode && (
                <button
                  onClick={() => onSwitchToStudentMode(student.id)}
                  className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/40 text-xs rounded-lg transition cursor-pointer font-semibold flex items-center space-x-1.5 shadow-sm"
                  title="View Portal as this Student"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student Portal</span>
                </button>
              )}
              {canEdit && !isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-1.5 bg-brand-card hover:bg-brand-dark border border-brand-border text-slate-200 text-xs rounded-lg transition cursor-pointer font-semibold"
                >
                  {t('edit', 'Edit Profile')}
                </button>
              )}
              {canEdit && isEditing && (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => { setIsEditing(false); setEditData(student); }}
                    className="px-4 py-1.5 text-slate-400 hover:text-white text-xs transition cursor-pointer"
                  >
                    {t('cancel', 'Cancel')}
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    className="px-4 py-1.5 bg-purple-600 text-white text-xs rounded-lg font-medium hover:bg-purple-500 flex items-center transition cursor-pointer"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    {t('save', 'Save Changes')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Contact Info Widget */}
            <div className="bg-brand-card p-5 rounded-xl border border-brand-border space-y-4">
              <h3 className="text-sm font-semibold text-purple-300 border-b border-brand-border pb-2">
                Student Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Name</span>
                  {isEditing ? (
                    <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs" />
                  ) : <div className="text-slate-200 font-medium">{student.name}</div>}
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Email</span>
                  {isEditing ? (
                    <input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className="w-full bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs" />
                  ) : <div className="text-slate-200">{student.email}</div>}
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Phone</span>
                  {isEditing ? (
                    <input type="text" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs" />
                  ) : <div className="text-slate-200">{student.phone || 'N/A'}</div>}
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Major / Occupation</span>
                  {isEditing ? (
                    <input type="text" value={editData.major} onChange={e => setEditData({...editData, major: e.target.value})} className="w-full bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs" />
                  ) : <div className="text-slate-200">{student.major || 'N/A'}</div>}
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Timezone</span>
                  {isEditing ? (
                    <select value={editData.timezone} onChange={e => setEditData({...editData, timezone: e.target.value})} className="w-full bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs">
                      <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="Asia/Tokyo">Asia/Tokyo</option>
                    </select>
                  ) : <div className="text-slate-200">{student.timezone}</div>}
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Birthday</span>
                  {isEditing ? (
                    <input 
                      type="date"
                      value={editData.birthday || ''} 
                      onChange={e => setEditData({...editData, birthday: e.target.value})}
                      className="w-full bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                    />
                  ) : <div className="text-slate-200">{student.birthday ? new Date(student.birthday).toLocaleDateString() : '-'}</div>}
                </div>
                {isEditing && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Group</span>
                    <select value={editData.group || ''} onChange={e => setEditData({...editData, group: e.target.value || undefined})} className="w-full bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs">
                      <option value="">Unassigned</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.code}>{g.name || g.code}</option>
                      ))}
                    </select>
                  </div>
                )}
                {isEditing && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Status</span>
                    <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value as any})} className="w-full bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs">
                      <option value="active">Active</option>
                      <option value="lead">Lead</option>
                      <option value="paused">Paused</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Portal Login Widget */}
            <div className="bg-brand-card p-5 rounded-xl border border-brand-border space-y-4">
              <h3 className="text-sm font-semibold text-purple-300 border-b border-brand-border pb-2">
                Student Portal Access
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400">Username:</span>
                    {!isEditing && <span className="text-slate-200">{student.username}</span>}
                  </div>
                  {isEditing && (
                    <input 
                      type="text" 
                      value={editData.username || ''} 
                      onChange={e => setEditData({...editData, username: e.target.value})} 
                      className="w-full bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs" 
                    />
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400">Temp Password:</span>
                    {!isEditing && (
                      <span className="text-slate-200 bg-brand-dark px-2 py-0.5 rounded border border-brand-border font-mono text-xs">
                        {student.tempPassword || 'N/A'}
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <input 
                      type="text" 
                      value={editData.tempPassword || ''} 
                      onChange={e => setEditData({...editData, tempPassword: e.target.value})} 
                      className="w-full bg-brand-dark border border-brand-border rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs font-mono" 
                      placeholder="Enter new temporary password..."
                    />
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Login:</span>{' '}
                  <span className="text-slate-200">{student.lastLogin || 'Never'}</span>
                </div>
              </div>
              {!isEditing && canEdit && (
                <div className="space-y-1.5 mt-2">
                  <button 
                    onClick={() => {
                      const newPassword = Math.random().toString(36).slice(-8);
                      const updated = { ...student, tempPassword: newPassword };
                      onUpdateStudent(updated);
                      setResetFeedback(`Password reset: ${newPassword}`);
                      setTimeout(() => setResetFeedback(null), 5000);
                    }}
                    className="w-full bg-brand-dark hover:bg-brand-border border border-brand-border text-slate-300 hover:text-white text-xs py-1.5 rounded transition cursor-pointer font-medium"
                  >
                    Auto-Reset Password
                  </button>
                  {resetFeedback && (
                    <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded text-[11px] text-emerald-300 flex items-center justify-between animate-fadeIn">
                      <span className="font-mono">{resetFeedback}</span>
                      <button
                        onClick={() => {
                          const pwd = resetFeedback.split(': ')[1];
                          if (pwd) {
                            navigator.clipboard.writeText(pwd);
                            setResetFeedback(`Copied ${pwd}!`);
                            setTimeout(() => setResetFeedback(null), 3000);
                          }
                        }}
                        className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contracts Widget */}
            <div className="bg-brand-card p-5 rounded-xl border border-brand-border space-y-4">
              <h3 className="text-sm font-semibold text-purple-300 border-b border-brand-border pb-2">Contracts & Legal</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-brand-dark rounded border border-brand-border">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-xs font-medium text-slate-200">Core Plan Agreement</div>
                      <div className="text-[10px] text-slate-400">Signed: 10/Oct/2026</div>
                    </div>
                  </div>
                  <span className="flex items-center text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {profileView === 'occurrences' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-100">Student Occurrences Log</h3>
            {canEditOcc && (
              <button
                onClick={() => setIsAddingOcc(!isAddingOcc)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium flex items-center transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {isAddingOcc ? 'Cancel' : 'Add Occurrence'}
              </button>
            )}
          </div>

          {isAddingOcc && (
            <form onSubmit={handleAddOccurrence} className="bg-brand-card p-4 rounded-xl border border-purple-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300">New Occurrence Entry</span>
                <AutoSaveIndicator 
                  lastSaved={lastSavedOcc}
                  isSaving={isSavingOcc}
                  hasUnsavedChanges={hasUnsavedOcc}
                  onSaveNow={saveOccNow}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Occurrence Type</label>
                  <select
                    value={occType}
                    onChange={e => setOccType(e.target.value as any)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="academic">Academic</option>
                    <option value="behavior">Behavior</option>
                    <option value="attendance">Attendance</option>
                    <option value="administrative">Administrative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Description / Notes</label>
                  <input
                    type="text"
                    value={occDesc}
                    onChange={e => setOccDesc(e.target.value)}
                    placeholder="Enter occurrence details..."
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingOcc(false)}
                  className="px-3 py-1 bg-brand-dark text-slate-400 text-xs rounded hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-500"
                >
                  Save Occurrence
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {studentOccurrences.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-brand-card rounded-xl border border-brand-border text-xs">
                No occurrences recorded for {student.name}.
              </div>
            ) : (
              studentOccurrences.map(occ => (
                <div key={occ.id} className="p-4 bg-brand-card rounded-xl border border-brand-border flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-200 capitalize">{occ.type}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{occ.date}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        occ.status === 'open' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {occ.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{occ.description}</p>
                    <p className="text-[10px] text-slate-500">Reported by: {occ.reportedBy}</p>
                  </div>
                  {onDeleteOccurrence && (
                    <button
                      onClick={() => onDeleteOccurrence(occ.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* GRADES VIEW */}
      {profileView === 'grades' && (
        <div className="space-y-6">
          <div className="bg-brand-card rounded-xl border border-brand-border p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-200 mb-4 border-b border-brand-border/50 pb-2 flex items-center gap-2">
              <span className="bg-purple-500/20 text-purple-300 p-1.5 rounded-lg">🎓</span>
              Academic Performance & Grades
            </h3>
            
            <div className="space-y-4">
              {classSessions
                .filter(session => session.grades && session.grades.some(g => g.studentId === student.id))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((session) => {
                  const myGrade = session.grades!.find(g => g.studentId === student.id);
                  if (!myGrade) return null;
                  return (
                    <div key={session.id} className="bg-brand-dark rounded-xl border border-brand-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-purple-400 font-mono">{session.date}</span>
                          <span className="text-xs bg-brand-card px-2 py-0.5 rounded border border-brand-border text-slate-300">{session.groupCode}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-200">{session.topic}</h4>
                        <p className="text-xs text-slate-500 mt-1">Teacher: {session.teacher}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="bg-brand-card border border-brand-border rounded-lg p-2 flex flex-col items-center justify-center w-16">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Speak</span>
                          <span className="text-sm font-black text-slate-200">{myGrade.speaking || '-'}</span>
                        </div>
                        <div className="bg-brand-card border border-brand-border rounded-lg p-2 flex flex-col items-center justify-center w-16">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Listen</span>
                          <span className="text-sm font-black text-slate-200">{myGrade.listening || '-'}</span>
                        </div>
                        <div className="bg-brand-card border border-brand-border rounded-lg p-2 flex flex-col items-center justify-center w-16">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">HW</span>
                          <span className="text-sm font-black text-slate-200">{myGrade.homework || '-'}</span>
                        </div>
                      </div>
                    </div>
                  );
              })}
              
              {classSessions.filter(session => session.grades && session.grades.some(g => g.studentId === student.id)).length === 0 && (
                <div className="text-center p-8 text-slate-500 border border-dashed border-brand-border rounded-xl bg-brand-dark/50">
                  No grades or homework records found for this student.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {profileView === 'finance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-100">Financial History</h3>
            {canEditFinance && (
              <button
                onClick={() => setIsBillingModalOpen(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium flex items-center transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Transaction
              </button>
            )}
          </div>

          <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-brand-dark/80 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {studentTxs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">No transactions recorded.</td>
                  </tr>
                ) : (
                  studentTxs.map(tx => (
                    <tr key={tx.id} className="hover:bg-purple-900/10">
                      <td className="p-3 font-mono text-slate-400">{tx.date}</td>
                      <td className="p-3 capitalize">{tx.type}</td>
                      <td className="p-3 font-mono font-bold text-slate-100">{formatCurrency(tx.amount)}</td>
                      <td className="p-3">{tx.paymentMethod || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          tx.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                          tx.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{tx.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isBillingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-brand-border pb-3">
              <h3 className="text-sm font-bold text-slate-100">Add Transaction for {student.name}</h3>
              <button onClick={() => setIsBillingModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddStudentPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Amount ($ / R$)</label>
                <input
                  type="number"
                  value={billingAmount}
                  onChange={e => setBillingAmount(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg p-2 text-slate-200"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Type</label>
                  <select
                    value={billingType}
                    onChange={e => setBillingType(e.target.value as any)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg p-2 text-slate-200"
                  >
                    <option value="tuition">Tuition</option>
                    <option value="material">Material</option>
                    <option value="fee">Fee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Method</label>
                  <select
                    value={billingMethod}
                    onChange={e => setBillingMethod(e.target.value as any)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg p-2 text-slate-200"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Notes</label>
                <input
                  type="text"
                  value={billingNotes}
                  onChange={e => setBillingNotes(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg p-2 text-slate-200"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBillingModalOpen(false)}
                  className="px-3 py-1.5 bg-brand-dark text-slate-400 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 text-white font-semibold rounded hover:bg-purple-500"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
