import React, { useState, useEffect } from 'react';
import SaveButton from './SaveButton';
import { AlertCircle, CheckCircle, Search, Filter, Plus, Edit3, Trash2, X, Check, FileText, ArrowRight } from 'lucide-react';
import { Occurrence, Student } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAutoSave } from '../hooks/useAutoSave';
import AutoSaveIndicator from './AutoSaveIndicator';

interface OccurrencesProps {
  onNavigate?: (type: 'student' | 'group' | 'staff', id: string) => void;
  occurrences: Occurrence[];
  students?: Student[];
  onAddOccurrence?: (occ: Occurrence) => void;
  onUpdateOccurrence?: (occ: Occurrence) => void;
  onDeleteOccurrence?: (id: string) => void;
}

export default function Occurrences({ 
  occurrences, 
  students = [], 
  onNavigate,
  onAddOccurrence,
  onUpdateOccurrence,
  onDeleteOccurrence
}: OccurrencesProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'academic' | 'behavior' | 'attendance' | 'administrative'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOccId, setEditingOccId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [occDate, setOccDate] = useState(new Date().toISOString().split('T')[0]);
  const [occType, setOccType] = useState<Occurrence['type']>('academic');
  const [occDescription, setOccDescription] = useState('');
  const [occReportedBy, setOccReportedBy] = useState('Gabriel');
  const [occStatus, setOccStatus] = useState<Occurrence['status']>('open');
  const [occNotes, setOccNotes] = useState('');

  // Auto-Save Form Draft Setup (30-second interval)
  const formDraft = {
    editingOccId,
    studentName,
    occDate,
    occType,
    occDescription,
    occReportedBy,
    occStatus,
    occNotes
  };

  const {
    lastSaved,
    isSaving,
    hasUnsavedChanges,
    saveNow,
    clearDraft,
    restoreDraft
  } = useAutoSave(formDraft, {
    intervalMs: 30000,
    storageKey: 'occurrence_form_draft',
    enabled: isModalOpen && (studentName.length > 0 || occDescription.length > 0)
  });

  const filtered = occurrences.filter((occ) => {
    // Type filter
    if (typeFilter !== 'all' && occ.type !== typeFilter) return false;

    // Status filter
    if (statusFilter !== 'all' && occ.status !== statusFilter) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchesStudent = occ.studentName.toLowerCase().includes(q);
      const matchesDesc = occ.description.toLowerCase().includes(q);
      const matchesReporter = occ.reportedBy.toLowerCase().includes(q);
      const matchesNotes = occ.notes?.toLowerCase().includes(q);
      if (!matchesStudent && !matchesDesc && !matchesReporter && !matchesNotes) return false;
    }

    return true;
  });

  const openAddModal = () => {
    setEditingOccId(null);
    setStudentName('');
    setOccDate(new Date().toISOString().split('T')[0]);
    setOccType('academic');
    setOccDescription('');
    setOccReportedBy('Gabriel');
    setOccStatus('open');
    setOccNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (occ: Occurrence) => {
    setEditingOccId(occ.id);
    setStudentName(occ.studentName);
    setOccDate(occ.date);
    setOccType(occ.type);
    setOccDescription(occ.description);
    setOccReportedBy(occ.reportedBy);
    setOccStatus(occ.status);
    setOccNotes(occ.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveOccurrence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !occDescription.trim()) return;

    const matchedStudent = students.find(s => s.name.toLowerCase() === studentName.toLowerCase());

    const occData: Occurrence = {
      id: editingOccId || Date.now().toString(),
      studentId: matchedStudent ? matchedStudent.id : (editingOccId ? (occurrences.find(o => o.id === editingOccId)?.studentId || '1') : '1'),
      studentName: studentName.trim(),
      date: occDate,
      type: occType,
      description: occDescription.trim(),
      reportedBy: occReportedBy.trim(),
      status: occStatus,
      notes: occNotes.trim() || undefined
    };

    if (editingOccId) {
      onUpdateOccurrence?.(occData);
    } else {
      onAddOccurrence?.(occData);
    }
    clearDraft();
    setIsModalOpen(false);
  };

  const toggleStatus = (occ: Occurrence) => {
    const updated: Occurrence = {
      ...occ,
      status: occ.status === 'open' ? 'resolved' : 'open'
    };
    onUpdateOccurrence?.(updated);
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-purple-400" />
            {t('occurrencesTitle', 'Global Occurrences Tracker')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('occurrencesDesc', 'Track and edit behavioral, academic, and attendance occurrences for all students.')}
          </p>
        </div>

        <button 
          onClick={openAddModal}
          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-xl font-semibold transition flex items-center shadow-lg shadow-purple-900/30 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {t('logOccurrence', 'Log New Occurrence')}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-brand-card rounded-xl border border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder', 'Search student, description, or notes...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
          {search && (
            <button 
              onClick={() => setSearch('')} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              {t('clear', 'Clear')}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-brand-dark border border-brand-border rounded-lg p-1">
            {(['all', 'open', 'resolved'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition cursor-pointer ${
                  statusFilter === st 
                    ? 'bg-purple-600 text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'all' ? t('all', 'All') : st === 'open' ? t('open', 'Open') : t('resolved', 'Resolved')}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-1.5 bg-brand-dark border border-brand-border rounded-lg px-2.5 py-1.5 text-slate-300">
            <Filter className="w-3 h-3 text-purple-400" />
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-transparent focus:outline-none text-slate-200 cursor-pointer capitalize"
            >
              <option value="all" className="bg-brand-dark">{t('all', 'All Types')}</option>
              <option value="academic" className="bg-brand-dark">{t('academicType', 'Academic')}</option>
              <option value="behavior" className="bg-brand-dark">{t('behaviorType', 'Behavior')}</option>
              <option value="attendance" className="bg-brand-dark">{t('attendanceType', 'Attendance')}</option>
              <option value="administrative" className="bg-brand-dark">{t('administrativeType', 'Administrative')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Occurrences Table */}
      <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden flex flex-col shadow-sm">
        <div className="p-4 bg-brand-dark/40 border-b border-brand-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-purple-300">Logged Occurrences</h3>
          <span className="text-xs text-slate-400">{filtered.length} Records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-brand-dark/80 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">{t('date', 'Date')}</th>
                <th className="p-4">{t('students', 'Student')}</th>
                <th className="p-4">{t('occurrenceType', 'Type')}</th>
                <th className="p-4">Description & Notes</th>
                <th className="p-4">{t('reportedBy', 'Reported By')}</th>
                <th className="p-4">{t('status', 'Status')}</th>
                <th className="p-4 text-right">{t('actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No occurrences found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((occ) => (
                  <tr key={occ.id} className="hover:bg-purple-900/10 transition">
                    <td className="p-4 text-slate-400 whitespace-nowrap">{occ.date}</td>
                    <td className="p-4">
                      <span 
                        className="font-bold text-slate-100 cursor-pointer hover:text-purple-400 hover:underline transition" 
                        onClick={() => onNavigate && onNavigate('student', occ.studentId || occ.studentName)}
                      >
                        {occ.studentName}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="capitalize text-[11px] bg-brand-dark px-2 py-0.5 rounded border border-brand-border text-purple-300">
                        {occ.type}
                      </span>
                    </td>
                    <td className="p-4 max-w-sm">
                      <div className="font-medium text-slate-200 truncate" title={occ.description}>
                        {occ.description}
                      </div>
                      {occ.notes && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5" title={occ.notes}>
                          <span className="text-purple-400">Resolution:</span> {occ.notes}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-300">{occ.reportedBy}</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleStatus(occ)}
                        className="cursor-pointer group focus:outline-none"
                        title="Click to toggle status (Open / Resolved)"
                      >
                        {occ.status === 'open' ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30 group-hover:bg-amber-500/30 transition">
                            <AlertCircle className="w-3 h-3 mr-1" /> {t('open', 'Open')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 group-hover:bg-emerald-500/30 transition">
                            <CheckCircle className="w-3 h-3 mr-1" /> {t('resolved', 'Resolved')}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openEditModal(occ)}
                          className="p-1.5 bg-brand-dark hover:bg-purple-600/30 border border-brand-border hover:border-purple-500 text-slate-300 hover:text-purple-200 rounded-lg transition cursor-pointer"
                          title="Edit Occurrence"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteOccurrence?.(occ.id)}
                          className="p-1.5 bg-brand-dark hover:bg-rose-900/30 border border-brand-border hover:border-rose-500 text-slate-400 hover:text-rose-300 rounded-lg transition cursor-pointer"
                          title="Delete Occurrence"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add or Edit Occurrence with Auto-Save Hook */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-brand-dark/70 border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {editingOccId ? t('editOccurrence', 'Edit Occurrence') : t('logOccurrence', 'Log New Student Occurrence')}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                {/* Visual AutoSave Indicator */}
                <AutoSaveIndicator 
                  lastSaved={lastSaved}
                  isSaving={isSaving}
                  hasUnsavedChanges={hasUnsavedChanges}
                  onSaveNow={saveNow}
                />
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveOccurrence} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">{t('studentName', 'Student Name')}</label>
                <input
                  type="text"
                  list="students-list-occ"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter or select student..."
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                />
                <datalist id="students-list-occ">
                  {students.map(s => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">{t('occurrenceType', 'Occurrence Type')}</label>
                  <select
                    value={occType}
                    onChange={(e) => setOccType(e.target.value as any)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="academic">{t('academicType', 'Academic (Exam / Study)')}</option>
                    <option value="behavior">{t('behaviorType', 'Behavior / Feedback')}</option>
                    <option value="attendance">{t('attendanceType', 'Attendance / Absence')}</option>
                    <option value="administrative">{t('administrativeType', 'Administrative')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">{t('date', 'Date')}</label>
                  <input
                    type="date"
                    value={occDate}
                    onChange={(e) => setOccDate(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">{t('description', 'Description / Summary')}</label>
                <textarea
                  value={occDescription}
                  onChange={(e) => setOccDescription(e.target.value)}
                  placeholder="Details about the occurrence..."
                  rows={3}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">{t('reportedBy', 'Reported By')}</label>
                  <input
                    type="text"
                    value={occReportedBy}
                    onChange={(e) => setOccReportedBy(e.target.value)}
                    placeholder="Staff or Teacher name..."
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">{t('status', 'Status')}</label>
                  <select
                    value={occStatus}
                    onChange={(e) => setOccStatus(e.target.value as any)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="open">{t('open', 'Open (Active follow-up)')}</option>
                    <option value="resolved">{t('resolved', 'Resolved')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">{t('resolutionNotes', 'Resolution Notes / Action Taken')}</label>
                <input
                  type="text"
                  value={occNotes}
                  onChange={(e) => setOccNotes(e.target.value)}
                  placeholder="Follow-up notes or action plan..."
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-brand-border flex justify-between items-center">
                <span className="text-[10px] text-slate-500">Auto-saved every 30s</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-brand-dark text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                  >
                    {t('cancel', 'Cancel')}
                  </button>
                  <SaveButton type="submit" isFormSubmit={true} className="px-5 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-500 transition cursor-pointer" label={editingOccId ? t('edit', 'Update Occurrence') : t('save', 'Save Occurrence')} savedLabel="Saved" />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
