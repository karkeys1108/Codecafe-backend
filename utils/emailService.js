const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Create Nodemailer transporter with basic auth
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration is missing. Please check your .env file');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendAppointmentConfirmation = async (appointment) => {
  console.log('Preparing to send email...');
  
  try {
    if (!appointment.email) throw new Error('Recipient email is required');
    if (!process.env.EMAIL_USER) throw new Error('EMAIL_USER is not set');
    if (!process.env.EMAIL_PASS) throw new Error('EMAIL_PASS is not set');

    // Format date
    const appointmentDate = new Date(appointment.preferredDate);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const timeString = appointment.preferredTime || 'your scheduled time';
    
    // Read the logo file
    const logoPath = path.join(__dirname, '../Codecafe.png');
    const logoCid = 'codecafe-logo';
    
    const mailOptions = {
      from: `"Code Cafe" <${process.env.EMAIL_USER}>`,
      to: appointment.email,
      subject: `Your Appointment is Confirmed - ${formattedDate} at ${timeString}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
          <!-- Header with Logo -->
          <div style="background-color: #eeeeee; padding: 25px 0; text-align: center; border-radius: 8px 8px 0 0;">
            <img src="cid:${logoCid}" alt="Code Cafe Logo" style="max-width: 180px; height: auto; display: block; margin: 0 auto;">
            <h1 style="color: #ffffff; margin: 15px 0 0; font-size: 28px; font-weight: 600;">Appointment Confirmed!</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 30px; background: #ffffff; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 20px; font-size: 16px;">Hello <strong>${appointment.name || 'there'}</strong>,</p>
            
            <div style="background: #f8f9ff; border-left: 4px solid #4a6baf; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
              <p style="margin: 0 0 10px; font-size: 17px; color: #2c3e50;">
                Your appointment has been successfully scheduled for:
              </p>
              <p style="margin: 10px 0; font-size: 18px;">
                📅 <strong>${formattedDate}</strong><br>
                ⏰ <strong>${timeString}</strong>
              </p>
            </div>

            <div style="background: #fff8e6; border: 1px solid #ffeb99; padding: 15px; border-radius: 4px; margin: 25px 0;">
              <p style="margin: 0; color: #856404; font-size: 15px;">
                <strong>Note:</strong> We'll send you the meeting link shortly before your scheduled time. 
                Please check your email a few minutes before the appointment.
              </p>
            </div>

            <p style="margin: 25px 0 20px; font-size: 15px; line-height: 1.6;">
              We're excited to connect with you! In the meantime, feel free to prepare any questions you might have about your project.
            </p>

            <div style="margin: 30px 0 20px; padding: 20px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
              <p style="margin: 0 0 15px; font-weight: 600; color: #2c3e50;">Need to reschedule?</p>
              <p style="margin: 0 0 15px; font-size: 14px;">
                If you need to reschedule or have any questions, please reply to this email or contact us at 
                <a href="mailto:${process.env.EMAIL_USER}" style="color: #4a6baf; text-decoration: none;">${process.env.EMAIL_USER}</a>.
              </p>
            </div>

            <p style="margin: 25px 0 0; font-size: 15px; color: #666;">
              Best regards,<br>
              <strong>The Code Cafe Team</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; color: #7f8c8d; font-size: 13px; line-height: 1.5;">
            <p style="margin: 0;">
              This is an automated message. Please do not reply directly to this email.<br>
              &copy; ${new Date().getFullYear()} Code Cafe. All rights reserved.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'Codecafe.png',
          path: logoPath,
          cid: logoCid // Same cid value as in the img src
        }
      ]
    };

    console.log('Sending email to:', appointment.email);
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }
};

module.exports = {
  sendAppointmentConfirmation
};
