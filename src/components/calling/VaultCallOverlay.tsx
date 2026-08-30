import React from 'react';
import { useLiveCall } from '../../context/LiveCallContext';
import LiveCallModal from './LiveCallModal';
import { Employee, Student } from '../../types';
import { Phone, PhoneOff, Video, Sparkles, Tv } from 'lucide-react';

interface VaultCallOverlayProps {
  currentUser?: Employee | Student | null;
  employees?: Employee[];
  students?: Student[];
}

export default function VaultCallOverlay({
  currentUser,
  employees = [],
  students = []
}: VaultCallOverlayProps) {
  const {
    activeCall,
    incomingCall,
    acceptIncomingCall,
    declineIncomingCall
  } = useLiveCall();

  const normalizedUser = currentUser ? {
    id: currentUser.id,
    name: currentUser.name,
    role: 'roleTitle' in currentUser ? (currentUser as Employee).roleTitle : 'Student',
    avatarUrl: currentUser.avatarUrl
  } : undefined;

  return (
    <>
      {/* INCOMING CALL RINGING MODAL / BANNER */}
      {incomingCall && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full bg-slate-900/95 backdrop-blur-2xl border-2 border-purple-500 rounded-2xl shadow-2xl p-5 animate-bounce">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
              <Video className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Incoming Vault Call</span>
              <h3 className="text-base font-bold text-white">{incomingCall.callerName}</h3>
              <p className="text-xs text-slate-300 line-clamp-1">{incomingCall.title}</p>
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={declineIncomingCall}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-red-600/30 text-red-300 hover:text-red-100 rounded-xl text-xs font-bold border border-red-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Decline</span>
            </button>

            <button
              onClick={() => acceptIncomingCall(normalizedUser || { id: 'guest', name: 'Guest', role: 'Guest' })}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30 animate-pulse"
            >
              <Phone className="w-4 h-4" />
              <span>Accept & Join</span>
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE CALL MODAL (FULLSCREEN OR MINIMIZED) */}
      {activeCall && (
        <LiveCallModal
          currentUser={normalizedUser}
          employees={employees}
          students={students}
        />
      )}
    </>
  );
}
