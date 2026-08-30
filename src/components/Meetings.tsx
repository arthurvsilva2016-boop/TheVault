import React, { useState } from 'react';
import { Employee, Meeting } from '../types';
import SaveButton from './SaveButton';
import { Calendar, Clock, Video, UserPlus, Plus, Users, Link } from 'lucide-react';
import { useLiveCall } from '../context/LiveCallContext';

interface MeetingsProps {
  activeEmployee: Employee;
  employees: Employee[];
  meetings: Meeting[];
  onAddMeeting: (meeting: Meeting) => void;
}

export default function Meetings({ 
  activeEmployee, 
  employees,
  meetings,
  onAddMeeting 
}: MeetingsProps) {
  const { startCall } = useLiveCall();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-08-25');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [link, setLink] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([activeEmployee.id]);

  const toggleAttendee = (id: string) => {
    if (selectedAttendees.includes(id)) {
      setSelectedAttendees(selectedAttendees.filter(a => a !== id));
    } else {
      setSelectedAttendees([...selectedAttendees, id]);
    }
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) return;

    const newMeeting: Meeting = {
      id: `m-${Date.now()}`,
      title: title.trim(),
      date,
      time,
      organizerId: activeEmployee.id,
      organizerName: activeEmployee.name,
      attendees: selectedAttendees,
      link: link.trim() || `vault-room-${Date.now()}`,
      days: isRecurring ? selectedDays : undefined,
      endDate: isRecurring ? endDate : undefined
    };

    onAddMeeting(newMeeting);
    setIsCreating(false);
    setTitle('');
    setDate('2026-08-25');
    setTime('14:00');
    setLink('');
    setSelectedAttendees([activeEmployee.id]);
    setIsRecurring(false);
    setSelectedDays([]);
    setEndDate('');
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-100">Staff Meetings</h2>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg font-medium hover:bg-purple-500 transition flex items-center"
        >
          {isCreating ? 'Cancel' : <><Plus className="w-4 h-4 mr-1" /> Schedule Meeting</>}
        </button>
      </div>

      {isCreating && (
        <div className="bg-brand-card p-6 rounded-xl border border-purple-500/50 shadow-lg">
          <h3 className="text-sm font-semibold text-purple-300 mb-4">Schedule a New Meeting</h3>
          <form onSubmit={handleCreateMeeting} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Meeting Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Monthly Review"
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  required 
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2 text-xs text-slate-300 font-bold mb-3 cursor-pointer">
                  <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded border-brand-border text-purple-600 focus:ring-purple-500 bg-brand-dark" />
                  <span>Is this a recurrent meeting?</span>
                </label>
              </div>
              
              {!isRecurring ? (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Date</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                    required={!isRecurring} 
                  />
                </div>
              ) : (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                      required={isRecurring} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">End Date</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                      required={isRecurring} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Schedule Day(s)</label>
                    <div className="flex space-x-1">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition ${selectedDays.includes(day) ? 'bg-purple-600 text-white' : 'bg-brand-dark text-slate-400 border border-brand-border hover:bg-brand-card'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Time</label>
                <input 
                  type="time" 
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                  required 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-2">Invite Staff Members</label>
                <div className="flex flex-wrap gap-2">
                  {employees.map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleAttendee(emp.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        selectedAttendees.includes(emp.id)
                          ? 'bg-purple-600/20 text-purple-300 border-purple-500/30'
                          : 'bg-brand-dark text-slate-400 border-brand-border hover:border-slate-500'
                      }`}
                    >
                      {emp.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <SaveButton type="submit" isFormSubmit={true} className="px-5 py-2 bg-purple-600 text-white text-sm rounded-lg font-medium hover:bg-purple-500" label="Save & Send Invites" savedLabel="Saved" />
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetings.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500 bg-brand-card rounded-xl border border-brand-border">
            No upcoming meetings scheduled.
          </div>
        ) : (
          meetings.sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()).map(meeting => (
            <div key={meeting.id} className="bg-brand-card rounded-xl border border-brand-border p-5 space-y-4 hover:border-purple-500/30 transition group">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-200 group-hover:text-purple-300 transition">{meeting.title}</h3>
                <span className="px-2 py-0.5 text-[10px] bg-brand-dark border border-brand-border rounded text-slate-400">
                  By {meeting.organizerName}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>{meeting.days ? `Repeats ${meeting.days.join(', ')}` : meeting.date}</span>
                  </div>
                  {meeting.days && (
                    <div className="text-[10px] text-slate-500 pl-6">
                      From {meeting.date} {meeting.endDate ? `to ${meeting.endDate}` : ''}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>{meeting.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                  <span>{meeting.attendees.length} Attendees</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-brand-border">
                <button 
                  onClick={() => {
                    startCall(
                      meeting.link || `vault-room-meeting-${meeting.id}`,
                      { id: activeEmployee.id, name: activeEmployee.name, role: activeEmployee.roleTitle, avatarUrl: activeEmployee.avatarUrl },
                      meeting.title,
                      'meeting'
                    );
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2 bg-brand-dark border border-brand-border hover:border-purple-500/50 hover:bg-purple-600/10 text-purple-300 text-sm rounded-lg transition cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Meeting</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
