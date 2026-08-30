const fs = require('fs');
let text = fs.readFileSync('src/hooks/useFirebaseSync.ts', 'utf8');

text = text.replace(
  "setDoc(doc(db, 'app_state', documentName), { list: next }).catch(console.error);",
  "setDoc(doc(db, 'app_state', documentName), { list: JSON.parse(JSON.stringify(next)) }).catch(e => console.error('Firestore save error:', e));"
);

text = text.replace(
  "setDoc(doc(db, 'app_state', documentName), { list: initialData }).catch(console.error);",
  "setDoc(doc(db, 'app_state', documentName), { list: JSON.parse(JSON.stringify(initialData)) }).catch(e => console.error('Firestore init error:', e));"
);

fs.writeFileSync('src/hooks/useFirebaseSync.ts', text);
