import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend } from 'recharts';
import { ClassSession, Group } from '../types';
import { BarChart3, TrendingUp, Users, Calendar, CheckCircle2 } from 'lucide-react';

interface AttendanceChartProps {
  classSessions: ClassSession[];
  groups: Group[];
  selectedGroupId?: string | null;
  onSelectGroup?: (groupCode: string) => void;
}

export default function AttendanceChart({
  classSessions,
  groups,
  selectedGroupId,
  onSelectGroup
}: AttendanceChartProps) {
  const [filterGroupCode, setFilterGroupCode] = useState<string>(selectedGroupId || 'all');
  const [timeRange, setTimeRange] = useState<'30' | '60' | 'all'>('30');

  // Filter sessions by group & 30 days time range
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const relevantSessions = classSessions.filter(session => {
    // Filter by group
    if (filterGroupCode !== 'all') {
      const match = session.groupId === filterGroupCode || 
                    session.groupCode === filterGroupCode ||
                    groups.find(g => g.id === session.groupId)?.code === filterGroupCode;
      if (!match) return false;
    }

    // Filter by time range
    if (timeRange === '30') {
      const sessionDate = new Date(session.date);
      // In mock/active environments, allow dates around current month
      const isWithin30 = Math.abs(now.getTime() - sessionDate.getTime()) <= (35 * 24 * 60 * 60 * 1000);
      return isWithin30;
    }
    return true;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Generate chart data points
  const chartData = relevantSessions.map(session => {
    const totalStudents = session.attendance.length || 1;
    const presentCount = session.attendance.filter(a => a.status === 'present').length;
    const lateCount = session.attendance.filter(a => a.status === 'late').length;
    
    // Calculate percentage (treat late as present for baseline or 80%)
    const attendancePercentage = Math.round(((presentCount + (lateCount * 0.8)) / totalStudents) * 100);

    const formattedDate = session.date.length >= 10 
      ? `${session.date.substring(5, 7)}/${session.date.substring(8, 10)}`
      : session.date;

    return {
      id: session.id,
      date: formattedDate,
      fullDate: session.date,
      topic: session.topic,
      groupCode: session.groupCode,
      attendancePercentage: Math.min(100, Math.max(0, attendancePercentage)),
      presentCount,
      lateCount,
      totalStudents,
      status: session.status
    };
  });

  const averageAttendance = chartData.length > 0
    ? Math.round(chartData.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / chartData.length)
    : 0;

  const totalClassesTracked = chartData.length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-brand-dark/95 border border-purple-500/50 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[200px] z-50">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-1">
            <span className="font-bold text-purple-300">Group {data.groupCode}</span>
            <span className="text-slate-400 font-mono">{data.fullDate}</span>
          </div>
          <p className="text-slate-200 font-medium truncate max-w-xs">{data.topic}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400">Attendance Rate:</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">{data.attendancePercentage}%</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Rollcall:</span>
            <span>{data.presentCount} of {data.totalStudents} Present</span>
          </div>
          <div className="text-[10px] text-purple-400/80 capitalize">
            Status: {data.status}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border p-5 space-y-4 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-600/20 rounded-xl border border-purple-500/30 text-purple-300">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center">
              Attendance Analytics (Last 30 Days)
              <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                {averageAttendance}% Avg
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualize attendance trends and rollcall compliance per class session.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2 text-xs">
          <select
            value={filterGroupCode}
            onChange={(e) => {
              setFilterGroupCode(e.target.value);
              onSelectGroup?.(e.target.value);
            }}
            className="bg-brand-dark border border-brand-border text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer font-semibold"
          >
            <option value="all">All Groups Combined</option>
            {groups.map(g => (
              <option key={g.id} value={g.code}>Group {g.code} ({g.level})</option>
            ))}
          </select>

          <div className="flex items-center bg-brand-dark border border-brand-border rounded-lg p-0.5">
            <button
              onClick={() => setTimeRange('30')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                timeRange === '30' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                timeRange === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-64 w-full pt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
            <Calendar className="w-8 h-8 opacity-40 text-purple-400" />
            <p>No class attendance records found for the selected group in this time range.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2440" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#2a2440' }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
                tickLine={false}
                axisLine={{ stroke: '#2a2440' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="attendancePercentage" 
                name="Attendance Rate" 
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              >
                {chartData.map((entry, index) => {
                  let fillColor = '#8b5cf6'; // Violet standard
                  if (entry.attendancePercentage >= 90) fillColor = '#10b981'; // Emerald high
                  else if (entry.attendancePercentage < 60) fillColor = '#f43f5e'; // Rose low
                  else if (entry.attendancePercentage < 80) fillColor = '#f59e0b'; // Amber medium
                  return <Cell key={`cell-${index}`} fill={fillColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-brand-border text-xs">
        <div className="p-2.5 bg-brand-dark/50 rounded-xl border border-brand-border">
          <span className="text-slate-400 text-[10px] block">Average Attendance</span>
          <span className="text-base font-bold text-purple-300 font-mono">{averageAttendance}%</span>
        </div>
        <div className="p-2.5 bg-brand-dark/50 rounded-xl border border-brand-border">
          <span className="text-slate-400 text-[10px] block">Class Sessions Tracked</span>
          <span className="text-base font-bold text-slate-200 font-mono">{totalClassesTracked}</span>
        </div>
        <div className="p-2.5 bg-brand-dark/50 rounded-xl border border-brand-border">
          <span className="text-slate-400 text-[10px] block">Target Compliance</span>
          <span className="text-base font-bold text-emerald-400 font-mono">≥ 85%</span>
        </div>
        <div className="p-2.5 bg-brand-dark/50 rounded-xl border border-brand-border">
          <span className="text-slate-400 text-[10px] block">Selected Group Filter</span>
          <span className="text-base font-bold text-purple-400 font-mono">
            {filterGroupCode === 'all' ? 'All' : `Group ${filterGroupCode}`}
          </span>
        </div>
      </div>
    </div>
  );
}
