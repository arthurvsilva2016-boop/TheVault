import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveCall } from '../../context/LiveCallContext';
import LiveVideoTile from './LiveVideoTile';
import VirtualWhiteboard from '../VirtualWhiteboard';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Tv, 
  Hand, 
  MessageSquare, 
  PenTool, 
  VolumeX, 
  PhoneOff, 
  Maximize2, 
  Minimize2, 
  Send, 
  X, 
  Share2, 
  Users, 
  Grid, 
  Layout, 
  Sparkles, 
  Check, 
  Layers, 
  HelpCircle,
  Columns,
  SplitSquareHorizontal
} from 'lucide-react';
import { Employee, Student } from '../../types';

interface LiveCallModalProps {
  currentUser?: { id: string; name: string; role: string; avatarUrl?: string };
  employees?: Employee[];
  students?: Student[];
}

export default function LiveCallModal({
  currentUser,
  employees = [],
  students = []
}: LiveCallModalProps) {
  const {
    activeCall,
    localStream,
    screenStream,
    isMicMuted,
    isVideoMuted,
    isScreenSharing,
    isHandRaised,
    isCallMinimized,
    isWhiteboardActive,
    isChatDrawerOpen,
    audioLevel,
    mediaError,
    toggleMic,
    toggleVideo,
    toggleScreenShare,
    approveScreenShare,
    denyScreenShare,
    toggleHandRaise,
    setIsCallMinimized,
    setIsWhiteboardActive,
    setIsChatDrawerOpen,
    sendCallMessage,
    leaveCall,
    muteAllStudents,
    toggleParticipantAudio,
    ringParticipant
  } = useLiveCall();

  const [activeTab, setActiveTab] = useState<'video' | 'slides'>('video');
  const [isWhiteboardDrawerOpen, setIsWhiteboardDrawerOpen] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(440);
  const [rightPanelMode, setRightPanelMode] = useState<'split' | 'tabs'>('split');
  const [activeRightTab, setActiveRightTab] = useState<'whiteboard' | 'chat'>('whiteboard');
  const [isResizing, setIsResizing] = useState(false);
  
  const [layoutMode, setLayoutMode] = useState<'grid' | 'spotlight'>('grid');
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [callDuration, setCallDuration] = useState('00:00');
  const [meetingNotes, setMeetingNotes] = useState(
    '📝 Live Meeting Agenda & Minutes:\n• Welcome & Check-in\n• Academic and administrative review\n• Action items & next steps'
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Resize handler for right panel
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 320 && newWidth <= Math.min(950, window.innerWidth * 0.7)) {
        setRightPanelWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

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

  // Scroll chat to bottom
  useEffect(() => {
    if (isChatDrawerOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeCall?.messages?.length, isChatDrawerOpen]);

  if (!activeCall) return null;

  const participants = activeCall.participants || [];
  const raisedHandsCount = participants.filter(p => p.isHandRaised).length;
  const isRightPanelOpen = isChatDrawerOpen || isWhiteboardDrawerOpen;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const sender = currentUser ? {
      id: currentUser.id,
      name: currentUser.name
    } : {
      id: 'local',
      name: 'Guest User'
    };

    sendCallMessage(chatInput, sender);
    setChatInput('');
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(`Vault Meeting Room: ${activeCall.roomCode}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // SPOTLIGHT PARTICIPANT RESOLUTION
  const spotlightParticipant = spotlightId 
    ? participants.find(p => p.id === spotlightId) 
    : participants.find(p => p.isScreenSharing) || participants.find(p => p.isTeacher) || participants[0];

  // If minimized, display picture-in-picture floating box
  if (isCallMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 w-80 bg-slate-950/95 backdrop-blur-xl border border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        {/* Minimized Header */}
        <div className="p-3 bg-gradient-to-r from-purple-900/60 to-slate-900 border-b border-purple-500/30 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-100 line-clamp-1">{activeCall.title}</span>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-[10px] font-mono text-purple-300 mr-1">{callDuration}</span>
            <button
              onClick={() => setIsCallMinimized(false)}
              className="p-1 rounded-md bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition cursor-pointer"
              title="Expand call to fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={leaveCall}
              className="p-1 rounded-md bg-red-600/80 hover:bg-red-600 text-white transition cursor-pointer"
              title="Leave call"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Small Video Preview */}
        <div className="h-40 bg-slate-900 relative flex items-center justify-center">
          {localStream && !isVideoMuted ? (
            <video
              autoPlay
              playsInline
              muted
              ref={el => {
                if (el && localStream) el.srcObject = localStream;
              }}
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center mx-auto text-purple-300 font-bold mb-2">
                {currentUser?.name?.[0] || 'V'}
              </div>
              <p className="text-xs text-slate-300 font-semibold">{currentUser?.name || 'Vault Call'}</p>
            </div>
          )}

          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] text-slate-300 border border-slate-800">
            {participants.length} connected
          </div>
        </div>

        {/* Minimized Controls */}
        <div className="p-2.5 bg-slate-950 flex justify-around items-center border-t border-slate-800">
          <button
            onClick={toggleMic}
            className={`p-2 rounded-xl text-xs font-semibold cursor-pointer ${
              isMicMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200'
            }`}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-2 rounded-xl text-xs font-semibold cursor-pointer ${
              isVideoMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200'
            }`}
          >
            {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-purple-400" />}
          </button>
          <button
            onClick={toggleHandRaise}
            className={`p-2 rounded-xl text-xs font-semibold cursor-pointer ${
              isHandRaised ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200'
            }`}
          >
            <Hand className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCallMinimized(false)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Open</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden animate-fadeIn select-none">
      {/* CONFERENCE TOP HEADER */}
      <header className="p-3.5 bg-slate-900/90 backdrop-blur-md border-b border-brand-border flex justify-between items-center shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/20 text-white font-bold">
            <Tv className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE CALL
              </span>
              <h2 className="text-sm font-bold text-slate-100 line-clamp-1">{activeCall.title}</h2>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Room: <strong className="text-purple-300">{activeCall.roomCode}</strong> • Duration: {callDuration}
            </p>
          </div>
        </div>

        {/* View Switchers & Top Tools */}
        <div className="flex items-center space-x-2">
          {/* Main Stage Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-brand-border text-xs">
            <button
              onClick={() => setActiveTab('video')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'video' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Video Grid</span>
            </button>

            <button
              onClick={() => setActiveTab('slides')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'slides' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Meeting Agenda</span>
            </button>
          </div>

          {/* Right Side Tools Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-brand-border text-xs">
            <button
              onClick={() => setIsWhiteboardDrawerOpen(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isWhiteboardDrawerOpen ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Side Whiteboard"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Whiteboard</span>
            </button>

            <button
              onClick={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isChatDrawerOpen ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Side Chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
          </div>

          <button
            onClick={handleCopyInvite}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-brand-border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Copy meeting code"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-purple-400" />}
            <span>{copiedLink ? 'Copied' : 'Invite'}</span>
          </button>

          <button
            onClick={() => setIsCallMinimized(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-brand-border transition cursor-pointer"
            title="Minimize call to floating PIP"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CALL NOTIFICATION / SCREEN SHARE PERMISSION BANNER */}
      {activeCall?.screenShareRequest && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-blue-950/95 backdrop-blur-md border border-blue-500/80 rounded-2xl shadow-2xl animate-slideDown">
          <div className="p-2 rounded-xl bg-blue-600 text-white">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Screen Sharing Permission Request</p>
            <p className="text-[11px] text-blue-200">
              <strong className="text-white">{activeCall.screenShareRequest.name}</strong> wants to share their screen with the class.
            </p>
          </div>
          <div className="flex gap-2 ml-3">
            <button 
              onClick={() => approveScreenShare(activeCall.screenShareRequest!.participantId)} 
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md"
            >
              Allow Sharing
            </button>
            <button 
              onClick={() => denyScreenShare()} 
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer transition border border-slate-700"
            >
              Deny
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONFERENCE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT / CENTER: PRIMARY MEDIA STAGE */}
        <div className="flex-1 flex flex-col p-3 overflow-y-auto min-w-0 transition-all">
          {/* TAB 1: VIDEO CONFERENCING GRID / SPOTLIGHT */}
          {activeTab === 'video' && (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              {/* Screen share banner if active */}
              {activeCall.screenShareParticipantId && (
                <div className="p-2.5 bg-blue-950/60 border border-blue-500/40 rounded-xl flex items-center justify-between text-xs text-blue-200">
                  <div className="flex items-center space-x-2">
                    <Tv className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span>
                      <strong className="text-white">
                        {participants.find(p => p.id === activeCall.screenShareParticipantId)?.name || 'Participant'}
                      </strong> is presenting their screen.
                    </span>
                  </div>
                  {isScreenSharing && (
                    <button
                      onClick={toggleScreenShare}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition text-[11px] cursor-pointer"
                    >
                      Stop Sharing
                    </button>
                  )}
                </div>
              )}

              {/* View Layout Controls */}
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>{participants.length} Active in Room</span>
                </div>

                <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-brand-border text-xs">
                  <button
                    onClick={() => {
                      setLayoutMode('grid');
                      setSpotlightId(null);
                    }}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      layoutMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Grid Layout"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setLayoutMode('spotlight')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      layoutMode === 'spotlight' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Speaker Spotlight Layout"
                  >
                    <Layout className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* VIDEO GRID LAYOUT */}
              {layoutMode === 'grid' && (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 min-h-0 auto-rows-fr">
                  {participants.map(participant => (
                    <LiveVideoTile
                      key={participant.id}
                      participant={participant}
                      stream={participant.isLocal ? (isScreenSharing && screenStream ? screenStream : localStream) : undefined}
                      audioLevel={participant.isLocal ? audioLevel : (participant.isSpeaking ? 0.6 : 0)}
                      isSpotlight={false}
                      onPinSpotlight={() => {
                        setSpotlightId(participant.id);
                        setLayoutMode('spotlight');
                      }}
                      onToggleMute={() => toggleParticipantAudio(participant.id)}
                      showTeacherControls={true}
                    />
                  ))}
                </div>
              )}

              {/* SPOTLIGHT SPEAKER LAYOUT */}
              {layoutMode === 'spotlight' && spotlightParticipant && (
                <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
                  {/* Spotlight Stage */}
                  <div className="flex-1 min-h-[350px] bg-slate-900 rounded-2xl overflow-hidden border border-purple-500/40 shadow-2xl relative">
                    <LiveVideoTile
                      participant={spotlightParticipant}
                      stream={spotlightParticipant.isLocal ? (isScreenSharing && screenStream ? screenStream : localStream) : undefined}
                      audioLevel={spotlightParticipant.isLocal ? audioLevel : 0.7}
                      isSpotlight={true}
                      showTeacherControls={true}
                    />
                  </div>

                  {/* Sidebar Tiles */}
                  <div className="lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto shrink-0 pb-1">
                    {participants.filter(p => p.id !== spotlightParticipant?.id).map(participant => (
                      <div key={participant.id} className="h-32 lg:h-36 shrink-0 w-44 lg:w-full">
                        <LiveVideoTile
                          participant={participant}
                          stream={participant.isLocal ? localStream : undefined}
                          audioLevel={participant.isLocal ? audioLevel : 0}
                          isSpotlight={false}
                          onPinSpotlight={() => setSpotlightId(participant.id)}
                          onToggleMute={() => toggleParticipantAudio(participant.id)}
                          showTeacherControls={true}
                          compact={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEETING NOTES & AGENDA */}
          {activeTab === 'slides' && (
            <div className="flex-1 flex flex-col bg-slate-900 border border-brand-border rounded-2xl p-5 shadow-2xl space-y-4 max-w-4xl mx-auto w-full">
              <div className="flex justify-between items-center pb-3 border-b border-brand-border">
                <h3 className="text-base font-bold text-slate-100 flex items-center">
                  <Layers className="w-5 h-5 mr-2 text-purple-400" />
                  Shared Live Meeting Notes & Action Items
                </h3>
                <span className="text-xs text-purple-300 font-semibold bg-purple-600/20 px-2.5 py-1 rounded-lg border border-purple-500/30">
                  Auto-saved in Vault
                </span>
              </div>
              <textarea
                value={meetingNotes}
                onChange={e => setMeetingNotes(e.target.value)}
                rows={16}
                className="w-full bg-slate-950 border border-brand-border rounded-xl p-4 text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-purple-500 resize-none shadow-inner"
                placeholder="Type real-time meeting minutes, key takeaways, and action items..."
              />
            </div>
          )}
        </div>

        {/* RESIZABLE RIGHT SIDEBAR (WHITEBOARD & CHAT) */}
        {isRightPanelOpen && (
          <>
            {/* Draggable Resize Handle */}
            <div
              onMouseDown={startResizing}
              className={`w-1.5 bg-brand-border hover:bg-purple-500 active:bg-purple-400 cursor-col-resize z-40 transition-colors ${
                isResizing ? 'bg-purple-500' : ''
              }`}
              title="Drag to resize right whiteboard & chat panel"
            />

            <div 
              style={{ width: `${rightPanelWidth}px` }} 
              className="bg-slate-900 border-l border-brand-border flex flex-col shrink-0 z-30 shadow-2xl relative min-w-[320px] max-w-[950px]"
            >
              {/* Right Panel Header */}
              <div className="p-3 border-b border-brand-border flex justify-between items-center bg-slate-950 shrink-0">
                <div className="flex items-center space-x-2">
                  {isWhiteboardDrawerOpen && isChatDrawerOpen ? (
                    <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                      <button
                        onClick={() => setRightPanelMode('split')}
                        className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer flex items-center gap-1 ${
                          rightPanelMode === 'split' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Side-by-Side Split View"
                      >
                        <Columns className="w-3.5 h-3.5" />
                        <span>Both</span>
                      </button>
                      <button
                        onClick={() => {
                          setRightPanelMode('tabs');
                          setActiveRightTab('whiteboard');
                        }}
                        className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                          rightPanelMode === 'tabs' && activeRightTab === 'whiteboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Board
                      </button>
                      <button
                        onClick={() => {
                          setRightPanelMode('tabs');
                          setActiveRightTab('chat');
                        }}
                        className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                          rightPanelMode === 'tabs' && activeRightTab === 'chat' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Chat
                      </button>
                    </div>
                  ) : isWhiteboardDrawerOpen ? (
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
                      <PenTool className="w-4 h-4 text-indigo-400" />
                      <span>Live Whiteboard</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      <span>In-Call Chat</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-mono text-slate-400 mr-2">
                    {rightPanelWidth}px (Drag edge to resize)
                  </span>
                  <button
                    onClick={() => {
                      setIsWhiteboardDrawerOpen(false);
                      setIsChatDrawerOpen(false);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Close Right Panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Panel Body */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                {/* BOTH OPEN - SPLIT MODE */}
                {isWhiteboardDrawerOpen && isChatDrawerOpen && rightPanelMode === 'split' && (
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Whiteboard half */}
                    <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-brand-border p-2 min-h-0 overflow-hidden">
                      <VirtualWhiteboard
                        boardId={`meeting_wb_${activeCall.roomCode}`}
                        title={`Whiteboard • ${activeCall.title}`}
                        authorName={currentUser?.name || 'Meeting Host'}
                        heightClass="h-full min-h-[300px]"
                        showTeacherControls={true}
                      />
                    </div>

                    {/* Chat half */}
                    <div className="w-full md:w-72 flex flex-col min-h-0 shrink-0 bg-slate-950/40">
                      <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans text-xs">
                        {activeCall.messages?.map(msg => {
                          const isSys = msg.senderId === 'system';
                          const isMe = currentUser && msg.senderId === currentUser.id;

                          if (isSys) {
                            return (
                              <div key={msg.id} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 text-center italic">
                                {msg.text}
                              </div>
                            );
                          }

                          return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center space-x-1.5 mb-0.5 text-[10px] text-slate-400">
                                <span className="font-bold text-purple-300">{msg.senderName}</span>
                                <span>{msg.time}</span>
                              </div>
                              <div className={`p-2.5 rounded-xl max-w-[90%] text-slate-100 ${
                                isMe 
                                  ? 'bg-purple-600 text-white rounded-tr-none' 
                                  : 'bg-slate-800 border border-slate-700 rounded-tl-none'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatBottomRef} />
                      </div>

                      {/* Chat Input */}
                      <form onSubmit={handleSendChat} className="p-2.5 bg-slate-950 border-t border-brand-border flex items-center space-x-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          placeholder="Type message..."
                          className="flex-1 bg-slate-900 border border-brand-border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim()}
                          className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer shadow-md"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* SINGLE ITEM OR TAB MODE: WHITEBOARD ONLY */}
                {((isWhiteboardDrawerOpen && !isChatDrawerOpen) || (isWhiteboardDrawerOpen && isChatDrawerOpen && rightPanelMode === 'tabs' && activeRightTab === 'whiteboard')) && (
                  <div className="flex-1 flex flex-col p-2 min-h-0 overflow-hidden">
                    <VirtualWhiteboard
                      boardId={`meeting_wb_${activeCall.roomCode}`}
                      title={`Whiteboard • ${activeCall.title}`}
                      authorName={currentUser?.name || 'Meeting Host'}
                      heightClass="h-full min-h-[450px]"
                      showTeacherControls={true}
                    />
                  </div>
                )}

                {/* SINGLE ITEM OR TAB MODE: CHAT ONLY */}
                {((isChatDrawerOpen && !isWhiteboardDrawerOpen) || (isWhiteboardDrawerOpen && isChatDrawerOpen && rightPanelMode === 'tabs' && activeRightTab === 'chat')) && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans text-xs">
                      {activeCall.messages?.map(msg => {
                        const isSys = msg.senderId === 'system';
                        const isMe = currentUser && msg.senderId === currentUser.id;

                        if (isSys) {
                          return (
                            <div key={msg.id} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 text-center italic">
                              {msg.text}
                            </div>
                          );
                        }

                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center space-x-1.5 mb-0.5 text-[10px] text-slate-400">
                              <span className="font-bold text-purple-300">{msg.senderName}</span>
                              <span>{msg.time}</span>
                            </div>
                            <div className={`p-2.5 rounded-xl max-w-[85%] text-slate-100 ${
                              isMe 
                                ? 'bg-purple-600 text-white rounded-tr-none' 
                                : 'bg-slate-800 border border-slate-700 rounded-tl-none'
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat input box */}
                    <form onSubmit={handleSendChat} className="p-3 bg-slate-950 border-t border-brand-border flex items-center space-x-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Send message to call..."
                        className="flex-1 bg-slate-900 border border-brand-border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer shadow-lg shadow-purple-600/20"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* CONFERENCE BOTTOM CONTROL BAR */}
      <footer className="p-3.5 bg-slate-900/95 backdrop-blur-md border-t border-brand-border flex flex-wrap justify-between items-center gap-3 shrink-0 z-20">
        {/* Left Side Status */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-brand-border text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold">{participants.length} Active</span>
          </div>

          {raisedHandsCount > 0 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-bounce">
              <Hand className="w-4 h-4 fill-amber-400" />
              <span>{raisedHandsCount} Hand{raisedHandsCount > 1 ? 's' : ''} Raised</span>
            </div>
          )}
        </div>

        {/* Center Media Controls */}
        <div className="flex items-center space-x-2">
          {/* Mute Mic */}
          <button
            onClick={toggleMic}
            className={`p-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-lg ${
              isMicMuted 
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">{isMicMuted ? 'Muted' : 'Mic'}</span>
          </button>

          {/* Toggle Video */}
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-lg ${
              isVideoMuted 
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-purple-400" />}
            <span className="hidden sm:inline">{isVideoMuted ? 'Camera Off' : 'Camera'}</span>
          </button>

          {/* Share Screen */}
          <button
            onClick={toggleScreenShare}
            className={`px-3 sm:px-4 py-3 rounded-xl transition cursor-pointer flex items-center gap-2 text-xs font-bold shadow-lg ${
              isScreenSharing 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Your Screen'}
          >
            <Tv className={`w-4 h-4 ${isScreenSharing ? 'text-white' : 'text-blue-400'}`} />
            <span className="hidden sm:inline">{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
          </button>

          {/* Raise Hand */}
          <button
            onClick={toggleHandRaise}
            className={`px-3 sm:px-4 py-3 rounded-xl transition cursor-pointer flex items-center gap-2 text-xs font-bold shadow-lg ${
              isHandRaised 
                ? 'bg-amber-500 text-slate-950' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Raise Hand"
          >
            <Hand className={`w-4 h-4 ${isHandRaised ? 'fill-slate-950' : 'text-amber-400'}`} />
            <span className="hidden md:inline">{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
          </button>

          {/* Mute All */}
          <button
            onClick={muteAllStudents}
            className="px-3 sm:px-4 py-3 bg-slate-800 hover:bg-red-600/30 text-red-300 hover:text-red-100 rounded-xl text-xs font-bold border border-red-500/30 transition flex items-center gap-1.5 cursor-pointer"
            title="Mute All Microphones"
          >
            <VolumeX className="w-4 h-4" />
            <span className="hidden lg:inline">Mute All</span>
          </button>

          {/* End / Leave Call */}
          <button
            onClick={leaveCall}
            className="px-4 sm:px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black tracking-wide uppercase transition flex items-center gap-2 cursor-pointer shadow-xl shadow-red-600/30"
            title="Leave Call"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>

        {/* Right drawer toggles */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsWhiteboardDrawerOpen(!isWhiteboardDrawerOpen)}
            className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              isWhiteboardDrawerOpen 
                ? 'bg-indigo-600 text-white border-indigo-500' 
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title="Open Live Whiteboard on Right Side"
          >
            <PenTool className="w-4 h-4 text-indigo-300" />
            <span className="hidden sm:inline">Whiteboard</span>
          </button>

          <button
            onClick={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
            className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              isChatDrawerOpen 
                ? 'bg-purple-600 text-white border-purple-500' 
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title="Open Live Chat on Right Side"
          >
            <MessageSquare className="w-4 h-4 text-purple-300" />
            <span className="hidden sm:inline">Chat</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
