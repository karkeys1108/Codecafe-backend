const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { sendAppointmentConfirmation } = require('./utils/emailService');
const Appointment = require('./models/Appointment');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codecafe')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create a new appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const { preferredDate, preferredTime, ...rest } = req.body;
    
    // Validate required fields
    if (!preferredDate || !preferredTime) {
      return res.status(400).json({ 
        message: 'Both preferredDate and preferredTime are required',
        receivedData: req.body
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(preferredTime)) {
      return res.status(400).json({ 
        message: 'Invalid time format. Please use HH:MM format (e.g., 18:30)'
      });
    }
    
    // Combine date and time
    const [hours, minutes] = preferredTime.split(':').map(Number);
    const appointmentDate = new Date(preferredDate);
    
    // Validate date
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ 
        message: 'Invalid date format. Please use YYYY-MM-DD format'
      });
    }

    appointmentDate.setHours(hours, minutes, 0, 0);

    // Create appointment
    const appointment = new Appointment({
      ...rest,
      preferredDate: appointmentDate,
      preferredTime,
      status: 'scheduled',
      createdAt: new Date()
    });

    // Save the appointment
    await appointment.save();
    console.log('Appointment created with ID:', appointment._id);

    // Send confirmation email
    try {
      console.log('Sending confirmation email to:', appointment.email);
      await sendAppointmentConfirmation({
        ...appointment.toObject(),
        preferredDate: appointmentDate,
        preferredTime
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue even if email fails
    }

    // Return the appointment
    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(400).json({ 
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Get all appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ preferredDate: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update appointment status
app.patch('/api/appointments/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get available time slots for a date
app.get('/api/available-slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // Get all appointments for the given date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      preferredDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    }).select('preferredTime');

    // Generate all possible time slots (6:00 PM to 10:00 PM, 30-minute intervals)
    const allSlots = [];
    const startHour = 18; // 6:00 PM
    const endHour = 22;   // 10:00 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      // Add 00 minute slot (e.g., 18:00, 19:00, etc.)
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      
      // Add 30 minute slot (e.g., 18:30, 19:30, etc.)
      allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    // Get booked slots
    const bookedSlots = appointments.map(apt => apt.preferredTime);

    // Filter out booked slots
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({ 
      availableSlots,
      timezone: 'IST (UTC+5:30)'
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ message: 'Error fetching available slots' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
