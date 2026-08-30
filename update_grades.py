with open("src/components/GroupProfile.tsx", "r") as f:
    content = f.read()

import re

def create_select(field):
    return f"""<select 
                                      value={{grade?.{field} || ''}}
                                      onChange={{e => handleSessionGrade(session.id, att.studentId, '{field}', e.target.value)}}
                                      className="w-14 bg-brand-card border border-brand-border text-center rounded px-0.5 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-purple-500 uppercase cursor-pointer"
                                    >
                                      <option value="">-</option>
                                      <option value="A+">A+</option>
                                      <option value="A">A</option>
                                      <option value="A-">A-</option>
                                      <option value="B+">B+</option>
                                      <option value="B">B</option>
                                      <option value="B-">B-</option>
                                      <option value="C+">C+</option>
                                      <option value="C">C</option>
                                      <option value="C-">C-</option>
                                      <option value="D+">D+</option>
                                      <option value="D">D</option>
                                      <option value="F">F</option>
                                    </select>"""

for field in ['speaking', 'listening', 'homework']:
    target = f"""<input 
                                      type="text" 
                                      value={{grade?.{field} || ''}}
                                      onChange={{e => handleSessionGrade(session.id, att.studentId, '{field}', e.target.value)}}
                                      placeholder="-"
                                      className="w-12 bg-brand-card border border-brand-border text-center rounded px-1 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-purple-500 uppercase"
                                      maxLength={{2}}
                                    />"""
    content = content.replace(target, create_select(field))

with open("src/components/GroupProfile.tsx", "w") as f:
    f.write(content)
