import { useState, useEffect } from 'react';
import { Sparkles, UserCog } from 'lucide-react';
import { Employee, Student, AppAccess } from '../types';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';

interface LoginProps {
  onLoginStaff: (employeeId: string) => void;
  onLoginStudent: (studentId: string) => void;
  employees: Employee[];
  students: Student[];
  appAccesses: AppAccess[];
  onUpdateAccess: (access: AppAccess) => void;
}

export default function Login({ 
  onLoginStaff, 
  onLoginStudent, 
  employees, 
  students,
  appAccesses,
  onUpdateAccess
}: LoginProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        checkUserAccess(user);
      } else {
        setLoading(false);
      }
    });
    return unsub;
  }, [employees, students]); // Re-run if employees/students change while logged in

  const checkUserAccess = (user: User) => {
    if (!user.email) return;
    const email = user.email.toLowerCase().trim();
    
    // Check if staff
    let staff = employees.find(e => e.email?.toLowerCase().trim() === email);
    
    // Emergency override for platform owner
    if (!staff && email === 'arthurvsilva2016@gmail.com') {
      staff = employees.find(e => e.isMaster);
    }
    if (staff) {
       onLoginStaff(staff.id);
       return;
    }
    
    // Check if student
    const student = students.find(s => s.email?.toLowerCase().trim() === email);
    if (student) {
       onLoginStudent(student.id);
       return;
    }
    
    // If we are here, email is not assigned
    const accessRec = appAccesses.find(a => a.email.toLowerCase().trim() === email);
    if (accessRec) {
      onUpdateAccess({
        ...accessRec,
        lastAccess: new Date().toISOString(),
        photoURL: user.photoURL || accessRec.photoURL,
        name: user.displayName || accessRec.name,
      });
    } else {
      onUpdateAccess({
        id: 'access-' + Date.now(),
        email: email,
        name: user.displayName || 'Unknown',
        photoURL: user.photoURL || undefined,
        lastAccess: new Date().toISOString(),
        status: 'pending'
      });
    }
    setPendingUser(user);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user && result.user.email) {
         checkUserAccess(result.user);
      } else {
         setLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center p-6">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">Authenticating...</p>
      </div>
    );
  }

  if (pendingUser) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center p-6 text-slate-200">
        <div className="w-full max-w-md bg-brand-card/95 backdrop-blur-md rounded-2xl border border-brand-border p-8 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center overflow-hidden mb-4 border border-brand-border">
            {pendingUser.photoURL ? (
              <img src={pendingUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserCog className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-100">{pendingUser.displayName}</h2>
          <p className="text-sm text-slate-400 mb-6">{pendingUser.email}</p>
          
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
            <h3 className="text-amber-400 font-bold mb-1">Access Pending</h3>
            <p className="text-amber-200/70 text-xs leading-relaxed">
              Your Google account is not currently linked to any Vault user. Please contact the coordinator to grant you access.
            </p>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              signOut(auth).then(() => {
                setPendingUser(null);
                setError('');
                setLoading(false);
              });
            }}
            className="w-full bg-brand-dark hover:bg-brand-dark/80 text-slate-200 border border-brand-border font-bold py-2.5 px-4 rounded-xl transition mb-4"
          >
            Sign out and try another account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center p-6 text-slate-200">
      <div className="w-full max-w-md bg-brand-card/95 backdrop-blur-md rounded-2xl border border-brand-border p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-700 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-wider uppercase bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 bg-clip-text text-transparent">
            Vault
          </h1>
          <p className="text-slate-400 mt-2 font-medium tracking-wide">Language System</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-slate-100 text-slate-800 font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center space-x-3 transition border border-slate-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Sign In with Google</span>
          </button>
          {error && (
            <div className="text-red-400 text-sm font-medium text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
