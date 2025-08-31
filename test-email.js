require('dotenv').config();
const { sendAppointmentConfirmation } = require('./utils/emailService');

// Test email configuration
const testAppointment = {
  name: 'Test User',
  email: 'askarthikeyan30@gmail.com', 
  preferredDate: new Date(),
  preferredTime: '14:30',
  meetingDescription: 'Test Appointment',
  phone: '1234567890',
  countryCode: '+1'
};

console.log('Starting email test...');
console.log('Environment variables:', {
  EMAIL_USER: process.env.EMAIL_USER ? '***' + process.env.EMAIL_USER.slice(-4) : 'Not set',
  EMAIL_PASS: process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) + '***' : 'Not set'
});

sendAppointmentConfirmation(testAppointment)
  .then(result => {
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Meeting Link:', result.meetLink);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed to send test email:');
    console.error(error);
    process.exit(1);
  });
