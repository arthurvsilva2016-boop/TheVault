const fs = require('fs');
let code = fs.readFileSync('src/components/Chat.tsx', 'utf8');

const targetStr = `{ongoingCall ? (
              activeCall?.roomCode === currentCallId ? (
                <button
                  onClick={() => setIsCallMinimized(false)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 rounded-lg flex items-center space-x-1.5 text-xs font-semibold transition cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">In Call</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    joinCall(
                      currentCallId,
                      { id: activeEmployee.id, name: activeEmployee.name, role: activeEmployee.roleTitle, avatarUrl: activeEmployee.avatarUrl },
                      currentCallTitle,
                      'meeting'
                    );
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 rounded-lg flex items-center space-x-1.5 text-xs font-semibold transition cursor-pointer shadow-lg shadow-emerald-900/50 animate-pulse"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Join Ongoing Call ({ongoingCall.participants?.length || 0})</span>
                </button>
              )
            ) : (`;

const newStr = `{ongoingCall ? (
              <div className="flex items-center space-x-2">
                {activeCall?.roomCode === currentCallId ? (
                  <button
                    onClick={() => setIsCallMinimized(false)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 rounded-lg flex items-center space-x-1.5 text-xs font-semibold transition cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">In Call</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      joinCall(
                        currentCallId,
                        { id: activeEmployee.id, name: activeEmployee.name, role: activeEmployee.roleTitle, avatarUrl: activeEmployee.avatarUrl },
                        currentCallTitle,
                        'meeting'
                      );
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 rounded-lg flex items-center space-x-1.5 text-xs font-semibold transition cursor-pointer shadow-lg shadow-emerald-900/50 animate-pulse"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Join Ongoing Call ({ongoingCall.participants?.length || 0})</span>
                  </button>
                )}
                
                {isSuperAdmin(activeEmployee) && (
                  <button
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to force end this call for everyone?")) {
                        try {
                          await deleteDoc(doc(db, 'live_calls', currentCallId));
                        } catch (err) {
                          console.error("Failed to end call", err);
                        }
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 rounded-lg flex items-center space-x-1.5 text-xs font-semibold transition cursor-pointer shadow-lg shadow-rose-900/50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">End Call</span>
                  </button>
                )}
              </div>
            ) : (`;

if(code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('src/components/Chat.tsx', code);
  console.log("Success replacing chat string");
} else {
  console.log("String not found");
}
