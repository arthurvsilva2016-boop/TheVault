const fs = require('fs');
let code = fs.readFileSync('src/components/Preferences.tsx', 'utf8');

const usersTab = `
          {/* TAB 4: Configure Users */}
          {activeMenu === 'users' && isAdmin && (
            <div className="space-y-6 max-w-4xl text-xs animate-fade-in">
              <h3 className="text-base font-bold text-slate-200 flex items-center">
                <Key className="w-5 h-5 mr-2 text-purple-400" />
                Access Control & Accounts
              </h3>
              
              <div className="bg-brand-dark/60 rounded-xl border border-brand-border p-4 space-y-4">
                <p className="text-slate-400">
                  Manage Google Accounts that have attempted to log in. Assign emails to Teachers, Coordinators, or Students.
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4 font-semibold text-[10px]">Google Account</th>
                        <th className="py-3 px-4 font-semibold text-[10px]">Last Access</th>
                        <th className="py-3 px-4 font-semibold text-[10px]">System Status</th>
                        <th className="py-3 px-4 font-semibold text-[10px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/50">
                      {appAccesses && appAccesses.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                            No access attempts recorded yet.
                          </td>
                        </tr>
                      )}
                      {appAccesses && appAccesses.map(acc => {
                        const isAssignedToEmployee = employees?.find(e => e.email?.toLowerCase() === acc.email.toLowerCase());
                        const isAssignedToStudent = students?.find(s => s.email?.toLowerCase() === acc.email.toLowerCase());
                        
                        let statusText = 'Pending';
                        let statusColor = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
                        if (isAssignedToEmployee) {
                          statusText = 'Staff: ' + isAssignedToEmployee.roleTitle;
                          statusColor = 'text-purple-400 bg-purple-400/10 border-purple-400/20';
                        } else if (isAssignedToStudent) {
                          statusText = 'Student: ' + isAssignedToStudent.name;
                          statusColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
                        }

                        return (
                          <tr key={acc.id} className="hover:bg-brand-card/50 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                {acc.photoURL ? (
                                  <img src={acc.photoURL} alt="" className="w-8 h-8 rounded-full object-cover border border-brand-border" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-brand-border">
                                    <User className="w-4 h-4 text-slate-400" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-slate-200">{acc.name}</div>
                                  <div className="text-slate-400 text-[11px]">{acc.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {new Date(acc.lastAccess).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className={\`px-2.5 py-1 rounded-full text-[10px] font-bold border \${statusColor}\`}>
                                {statusText}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button 
                                  onClick={() => {
                                    const role = window.prompt('Assign to new Staff/Teacher? Type "teacher" or "coordinator".');
                                    if (role) {
                                      const newEmp = {
                                        id: 'emp-' + Date.now(),
                                        username: acc.email.split('@')[0],
                                        name: acc.name,
                                        roleTitle: role.toLowerCase() === 'coordinator' ? 'Coordinator' : 'Teacher',
                                        permissions: ['dashboard', 'calendar', 'students', 'groups', 'chat'],
                                        isAssociate: false,
                                        isCoordinator: role.toLowerCase() === 'coordinator',
                                        email: acc.email,
                                        avatarUrl: acc.photoURL
                                      };
                                      setEmployees?.([...(employees || []), newEmp]);
                                      onUpdateAccess?.({ ...acc, status: 'assigned_staff' });
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-brand-dark hover:bg-purple-600/20 text-purple-400 hover:text-purple-300 border border-brand-border hover:border-purple-500/30 rounded-lg transition"
                                >
                                  Assign Staff
                                </button>
                                <button 
                                  onClick={() => {
                                    if (window.confirm('Delete this access log?')) {
                                      onDeleteAccess?.(acc.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}`;

code = code.replace(
  /\{activeMenu === 'notifications' && \([\s\S]*?<\/div>\s*\)\s*\}/,
  (match) => match + '\n' + usersTab
);

fs.writeFileSync('src/components/Preferences.tsx', code);
