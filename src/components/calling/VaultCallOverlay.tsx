import React from 'react';
import { useLiveCall } from '../../context/LiveCallContext';
import LiveCallModal from './LiveCallModal';
import { Employee, Student } from '../../types';
import { Phone, PhoneOff, Video, Sparkles, Tv, MonitorSmartphone, X, MicOff, WifiOff } from 'lucide-react';

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
    declineIncomingCall,
    toggleParticipantAudio,
    removeParticipant,
    networkQuality
  } = useLiveCall();

  const normalizedUser = currentUser ? {
    id: currentUser.id,
    name: currentUser.name,
    role: 'roleTitle' in currentUser ? (currentUser as Employee).roleTitle : 'Student',
    avatarUrl: currentUser.avatarUrl
  } : undefined;


  const myDevices = activeCall && normalizedUser
    ? activeCall.participants.filter(p => p.userId === normalizedUser.id)
    : [];

  return (
    <>
      {/* NETWORK QUALITY BANNER */}
      {activeCall && networkQuality === 'poor' && (
        <div className="fixed top-3 sm:top-4 left-1/2 transform -translate-x-1/2 z-[100] bg-orange-500/95 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center space-x-2 animate-fadeIn backdrop-blur-md pointer-events-none max-w-[92%] sm:max-w-md text-center">
          <WifiOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="text-[11px] sm:text-xs font-semibold tracking-wide truncate">Poor network connection. Quality reduced.</span>
        </div>
      )}

      {/* DEVICE SESSIONS POPUP */}
      {myDevices.length > 1 && (
        <div className="fixed bottom-20 sm:bottom-24 right-3 sm:right-5 z-[60] w-[calc(100vw-24px)] max-w-xs sm:w-72 bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl p-3.5 animate-fadeIn">
          <div className="flex items-center gap-2 mb-2.5 border-b border-slate-800 pb-2">
            <MonitorSmartphone className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white">Active Devices ({myDevices.length})</h4>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {myDevices.map(device => (
              <div key={device.id} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-xl border border-slate-700">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {device.isLocal ? 'This Device' : 'Other Device'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{device.id.substring(0, 8)}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!device.isLocal && (
                    <>
                      <button 
                        onClick={() => toggleParticipantAudio(device.id)}
                        className={`p-2 rounded-lg transition min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer ${device.isAudioOn ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                        title={device.isAudioOn ? "Mute this device" : "Unmute this device"}
                      >
                        <MicOff className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => removeParticipant(device.id)}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-red-600 hover:text-white text-slate-300 transition min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                        title="Disconnect this device"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INCOMING CALL RINGING MODAL / BANNER */}
      {incomingCall && (
        <div className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-5 z-50 sm:max-w-md bg-slate-900/98 backdrop-blur-2xl border-2 border-purple-500 rounded-3xl shadow-2xl p-4 sm:p-5 animate-bounce">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300 shrink-0">
              <Video className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Incoming Vault Call</span>
              <h3 className="text-sm sm:text-base font-bold text-white truncate">{incomingCall.callerName}</h3>
              <p className="text-xs text-slate-300 line-clamp-1">{incomingCall.title}</p>
            </div>
          </div>

          <div className="flex space-x-2 sm:space-x-3 pt-1">
            <button
              onClick={declineIncomingCall}
              className="flex-1 py-3 sm:py-2.5 bg-slate-800 hover:bg-red-600/30 text-red-300 hover:text-red-100 rounded-2xl text-xs font-bold border border-red-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Decline</span>
            </button>

            <button
              onClick={() => acceptIncomingCall(normalizedUser || { id: 'guest', name: 'Guest', role: 'Guest' })}
              className="flex-1 py-3 sm:py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30 animate-pulse min-h-[44px]"
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
