import React, { useState, useEffect } from 'react';
import { useLiveCall } from '../../context/LiveCallContext';
import LiveVideoTile from './LiveVideoTile';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Tv, 
  Hand, 
  Users, 
  PhoneOff, 
  VolumeX, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  MessageSquare, 
  PenTool, 
  UserPlus, 
  Radio, 
  Settings 
} from 'lucide-react';
import { Student, Employee } from '../../types';

interface ClassroomLiveCallBarProps {
  groupStudents?: Student[];
  onOpenWhiteboard?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

export default function ClassroomLiveCallBar({
  groupStudents = [],
  onOpenWhiteboard,
  onToggleChat,
  isChatOpen = false
}: ClassroomLiveCallBarProps) {
  const {
    activeCall,
    localStream,
    screenStream,
    isMicMuted,
    isVideoMuted,
    isScreenSharing,
    isHandRaised,
    audioLevel,
    toggleMic,
    toggleVideo,
    toggleScreenShare,
    approveScreenShare,
    denyScreenShare,
    toggleHandRaise,
    leaveCall,
    muteAllStudents,
    toggleParticipantAudio,
    ringParticipant
  } = useLiveCall();

  const [isExpanded, setIsExpanded] = useState(true);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState('00:00');
  const [showInviteDropdown, setShowInviteDropdown] = useState(false);

  // Call duration counter
  useEffect(() => {
    if (!activeCall) return;
    const start = new Date(activeCall.startedAt).getTime();
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
      const mins = String(Math.floor(diff / 60)).padStart(2, '0');
      const secs = String(diff % 60).padStart(2, '0');
      setCallDuration(`${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCall?.startedAt]);

  if (!activeCall) return null;

  const participants = activeCall.participants || [];
  const raisedHandsCount = participants.filter(p => p.isHandRaised).length;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-purple-500/30 rounded-2xl p-3 shadow-xl flex flex-col gap-2 shrink-0 transition-all">
      {/* Top Header Bar with Live Indicator & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>LIVE CALL • {callDuration}</span>
          </div>

          <div className="flex items-center space-x-1 text-xs text-slate-300">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold">{participants.length} connected</span>
          </div>

          {activeCall?.screenShareRequest && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/50 border border-blue-500/50 rounded-lg mr-2">
              <span className="text-xs text-blue-200 font-bold"><strong className="text-white">{activeCall.screenShareRequest.name}</strong> wants to share screen</span>
              <button onClick={() => approveScreenShare(activeCall.screenShareRequest!.participantId)} className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold cursor-pointer">Allow</button>
              <button onClick={() => denyScreenShare()} className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs cursor-pointer">Deny</button>
            </div>
          )}
          {raisedHandsCount > 0 && (
            <div className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1 animate-bounce">
              <Hand className="w-3 h-3 fill-amber-400" />
              <span>{raisedHandsCount} {raisedHandsCount === 1 ? 'hand raised' : 'hands raised'}</span>
            </div>
          )}
        </div>

        {/* Live Call Center Controls */}
        <div className="flex items-center space-x-1.5">
          {/* Mute Mic */}
          <button
            onClick={toggleMic}
            className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              isMicMuted 
                ? 'bg-red-600 hover:bg-red-500 text-white' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={isMicMuted ? 'Unmute Microphone (Ctrl+D)' : 'Mute Microphone (Ctrl+D)'}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">{isMicMuted ? 'Muted' : 'Mic On'}</span>
          </button>

          {/* Toggle Video */}
          <button
            onClick={toggleVideo}
            className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              isVideoMuted 
                ? 'bg-red-600 hover:bg-red-500 text-white' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={isVideoMuted ? 'Turn Camera On (Ctrl+E)' : 'Turn Camera Off (Ctrl+E)'}
          >
            {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-purple-400" />}
            <span className="hidden sm:inline">{isVideoMuted ? 'Camera Off' : 'Camera'}</span>
          </button>

          {/* Share Screen */}
          <button
            onClick={toggleScreenShare}
            className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              isScreenSharing 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Share Screen"
          >
            <Tv className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">{isScreenSharing ? 'Sharing' : 'Share'}</span>
          </button>

          {/* Raise Hand */}
          <button
            onClick={toggleHandRaise}
            className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              isHandRaised 
                ? 'bg-amber-500 text-slate-950 font-bold' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Raise Hand"
          >
            <Hand className={`w-4 h-4 ${isHandRaised ? 'fill-slate-950' : 'text-amber-400'}`} />
          </button>

          {/* Teacher Action: Mute All Students */}
          <button
            onClick={muteAllStudents}
            className="px-2.5 py-2 bg-slate-800 hover:bg-red-600/30 text-red-300 hover:text-red-100 rounded-xl text-xs font-semibold border border-red-500/30 transition flex items-center gap-1 cursor-pointer"
            title="Mute All Students"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mute All</span>
          </button>

          {/* Toggle Live Chat */}
          {onToggleChat && (
            <button
              onClick={onToggleChat}
              className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                isChatOpen 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Classroom Chat"
            >
              <MessageSquare className="w-4 h-4 text-purple-300" />
            </button>
          )}

          {/* Invite Absent Student */}
          <div className="relative">
            <button
              onClick={() => setShowInviteDropdown(!showInviteDropdown)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Ring / Invite student to class"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
            </button>

            {showInviteDropdown && (
              <div className="absolute right-0 top-11 w-56 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">Ring Student to Join</p>
                {groupStudents.length === 0 ? (
                  <p className="text-xs text-slate-500 px-2 py-1">No additional students in group</p>
                ) : (
                  groupStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => {
                        ringParticipant(student.name);
                        setShowInviteDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-600/20 text-slate-200 text-xs font-medium flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="truncate">{student.name}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">Ring 📞</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Leave / End Call */}
          <button
            onClick={leaveCall}
            className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-md shadow-red-600/20"
            title="Leave / End Live Call"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>

          {/* Minimize / Expand Bar */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title={isExpanded ? 'Collapse video strip' : 'Expand video strip'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* HORIZONTAL PARTICIPANTS VIDEO DOCK / STRIP */}
      {isExpanded && (
        <div className="pt-2 border-t border-slate-800/80 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {participants.map(participant => (
            <LiveVideoTile
              key={participant.id}
              participant={participant}
              stream={participant.isLocal ? localStream : undefined}
              audioLevel={participant.isLocal ? audioLevel : 0}
              isSpotlight={spotlightId === participant.id}
              onPinSpotlight={() => setSpotlightId(spotlightId === participant.id ? null : participant.id)}
              onToggleMute={() => toggleParticipantAudio(participant.id)}
              showTeacherControls={true}
              compact={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
