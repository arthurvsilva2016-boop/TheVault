with open("src/components/GroupProfile.tsx", "r") as f:
    content = f.read()

import re

target = """                              let avgOutput = '-';
                              if (grade && (grade.speaking !== "" || grade.listening !== "" || grade.homework !== "")) {
                                avgOutput = "N/A";
                              }"""

replacement = """                              let avgOutput = '-';
                              if (grade && (grade.speaking !== "" || grade.listening !== "" || grade.homework !== "")) {
                                const mapLetterToValue = (l: string) => {
                                  switch (l.toUpperCase()) {
                                    case 'A+': return 4.3; case 'A': return 4.0; case 'A-': return 3.7;
                                    case 'B+': return 3.3; case 'B': return 3.0; case 'B-': return 2.7;
                                    case 'C+': return 2.3; case 'C': return 2.0; case 'C-': return 1.7;
                                    case 'D+': return 1.3; case 'D': return 1.0; case 'F': return 0.0;
                                    default: return null;
                                  }
                                };
                                const mapValueToLetter = (v: number) => {
                                  if (v >= 4.15) return 'A+'; if (v >= 3.85) return 'A'; if (v >= 3.5) return 'A-';
                                  if (v >= 3.15) return 'B+'; if (v >= 2.85) return 'B'; if (v >= 2.5) return 'B-';
                                  if (v >= 2.15) return 'C+'; if (v >= 1.85) return 'C'; if (v >= 1.5) return 'C-';
                                  if (v >= 1.15) return 'D+'; if (v >= 0.85) return 'D'; return 'F';
                                };
                                const vals = [grade.speaking, grade.listening, grade.homework].map(mapLetterToValue).filter(v => v !== null) as number[];
                                if (vals.length > 0) {
                                  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                                  avgOutput = mapValueToLetter(avg);
                                }
                              }"""

content = content.replace(target, replacement)
with open("src/components/GroupProfile.tsx", "w") as f:
    f.write(content)
