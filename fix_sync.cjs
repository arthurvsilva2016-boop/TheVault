const fs = require('fs');
let text = fs.readFileSync('src/hooks/useFirebaseSync.ts', 'utf8');

text = text.replace(
  "export function useFirebaseSync<T>(",
  "export function useFirebaseSync<T>("
);

text = text.replace(
  "]: [T[], (action: T[] | ((prev: T[]) => T[])) => void] {",
  "]: [T[], (action: T[] | ((prev: T[]) => T[])) => void, boolean] {"
);

text = text.replace(
  "return [data, setSyncedData];",
  "return [data, setSyncedData, isLoaded];"
);

fs.writeFileSync('src/hooks/useFirebaseSync.ts', text);
