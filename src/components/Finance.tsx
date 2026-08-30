import React, { useState } from 'react';
import { DollarSign, Filter, Plus, Edit3, Trash2, CheckCircle2, Clock, AlertCircle, Download, CreditCard, Search, X, Check, ArrowRight } from 'lucide-react';
import SaveButton from './SaveButton';
import { Transaction, Student } from '../types';

interface FinanceProps {
  onNavigate?: (type: any, id: string) => void;
  transactions: Transaction[];
  students: Student[];
  onAddTransaction: (t: Transaction) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function Finance({ 
  transactions, 
  students,
  onNavigate,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction
}: FinanceProps) {
  const [period, setPeriod] = useState<'all' | 'this_month' | 'last_month'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Manage Billing Modal State
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingStudentId, setBillingStudentId] = useState('');
  const [billingAmount, setBillingAmount] = useState('450');
  const [billingMethod, setBillingMethod] = useState<'PIX' | 'Credit Card' | 'Boleto' | 'Bank Transfer'>('PIX');
  const [billingDueDate, setBillingDueDate] = useState('5');
  const [billingDiscount, setBillingDiscount] = useState('0');
  const [billingNotes, setBillingNotes] = useState('');
  const [billingSuccessMessage, setBillingSuccessMessage] = useState('');

  // Add / Edit Transaction Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [txStudentName, setTxStudentName] = useState('');
  const [txType, setTxType] = useState<Transaction['type']>('tuition');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txStatus, setTxStatus] = useState<Transaction['status']>('paid');
  const [txMethod, setTxMethod] = useState<NonNullable<Transaction['paymentMethod']>>('PIX');
  const [txNotes, setTxNotes] = useState('');

  const filteredTxs = transactions.filter(tx => {
    // Period filter
    if (period === 'this_month') {
      const txMonth = new Date(tx.date).getMonth();
      const currentMonth = new Date().getMonth();
      if (txMonth !== currentMonth) return false;
    } else if (period === 'last_month') {
      const txMonth = new Date(tx.date).getMonth();
      const currentMonth = new Date().getMonth();
      const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      if (txMonth !== targetMonth) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesStudent = tx.studentName.toLowerCase().includes(q);
      const matchesType = tx.type.toLowerCase().includes(q);
      const matchesMethod = tx.paymentMethod?.toLowerCase().includes(q);
      if (!matchesStudent && !matchesType && !matchesMethod) return false;
    }

    return true;
  });

  const mrr = filteredTxs
    .filter(t => t.type === 'tuition' && t.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const pending = filteredTxs
    .filter(t => t.status === 'pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const overdue = filteredTxs
    .filter(t => t.status === 'overdue')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const moneyToReceive = pending + overdue;

  const openAddTxModal = () => {
    setEditingTxId(null);
    setTxStudentName('');
    setTxType('tuition');
    setTxAmount('450');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxStatus('paid');
    setTxMethod('PIX');
    setTxNotes('');
    setIsTxModalOpen(true);
  };

  const openEditTxModal = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setTxStudentName(tx.studentName);
    setTxType(tx.type);
    setTxAmount(String(tx.amount));
    setTxDate(tx.date);
    setTxStatus(tx.status);
    setTxMethod(tx.paymentMethod || 'PIX');
    setTxNotes(tx.notes || '');
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txStudentName.trim() || !txAmount) return;

    const matchedStudent = students.find(s => s.name.toLowerCase() === txStudentName.toLowerCase());

    const txData: Transaction = {
      id: editingTxId || Date.now().toString(),
      studentId: matchedStudent?.id,
      studentName: txStudentName.trim(),
      amount: parseFloat(txAmount) || 0,
      date: txDate,
      type: txType,
      status: txStatus,
      paymentMethod: txMethod,
      notes: txNotes.trim() || undefined
    };

    if (editingTxId) {
      onUpdateTransaction(txData);
    } else {
      onAddTransaction(txData);
    }
    setIsTxModalOpen(false);
  };

  const handleSaveBillingPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingStudentId) return;

    const student = students.find(s => s.id === billingStudentId);
    if (!student) return;

    const finalAmount = Math.max(0, parseFloat(billingAmount) - (parseFloat(billingDiscount) || 0));

    const newTx: Transaction = {
      id: Date.now().toString(),
      studentId: student.id,
      studentName: student.name,
      amount: finalAmount,
      date: new Date().toISOString().split('T')[0],
      type: 'tuition',
      status: 'pending',
      paymentMethod: billingMethod,
      notes: `Recurring Plan (Due Day ${billingDueDate}) - ${billingNotes}`
    };

    onAddTransaction(newTx);
    setBillingSuccessMessage(`Billing plan generated & invoice created for ${student.name}!`);
    setTimeout(() => {
      setBillingSuccessMessage('');
      setIsBillingModalOpen(false);
    }, 1800);
  };

  const exportReport = () => {
    const headers = ['ID', 'Student Name', 'Type', 'Amount (BRL)', 'Date', 'Status', 'Payment Method', 'Notes'];
    const rows = filteredTxs.map(t => [
      t.id,
      `"${t.studentName}"`,
      t.type,
      t.amount.toFixed(2),
      t.date,
      t.status,
      t.paymentMethod || 'N/A',
      `"${t.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vault_financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="space-y-6">
      {/* Header & Main Controls */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-emerald-400" />
            Financial Dashboard & Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage recurring tuition, incoming payments, and fully editable transactions.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Manage Billing Button */}
          <button 
            onClick={() => setIsBillingModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-xs rounded-xl font-semibold transition flex items-center shadow-lg shadow-purple-900/30 cursor-pointer"
          >
            <CreditCard className="w-4 h-4 mr-1.5" />
            Manage Billing & Plans
          </button>

          {/* Record Transaction Button */}
          <button 
            onClick={openAddTxModal}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl font-semibold transition flex items-center shadow-lg shadow-emerald-900/30 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record Transaction
          </button>

          {/* Export CSV Report */}
          <button 
            onClick={exportReport}
            className="px-3.5 py-2 bg-brand-card hover:bg-brand-dark border border-brand-border text-slate-300 hover:text-white text-xs rounded-xl font-medium transition flex items-center cursor-pointer"
            title="Download CSV Report"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-card p-5 rounded-xl border border-brand-border relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-400">
            <DollarSign className="w-16 h-16" />
          </div>
          <div className="text-xs text-slate-400 font-medium">Total Collected MRR</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1.5">R$ {mrr.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Paid tuition for selected period</div>
        </div>
        
        <div className="bg-brand-card p-5 rounded-xl border border-brand-border shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Total Money To Receive</div>
          <div className="text-2xl font-bold text-blue-400 mt-1.5">R$ {moneyToReceive.toLocaleString()}</div>
          <div className="text-[11px] text-blue-500/80 mt-1">
            Pending + Overdue combined
          </div>
        </div>

        <div className="bg-brand-card p-5 rounded-xl border border-brand-border shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Pending Tuition</div>
          <div className="text-2xl font-bold text-amber-400 mt-1.5">R$ {pending.toLocaleString()}</div>
          <div className="text-[11px] text-amber-500/80 mt-1">Awaiting confirmation</div>
        </div>

        <div className="bg-brand-card p-5 rounded-xl border border-brand-border shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Overdue Payments</div>
          <div className="text-2xl font-bold text-rose-400 mt-1.5">R$ {overdue.toLocaleString()}</div>
          <div className="text-[11px] text-rose-500/80 mt-1">Requires follow-up</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-brand-card rounded-xl border border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, transaction type, or method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-brand-dark border border-brand-border rounded-lg p-1">
            {(['all', 'paid', 'pending', 'overdue'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition cursor-pointer ${
                  statusFilter === st 
                    ? 'bg-purple-600 text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Period Filter */}
          <div className="flex items-center space-x-1.5 bg-brand-dark border border-brand-border rounded-lg px-2.5 py-1.5 text-slate-300">
            <Filter className="w-3 h-3 text-purple-400" />
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="bg-transparent focus:outline-none text-slate-200 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fully Editable Transaction Table */}
      <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden shadow-sm">
        <div className="p-4 bg-brand-dark/40 border-b border-brand-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-purple-300">Ledger & Transaction History</h3>
          <span className="text-xs text-slate-400">{filteredTxs.length} Transactions Found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-brand-dark/80 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Type</th>
                <th className="p-4">Method</th>
                <th className="p-4">Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No transactions match your search/filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-purple-900/10 transition">
                    <td className="p-4 font-medium text-slate-200">
                      <span 
                        className="cursor-pointer hover:text-purple-400 hover:underline transition" 
                        onClick={() => onNavigate && onNavigate('student', tx.studentName)}
                      >
                        {tx.studentName}
                      </span>
                      {tx.notes && (
                        <p className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5" title={tx.notes}>
                          {tx.notes}
                        </p>
                      )}
                    </td>
                    <td className="p-4 capitalize">
                      <span className="px-2 py-0.5 rounded bg-brand-dark border border-brand-border text-[11px]">
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">
                      {tx.paymentMethod || 'PIX'}
                    </td>
                    <td className="p-4 text-slate-400 whitespace-nowrap">{tx.date}</td>
                    <td className="p-4 font-mono font-semibold text-slate-100">
                      R$ {tx.amount.toFixed(2)}
                    </td>
                    <td className="p-4">
                      {tx.status === 'paid' && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                        </span>
                      )}
                      {tx.status === 'pending' && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </span>
                      )}
                      {tx.status === 'overdue' && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded border border-rose-500/30">
                          <AlertCircle className="w-3 h-3 mr-1" /> Overdue
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openEditTxModal(tx)}
                          className="p-1.5 bg-brand-dark hover:bg-purple-600/30 border border-brand-border hover:border-purple-500 text-slate-300 hover:text-purple-200 rounded-lg transition cursor-pointer"
                          title="Edit Transaction"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1.5 bg-brand-dark hover:bg-rose-900/30 border border-brand-border hover:border-rose-500 text-slate-400 hover:text-rose-300 rounded-lg transition cursor-pointer"
                          title="Delete Transaction"
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

      {/* MODAL 1: Manage Billing & Subscription Plans */}
      {isBillingModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsBillingModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-brand-dark/70 border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-slate-100">Manage Billing & Student Plans</h3>
              </div>
              <button 
                onClick={() => setIsBillingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {billingSuccessMessage ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-100">{billingSuccessMessage}</h4>
                <p className="text-xs text-slate-400">Invoice registered in the financial ledger.</p>
              </div>
            ) : (
              <form onSubmit={handleSaveBillingPlan} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Student</label>
                  <select
                    value={billingStudentId}
                    onChange={(e) => {
                      setBillingStudentId(e.target.value);
                    }}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                    required
                  >
                    <option value="">Choose student...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email}) - {s.status}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Tuition Base Amount (R$)</label>
                    <input
                      type="number"
                      value={billingAmount}
                      onChange={(e) => setBillingAmount(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Monthly Due Day</label>
                    <select
                      value={billingDueDate}
                      onChange={(e) => setBillingDueDate(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="5">Day 5th of Month</option>
                      <option value="10">Day 10th of Month</option>
                      <option value="15">Day 15th of Month</option>
                      <option value="20">Day 20th of Month</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                    <select
                      value={billingMethod}
                      onChange={(e) => setBillingMethod(e.target.value as any)}
                      className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="PIX">PIX Instant Transfer</option>
                      <option value="Credit Card">Credit Card Recurring</option>
                      <option value="Boleto">Boleto Bancário</option>
                      <option value="Bank Transfer">Bank Wire (TED)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Scholarship / Discount (R$)</label>
                    <input
                      type="number"
                      value={billingDiscount}
                      onChange={(e) => setBillingDiscount(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Notes / Plan Agreement Reference</label>
                  <input
                    type="text"
                    value={billingNotes}
                    onChange={(e) => setBillingNotes(e.target.value)}
                    placeholder="e.g. Core Plan semester installment 1/6"
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="pt-3 border-t border-brand-border flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsBillingModalOpen(false)}
                    className="px-4 py-2 bg-brand-dark text-slate-400 hover:text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition flex items-center cursor-pointer"
                  >
                    Generate & Save Billing Plan <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Add or Edit Transaction */}
      {isTxModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsTxModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-brand-dark/70 border-b border-brand-border flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                {editingTxId ? 'Edit Transaction' : 'Record New Transaction'}
              </h3>
              <button 
                onClick={() => setIsTxModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Student Name</label>
                <input
                  type="text"
                  list="students-list"
                  value={txStudentName}
                  onChange={(e) => setTxStudentName(e.target.value)}
                  placeholder="Enter or select student..."
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                />
                <datalist id="students-list">
                  {students.map(s => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="tuition">Tuition</option>
                    <option value="material">Material / Books</option>
                    <option value="fee">Registration Fee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Amount (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status</label>
                  <select
                    value={txStatus}
                    onChange={(e) => setTxStatus(e.target.value as any)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                <select
                  value={txMethod}
                  onChange={(e) => setTxMethod(e.target.value as any)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="PIX">PIX</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="Bank Transfer">Bank Transfer (TED)</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  placeholder="Receipt # or bank transfer notes..."
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-brand-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 bg-brand-dark text-slate-400 hover:text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition cursor-pointer"
                >
                  {editingTxId ? 'Update Transaction' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
