const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "onLogout={() => { signOut(auth).then(() => setAuthType('none')); }}",
  "onLogout={() => { console.log('Signing out...'); signOut(auth).then(() => { console.log('Signed out!'); setAuthType('none'); }).catch(e => console.error('Sign out error:', e)); }}"
);

code = code.replace(
  "signOut(auth).then(() => setAuthType('none'));",
  "signOut(auth).then(() => { console.log('Signed out!'); setAuthType('none'); }).catch(e => console.error('Sign out error:', e));"
);

fs.writeFileSync('src/App.tsx', code);
