import React, { useState, FormEvent } from 'react';
import { Task, Role, Employee } from '../types';
import { MOCK_TASKS } from '../data';
import { ClipboardList, Plus, Clock, CheckCircle2, Calendar, User } from 'lucide-react';

interface TaskManagerProps {
  currentRole: Role;
  employees: Employee[];
  onNavigate?: (type: 'student' | 'group' | 'staff', id: string) => void;
}

export default function TaskManager({ currentRole, employees, onNavigate, tasks, setTasks }: TaskManagerProps & { tasks: Task[], setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void }) {
  
  
  const visibleTasks = tasks.filter(t => t.assignee === currentRole || t.createdBy === currentRole);

  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<Role>('isabella');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskRelated, setNewTaskRelated] = useState('');
  const [newTaskObs, setNewTaskObs] = useState('');

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const handleCreateTask = (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      observation: newTaskObs.trim(),
      relatedEntity: newTaskRelated.trim(),
      deadline: newTaskDeadline,
      assignee: newTaskAssignee,
      createdBy: currentRole,
      status: 'todo',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskObs('');
    setNewTaskRelated('');
    setNewTaskDeadline('');
    setIsCreating(false);
  };

  const toggleStatus = (taskId: string, currentStatus: Task['status']) => {
    const nextStatus: Record<Task['status'], Task['status']> = {
      'todo': 'in-progress',
      'in-progress': 'done',
      'done': 'todo',
    };
    
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus[currentStatus] } : t));
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-100 flex items-center">
          <ClipboardList className="w-5 h-5 mr-2 text-purple-400" />
          Task Delegation & Management
        </h2>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg font-medium hover:bg-purple-500 transition flex items-center"
        >
          <Plus className="w-3 h-3 mr-1" />
          Create Task / Note
        </button>
      </div>

      {isCreating && (
        <div className="bg-brand-card p-5 rounded-xl border border-purple-500/50 shadow-lg mb-6">
          <h3 className="text-sm font-semibold text-purple-300 mb-4">Assign a New Task or Note</h3>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Call lead back"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Assign To</label>
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value as Role)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.username}>{emp.name} ({emp.roleTitle})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Related Student / Group (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Lucas Silva or Group Alpha"
                  value={newTaskRelated}
                  onChange={(e) => setNewTaskRelated(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Deadline (Optional)</label>
                <input
                  type="date"
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Note / Description</label>
              <textarea
                placeholder="Provide details or a note for the assignee..."
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                rows={2}
                className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition resize-none"
              ></textarea>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Observations / Findings (Optional)</label>
              <textarea
                placeholder="Any additional observations..."
                value={newTaskObs}
                onChange={(e) => setNewTaskObs(e.target.value)}
                rows={2}
                className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 transition resize-none"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-2">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white text-xs rounded-lg font-medium hover:bg-purple-500 transition"
              >
                Assign Task
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TODO Column */}
        <div 
          className="space-y-4 min-h-[200px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'todo')}
        >
          <h3 className="text-sm font-semibold text-slate-400 flex items-center uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 mr-2"></span> To Do
          </h3>
          <div className="space-y-3">
            {visibleTasks.filter(t => t.status === 'todo').map((task) => (
              <TaskCard key={task.id} task={task} onToggle={toggleStatus} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        {/* IN PROGRESS Column */}
        <div 
          className="space-y-4 min-h-[200px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'in-progress')}
        >
          <h3 className="text-sm font-semibold text-slate-400 flex items-center uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span> In Progress
          </h3>
          <div className="space-y-3">
            {visibleTasks.filter(t => t.status === 'in-progress').map((task) => (
              <TaskCard key={task.id} task={task} onToggle={toggleStatus} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        {/* DONE Column */}
        <div 
          className="space-y-4 min-h-[200px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'done')}
        >
          <h3 className="text-sm font-semibold text-slate-400 flex items-center uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span> Done
          </h3>
          <div className="space-y-3">
            {visibleTasks.filter(t => t.status === 'done').map((task) => (
              <TaskCard key={task.id} task={task} onToggle={toggleStatus} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TaskCard({ task, onToggle, onNavigate }: { task: Task, onToggle: (id: string, s: Task['status']) => void, key?: React.Key, onNavigate?: (type: 'student' | 'group' | 'staff', id: string) => void }) {
  const getAssigneeColor = (role: Role) => {
    switch (role) {
      case 'arthur': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'isabella': return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case 'gabriel': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'benji': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div 
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
      className={`bg-brand-card p-4 rounded-xl border border-brand-border shadow-sm hover:border-purple-500/50 transition cursor-grab active:cursor-grabbing group ${task.status === 'done' ? 'opacity-60' : ''}`} 
      onClick={() => onToggle(task.id, task.status)}
    >
      <div className="flex justify-between items-start mb-2">
        <span onClick={(e) => { e.stopPropagation(); if(onNavigate) onNavigate('staff', task.assignee); }} className={`text-[10px] px-2 py-0.5 rounded border capitalize cursor-pointer hover:opacity-80 ${getAssigneeColor(task.assignee)}`}>
          @{task.assignee}
        </span>
        <div className="flex items-center space-x-2">
          {task.deadline && (
            <span className="flex items-center text-[10px] text-rose-400/80 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
              <Calendar className="w-3 h-3 mr-1" />
              {task.deadline}
            </span>
          )}
          {task.status === 'todo' && <Clock className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />}
          {task.status === 'in-progress' && <Clock className="w-4 h-4 text-blue-400" />}
          {task.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        </div>
      </div>
      <h4 className={`text-sm font-bold ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
        {task.title}
      </h4>
      {task.relatedEntity && (
        <div className="mt-2 flex items-center text-[10px] text-purple-300 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); if(onNavigate && task.relatedEntity) onNavigate('student', task.relatedEntity); }}><User className="w-3 h-3 mr-1" />{task.relatedEntity}</div>
      )}
      {task.description && (
        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{task.description}</p>
      )}
      {task.observation && (
        <div className="mt-2 p-2 bg-brand-dark/50 rounded border border-brand-border/50 text-[11px] text-slate-300 italic border-l-2 border-l-purple-500">
          <span className="font-semibold not-italic block mb-0.5 text-purple-400">Observation:</span>
          {task.observation}
        </div>
      )}
      <div className="text-[10px] text-slate-500 mt-3 pt-3 border-t border-brand-border/50 flex justify-between">
        <span>From: {task.createdBy.charAt(0).toUpperCase() + task.createdBy.slice(1)}</span>
        <span>{task.createdAt}</span>
      </div>
    </div>
  );
}
