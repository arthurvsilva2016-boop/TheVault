const fs = require('fs');
let code = fs.readFileSync('src/components/calling/VaultCallOverlay.tsx', 'utf8');

const importAdd = `import { Phone, PhoneOff, Video, Sparkles, Tv, MonitorSmartphone, X, MicOff } from 'lucide-react';`;
code = code.replace(/import \{ Phone, PhoneOff, Video, Sparkles, Tv \} from 'lucide-react';/, importAdd);

// Destructure the new actions and activeCall
code = code.replace(
  '    declineIncomingCall\n  } = useLiveCall();',
  '    declineIncomingCall,\n    toggleParticipantAudio,\n    removeParticipant\n  } = useLiveCall();'
);

// We want to calculate the current user's active devices
const renderAdd = `
  const myDevices = activeCall && normalizedUser
    ? activeCall.participants.filter(p => p.userId === normalizedUser.id)
    : [];

  return (
    <>
      {/* DEVICE SESSIONS POPUP */}
      {myDevices.length > 1 && (
        <div className="fixed bottom-24 right-5 z-[60] w-72 bg-slate-900 border border-purple-500/30 rounded-xl shadow-2xl p-4 animate-fadeIn">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
            <MonitorSmartphone className="w-5 h-5 text-purple-400" />
            <h4 className="text-sm font-bold text-white">Your Active Devices</h4>
          </div>
          <div className="space-y-2">
            {myDevices.map(device => (
              <div key={device.id} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200">
                    {device.isLocal ? 'Current Device' : 'Other Device'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{device.id.substring(0, 8)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {!device.isLocal && (
                    <>
                      <button 
                        onClick={() => toggleParticipantAudio(device.id)}
                        className={\`p-1.5 rounded-md transition \${device.isAudioOn ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-red-500/20 text-red-400 border border-red-500/30'}\`}
                        title={device.isAudioOn ? "Mute this device" : "Unmute this device"}
                      >
                        <MicOff className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => removeParticipant(device.id)}
                        className="p-1.5 rounded-md bg-slate-700 hover:bg-red-600 hover:text-white text-slate-300 transition"
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
`;

code = code.replace('  return (\n    <>', renderAdd);
fs.writeFileSync('src/components/calling/VaultCallOverlay.tsx', code);
console.log('Fixed VaultCallOverlay');
