import { getAccessToken } from './googleAuth';

interface CreateEventParams {
  summary: string;
  description?: string;
  startTime: string; // ISO format
  endTime: string; // ISO format
  attendeeEmails: string[];
  recurrenceRule?: string;
}

export const createCalendarEventWithMeet = async (params: CreateEventParams) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const event = {
    summary: params.summary,
    description: params.description || '',
    start: { dateTime: params.startTime },
    end: { dateTime: params.endTime },
    attendees: params.attendeeEmails.map(email => ({ email })),
    ...(params.recurrenceRule ? { recurrence: [params.recurrenceRule] } : {}),
    conferenceData: {
      createRequest: {
        requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create event:', errorText);
    throw new Error('Failed to create event');
  }

  const data = await response.json();
  return {
    eventId: data.id,
    meetLink: data.hangoutLink
  };
};
