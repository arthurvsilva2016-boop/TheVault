import React, { useEffect, useRef } from 'react';
import { CallParticipant } from '../../types';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Hand, 
  Sparkles, 
  ShieldCheck, 
  GraduationCap, 
  Pin, 
  MoreVertical, 
  Volume2,
  Tv
} from 'lucide-react';

interface LiveVideoTileProps {
  participant: CallParticipant;
  stream?: MediaStream | null;
  isSpeaking?: boolean;
  audioLevel?: number;
  isSpotlight?: boolean;
  onToggleMute?: () => void;
  onPinSpotlight?: () => void;
  showTeacherControls?: boolean;
  compact?: boolean;
}

export default function LiveVideoTile({
  participant,
  stream,
  isSpeaking = false,
  audioLevel = 0,
  isSpotlight = false,
  onToggleMute,
  onPinSpotlight,
  showTeacherControls = false,
  compact = false
}: LiveVideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoObj = videoRef.current;
    if (videoObj && stream) {
      if (videoObj.srcObject !== stream) {
        videoObj.srcObject = stream;
      }
      videoObj.play().catch(e => console.warn("Video play failed:", e));
    } else if (videoObj && !stream) {
      videoObj.srcObject = null;
    }
  }, [stream]);

  const hasLiveVideo = participant.isVideoOn && stream;
  const isCurrentlySpeaking = isSpeaking || (participant.isLocal && audioLevel > 12);

  // Avatar Initials
  const initials = participant.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isTeacher = participant.isTeacher || participant.role.toLowerCase().includes('teacher') || participant.role.toLowerCase().includes('instructor');

  return (
    <div 
      className={`relative rounded-2xl overflow-hidden bg-slate-900 border transition-all duration-200 flex flex-col justify-between select-none group ${
        isCurrentlySpeaking 
          ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/10' 
          : isSpotlight 
            ? 'ring-2 ring-purple-500 border-purple-500 shadow-xl' 
            : 'border-slate-800 hover:border-slate-700'
      } ${compact ? 'h-24 sm:h-28 w-36 sm:w-40 shrink-0' : 'w-full h-full min-h-[140px] sm:min-h-[160px]'}`}
    >
      {/* VIDEO STREAM (Always rendered to preserve audio, hidden if no video) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal}
        className={`${hasLiveVideo ? 'w-full h-full object-cover' : 'hidden'} ${participant.isLocal ? 'transform scale-x-[-1]' : ''}`}
      />

      {/* VIRTUAL AVATAR (Fallback when video is off) */}
      {!hasLiveVideo && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-3">
          <div className="relative">
            {participant.avatarUrl ? (
              <img
                src={participant.avatarUrl}
                alt={participant.name}
                className={`rounded-full object-cover border-2 transition-transform duration-300 ${
                  isCurrentlySpeaking 
                    ? 'border-emerald-400 scale-105 ring-4 ring-emerald-500/20' 
                    : isTeacher
                      ? 'border-purple-500'
                      : 'border-slate-700'
                } ${compact ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-12 h-12 sm:w-20 sm:h-20'}`}
              />
            ) : (
              <div
                className={`rounded-full flex items-center justify-center font-bold tracking-wider text-white shadow-lg transition-transform duration-300 ${
                  isCurrentlySpeaking 
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 scale-105 ring-4 ring-emerald-500/20' 
                    : isTeacher 
                      ? 'bg-gradient-to-tr from-purple-700 to-indigo-600' 
                      : 'bg-gradient-to-tr from-slate-700 to-slate-800'
                } ${compact ? 'w-8 h-8 sm:w-10 sm:h-10 text-xs' : 'w-12 h-12 sm:w-20 sm:h-20 text-sm sm:text-xl'}`}
              >
                {initials}
              </div>
            )}

            {/* Speaking audio wave pulsation effect */}
            {isCurrentlySpeaking && (
              <span className="absolute -inset-1.5 rounded-full border-2 border-emerald-400/60 animate-ping pointer-events-none" />
            )}
          </div>

          {!compact && (
            <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-semibold text-slate-300 text-center line-clamp-1 max-w-[90%]">
              {participant.name}
            </p>
          )}
        </div>
      )}

      {/* TOP BAR: Role & Status Indicators */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-10 pointer-events-none">
        <div className="flex items-center space-x-1">
          {isTeacher && (
            <span className="px-1.5 py-0.5 rounded-md bg-purple-900/90 backdrop-blur-md text-purple-200 border border-purple-500/40 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
              <ShieldCheck className="w-2.5 h-2.5 text-purple-300" />
              Teacher
            </span>
          )}

          {participant.isHandRaised && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-extrabold text-[9px] sm:text-[10px] flex items-center gap-1 shadow-md animate-bounce">
              <Hand className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-slate-950" />
              <span className="hidden xs:inline">Raised</span>
            </span>
          )}

          {participant.isScreenSharing && (
            <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[8px] sm:text-[9px] flex items-center gap-1 shadow-sm">
              <Tv className="w-2.5 h-2.5" />
              <span className="hidden xs:inline">Sharing</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 pointer-events-auto opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {onPinSpotlight && (
            <button
              onClick={onPinSpotlight}
              className="p-1.5 sm:p-1 rounded-lg bg-slate-950/80 hover:bg-purple-600 text-slate-300 hover:text-white transition cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
              title="Spotlight video"
            >
              <Pin className="w-3 h-3 sm:w-3 sm:h-3" />
            </button>
          )}

          {showTeacherControls && onToggleMute && (
            <button
              onClick={onToggleMute}
              className={`p-1.5 sm:p-1 rounded-lg transition cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center ${
                participant.isAudioOn 
                  ? 'bg-slate-950/80 hover:bg-red-600 text-slate-300' 
                  : 'bg-red-600 text-white'
              }`}
              title={participant.isAudioOn ? 'Mute participant' : 'Unmute participant'}
            >
              {participant.isAudioOn ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* BOTTOM BAR: Name + Audio Status + Visualizer */}
      <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 right-1.5 sm:right-2 flex justify-between items-center z-10 pointer-events-none">
        <div className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 text-slate-200 text-[10px] sm:text-xs font-semibold flex items-center space-x-1 shadow-sm max-w-[78%]">
          <span className="truncate">{participant.name} {participant.isLocal ? '(You)' : ''}</span>
        </div>

        <div className="flex items-center space-x-1">
          {/* Audio Indicator */}
          <div 
            className={`p-1 sm:p-1 rounded-md backdrop-blur-md border shadow-sm ${
              participant.isAudioOn 
                ? isCurrentlySpeaking 
                  ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse' 
                  : 'bg-slate-950/80 text-emerald-400 border-slate-800'
                : 'bg-red-600/90 text-white border-red-500/50'
            }`}
            title={participant.isAudioOn ? (isCurrentlySpeaking ? 'Speaking' : 'Microphone on') : 'Muted'}
          >
            {participant.isAudioOn ? (
              <Mic className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            ) : (
              <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
