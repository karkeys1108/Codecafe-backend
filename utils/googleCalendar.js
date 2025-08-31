const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const { v4: uuidv4 } = require('uuid');

// Configure OAuth2 client
const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Set refresh token
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
}

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

const createGoogleMeet = async (appointment) => {
  try {
    const eventStartTime = new Date(appointment.preferredDate);
    const [hours, minutes] = appointment.preferredTime.split(':');
    eventStartTime.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const eventEndTime = new Date(eventStartTime);
    eventEndTime.setHours(eventStartTime.getHours() + 1); // 1-hour meeting by default

    const event = {
      summary: `Meeting with ${appointment.name || 'Client'}`,
      description: appointment.meetingDescription || 'Scheduled appointment',
      start: {
        dateTime: eventStartTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: eventEndTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      conferenceData: {
        createRequest: {
          requestId: uuidv4(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      attendees: [
        { email: appointment.email, displayName: appointment.name },
        { email: 'codecafe49@gmail.com', organizer: true },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
      sendUpdates: 'all',
    });

    return {
      meetLink: response.data.hangoutLink,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    };
  } catch (error) {
    console.error('Error creating Google Meet:', error);
    throw new Error('Failed to create Google Meet: ' + error.message);
  }
};

module.exports = {
  createGoogleMeet
};
