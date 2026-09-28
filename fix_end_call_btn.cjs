const fs = require('fs');
let code = fs.readFileSync('src/components/Chat.tsx', 'utf8');

const targetStr = `onClick={async () => {
                      if (window.confirm("Are you sure you want to force end this call for everyone?")) {
                        try {
                          await deleteDoc(doc(db, 'live_calls', currentCallId));
                        } catch (err) {
                          console.error("Failed to end call", err);
                        }
                      }
                    }}`;

const newStr = `onClick={async () => {
                      try {
                        await deleteDoc(doc(db, 'live_calls', currentCallId));
                      } catch (err) {
                        console.error("Failed to end call", err);
                      }
                    }}`;

if(code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('src/components/Chat.tsx', code);
  console.log("Success replacing confirm");
} else {
  console.log("String not found");
}
