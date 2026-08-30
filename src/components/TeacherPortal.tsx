import React, { useState } from 'react';
import { Group, Employee } from '../types';
import { Users, Video, Calendar as CalendarIcon, BookOpen, User, Clock, CalendarDays, ExternalLink } from 'lucide-react';
import { useLiveCall } from '../context/LiveCallContext';

interface TeacherPortalProps {
  onNavigate?: (type: 'student' | 'group' | 'staff', id: string) => void;
  activeEmployee: Employee;
  groups: Group[];
}

const DAYS_OF_WEEK = [
  { key: 'Mon', name: 'Monday', short: 'Mon' },
  { key: 'Tue', name: 'Tuesday', short: 'Tue' },
  { key: 'Wed', name: 'Wednesday', short: 'Wed' },
  { key: 'Thu', name: 'Thursday', short: 'Thu' },
  { key: 'Fri', name: 'Friday', short: 'Fri' },
  { key: 'Sat', name: 'Saturday', short: 'Sat' },
  { key: 'Sun', name: 'Sunday', short: 'Sun' },
];

export default function TeacherPortal({ activeEmployee, groups, onNavigate }: TeacherPortalProps) {
  const { startCall } = useLiveCall();
  const currentTeacherName = activeEmployee.name;
  const teacherGroups = groups.filter((g) => 
    g.teacher.toLowerCase() === currentTeacherName.toLowerCase() ||
    g.teacher.toLowerCase() === activeEmployee.username.toLowerCase()
  );

  const totalStudents = teacherGroups.reduce((sum, g) => sum + (g.studentsCount || 0), 0);

  const groupMatchesDay = (group: Group, dayKey: string): boolean => {
    const sched = (group.schedule || '').toLowerCase();
    if (dayKey === 'Mon') return sched.includes('mon') || sched.includes('seg');
    if (dayKey === 'Tue') return sched.includes('tue') || sched.includes('ter');
    if (dayKey === 'Wed') return sched.includes('wed') || sched.includes('qua');
    if (dayKey === 'Thu') return sched.includes('thu') || sched.includes('qui');
    if (dayKey === 'Fri') return sched.includes('fri') || sched.includes('sex');
    if (dayKey === 'Sat') return sched.includes('sat') || sched.includes('sab');
    if (dayKey === 'Sun') return sched.includes('sun') || sched.includes('dom');
    return false;
  };

  return (
    <section className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-900/30 to-brand-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase tracking-wider">
            Personal Teaching Portal
          </span>
          <h2 className="text-xl font-bold text-slate-100 mt-1">Instructor Workspace & Schedule</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Logged in as <strong>{currentTeacherName}</strong> ({activeEmployee.roleTitle})
          </p>
        </div>

        {/* Quick Teacher Metrics */}
        <div className="flex items-center space-x-3">
          <div className="bg-brand-dark/80 px-4 py-2 rounded-xl border border-brand-border text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Classes</span>
            <p className="text-base font-bold text-slate-200">{teacherGroups.length} Groups</p>
          </div>
          <div className="bg-brand-dark/80 px-4 py-2 rounded-xl border border-brand-border text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">My Students</span>
            <p className="text-base font-bold text-purple-300">{totalStudents} Enrolled</p>
          </div>
        </div>
      </div>
      <div className="p-6 rounded-2xl border border-purple-500/20 bg-brand-card flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Vivlío (3D Game)</h3>
          <p className="text-sm text-slate-400">Enter the immersive 3D world.</p>
        </div>
        <button 
          onClick={() => onNavigate && onNavigate('game' as any, '')}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition"
        >
          Play Vivlío
        </button>
      </div>


      {/* Teacher's Separate Weekly Schedule Card */}
      <div className="bg-brand-card p-5 rounded-2xl border border-brand-border shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-brand-border">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center">
              <CalendarDays className="w-4 h-4 mr-2 text-purple-400" />
              My Weekly Class Timetable
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Your schedule breakdown across all assigned study groups.</p>
          </div>
          <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
            ~{teacherGroups.length * 2} teaching hrs/week
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {DAYS_OF_WEEK.map(day => {
            const dayClasses = teacherGroups.filter(g => groupMatchesDay(g, day.key));
            const hasClasses = dayClasses.length > 0;

            return (
              <div 
                key={day.key}
                className={`p-3.5 rounded-xl border flex flex-col justify-between min-h-[140px] transition ${
                  hasClasses 
                    ? 'bg-brand-dark/90 border-purple-500/40 shadow-sm' 
                    : 'bg-brand-dark/30 border-brand-border/60 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-brand-border/60 mb-2">
                    <span className={`text-xs font-bold ${hasClasses ? 'text-purple-300' : 'text-slate-400'}`}>
                      {day.name}
                    </span>
                    {hasClasses && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                    )}
                  </div>

                  {hasClasses ? (
                    <div className="space-y-2">
                      {dayClasses.map(g => (
                        <div key={g.id} className="p-2 bg-brand-card rounded-lg border border-brand-border text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-300 font-mono line-clamp-1">{g.name || g.code}</span>
                            <span className="text-[10px] text-amber-300 font-mono ml-1 shrink-0">{g.schedule.split(' ')[1] || '19:00'}</span>
                          </div>
                          <p className="text-[10px] text-slate-300 truncate">{g.level}</p>
                          <button
                            onClick={() => {
                              startCall(
                                g.meetLink || `vault-room-group-${g.code}`,
                                { id: activeEmployee.id, name: activeEmployee.name, role: activeEmployee.roleTitle, avatarUrl: activeEmployee.avatarUrl },
                                `Group ${g.code}`,
                                'class'
                              );
                            }}
                            className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold flex items-center pt-1 cursor-pointer"
                          >
                            <Video className="w-3 h-3 mr-1" />
                            Join Call
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic pt-3 text-center">No classes scheduled</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Groups List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center">
          <BookOpen className="w-4 h-4 mr-2 text-purple-400" />
          My Assigned Study Groups ({teacherGroups.length})
        </h3>

        {teacherGroups.length === 0 ? (
          <div className="bg-brand-card p-8 rounded-2xl border border-brand-border text-center flex flex-col items-center">
            <User className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-300 font-medium">No groups assigned</p>
            <p className="text-slate-500 text-xs mt-1">You are not currently assigned as an instructor to any active groups.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => onNavigate && onNavigate('group', group.id)} 
                className="bg-brand-card p-5 rounded-2xl border border-brand-border space-y-4 hover:border-purple-500/50 transition group cursor-pointer shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-100 group-hover:text-purple-300 transition">
                      Group {group.code}
                    </h4>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                      My Class
                    </span>
                  </div>
                  <span className="flex items-center px-2 py-0.5 text-[10px] bg-brand-dark text-slate-300 rounded border border-brand-border">
                    <Users className="w-3 h-3 mr-1 text-purple-400" />
                    {group.studentsCount} Students
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-slate-500" />
                    <span className="text-slate-300 font-medium">{group.level}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-slate-500" />
                    <span className="text-slate-300 font-mono">{group.schedule}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-brand-border flex gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      startCall(
                        group.meetLink || `vault-room-group-${group.code}`,
                        { id: activeEmployee.id, name: activeEmployee.name, role: activeEmployee.roleTitle, avatarUrl: activeEmployee.avatarUrl },
                        `Group ${group.code}`,
                        'class'
                      );
                    }}
                    className="flex-1 flex items-center justify-center py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Start Class
                  </button>
                  <button 
                    onClick={() => onNavigate && onNavigate('group', group.code)}
                    className="px-3.5 py-2 bg-brand-dark hover:bg-purple-900/40 border border-brand-border hover:border-purple-500/50 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
