const fs = require('fs');
let text = fs.readFileSync('src/components/Groups.tsx', 'utf8');

text = text.replace(
  "import { createCalendarEventWithMeet } from '../lib/calendarApi';",
  ""
);

const googleMeetLogic = `    let finalMeetLink = 'meet.google.com/new-meet';
    try {
      
      
      let token = await getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        token = authRes?.accessToken || null;
      }
      
      if (token) {
        
        const groupStudentsEmails = students.filter(s => s.group === groupCode.trim() && s.email).map(s => s.email);
        if (teacherEmail) groupStudentsEmails.push(teacherEmail);
        
        const endDateTime = new Date(\`\${computedEndDate}T23:59:59Z\`);
        const untilDateStr = endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        // We set the recurrence rule to repeat weekly until the computedEndDate
        const eventRes = await createCalendarEventWithMeet({
          summary: \`\${computedLevel} \${groupCode.trim()} - English Class\`,
          startTime: \`\${startDate}T\${classTime}:00-03:00\`,
          endTime: \`\${startDate}T\${String(Number(classTime.split(':')[0])+1).padStart(2, '0')}:\${classTime.split(':')[1]}:00-03:00\`,
          attendeeEmails: groupStudentsEmails,
          recurrenceRule: \`RRULE:FREQ=WEEKLY;UNTIL=\${untilDateStr}\`
        });

        if (eventRes && eventRes.meetLink) {
          finalMeetLink = eventRes.meetLink;
        }
      }
    } catch (err) {
      console.error('Google Calendar integration failed:', err);
    }`;

const newGoogleMeetLogic = `    let finalMeetLink = \`https://meet.google.com/new-meet\`;`;

text = text.replace(googleMeetLogic, newGoogleMeetLogic);

fs.writeFileSync('src/components/Groups.tsx', text);
