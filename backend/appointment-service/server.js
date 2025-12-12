// ============================================
// FILE: backend/appointment-service/server.js
// ============================================

require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;

// MongoDB connection
let db;
let appointmentsCollection;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db('healthcare');
    appointmentsCollection = db.collection('appointments');
    
    // Create indexes for better query performance
    await appointmentsCollection.createIndex({ patientId: 1 });
    await appointmentsCollection.createIndex({ doctorId: 1 });
    await appointmentsCollection.createIndex({ status: 1 });
    
    console.log('✅ Appointment Service: Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(cookieParser());

// Auth middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Event emitter function
const emitEvent = async (eventType, data) => {
  try {
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
    await axios.post(`${notificationServiceUrl}/api/events`, {
      eventType,
      data,
      timestamp: new Date().toISOString()
    }, { timeout: 5000 });
    console.log(`✅ Event emitted: ${eventType}`);
  } catch (error) {
    console.error(`❌ Error emitting event ${eventType}:`, error.message);
  }
};

// Routes

// Create appointment (Patient only)
app.post('/api/appointments', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can create appointments' });
    }
    
    const { doctorId, doctorName, appointmentDate, appointmentTime, reason } = req.body;
    
    if (!doctorId || !appointmentDate || !appointmentTime || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get patient name from auth service
    let patientName = 'Patient';
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
      const token = req.cookies.token;
      const userResponse = await axios.get(`${authServiceUrl}/api/auth/me`, {
        headers: { Cookie: `token=${token}` },
        timeout: 5000
      });
      patientName = userResponse.data.user.fullName;
    } catch (error) {
      console.error('Error fetching patient info:', error.message);
    }
    
    const newAppointment = {
      patientId: req.user.userId,
      doctorId,
      patientName,
      doctorName,
      appointmentDate,
      appointmentTime,
      reason,
      status: 'pending',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await appointmentsCollection.insertOne(newAppointment);
    
    const appointment = {
      id: result.insertedId.toString(),
      ...newAppointment
    };
    
    // Emit event asynchronously
    setImmediate(() => {
      emitEvent('appointment.created', {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        reason: appointment.reason
      });
    });
    
    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get appointments (filtered by role)
app.get('/api/appointments', verifyToken, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'patient') {
      query.patientId = req.user.userId;
    } else if (req.user.role === 'doctor') {
      query.doctorId = req.user.userId;
    } else {
      return res.status(403).json({ error: 'Invalid role' });
    }
    
    const appointments = await appointmentsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    const formattedAppointments = appointments.map(apt => ({
      id: apt._id.toString(),
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      patientName: apt.patientName,
      doctorName: apt.doctorName,
      appointmentDate: apt.appointmentDate,
      appointmentTime: apt.appointmentTime,
      reason: apt.reason,
      status: apt.status,
      notes: apt.notes,
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt
    }));
    
    res.json({ appointments: formattedAppointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single appointment
app.get('/api/appointments/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }
    
    const appointment = await appointmentsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check authorization
    if (req.user.role === 'patient' && appointment.patientId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (req.user.role === 'doctor' && appointment.doctorId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json({ 
      appointment: {
        id: appointment._id.toString(),
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        reason: appointment.reason,
        status: appointment.status,
        notes: appointment.notes,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      }
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update appointment status (Doctor only)
app.patch('/api/appointments/:id/status', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can update appointment status' });
    }
    
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }
    
    if (!status || !['approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Check if appointment belongs to this doctor
    const appointment = await appointmentsCollection.findOne({ 
      _id: new ObjectId(id),
      doctorId: req.user.userId
    });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or unauthorized' });
    }
    
    // const result = await appointmentsCollection.findOneAndUpdate(
    //   { _id: new ObjectId(id) },
    //   { 
    //     $set: { 
    //       status, 
    //       notes: notes || appointment.notes,
    //       updatedAt: new Date() 
    //     } 
    //   },
    //   { returnDocument: 'after' }
    // );
    
    // const updatedAppointment = result.value;
    
    // // Emit event based on status
    // let eventType;
    // if (status === 'approved') eventType = 'appointment.approved';
    // else if (status === 'rejected') eventType = 'appointment.rejected';
    // else if (status === 'completed') eventType = 'appointment.completed';
    
    // setImmediate(() => {
    //   emitEvent(eventType, {
    //     appointmentId: updatedAppointment._id.toString(),
    //     patientId: updatedAppointment.patientId,
    //     patientName: updatedAppointment.patientName,
    //     doctorId: updatedAppointment.doctorId,
    //     doctorName: updatedAppointment.doctorName,
    //     status: updatedAppointment.status,
    //     notes: updatedAppointment.notes
    //   });
    // });

        const result = await appointmentsCollection.findOneAndUpdate(
      { _id: new ObjectId(id), doctorId: req.user.userId },
      { 
        $set: { 
          status, 
          notes: notes || appointment.notes,
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );

    const updatedAppointment = result.value;

    if (!updatedAppointment) {
      return res.status(404).json({ error: 'Appointment not found or unauthorized' });
    }

    setImmediate(() => {
      emitEvent(eventType, {
        appointmentId: updatedAppointment._id.toString(),
        patientId: updatedAppointment.patientId,
        patientName: updatedAppointment.patientName,
        doctorId: updatedAppointment.doctorId,
        doctorName: updatedAppointment.doctorName,
        status: updatedAppointment.status,
        notes: updatedAppointment.notes
      });
    });

    
    res.json({
      message: 'Appointment status updated',
      appointment: {
        id: updatedAppointment._id.toString(),
        patientId: updatedAppointment.patientId,
        doctorId: updatedAppointment.doctorId,
        patientName: updatedAppointment.patientName,
        doctorName: updatedAppointment.doctorName,
        appointmentDate: updatedAppointment.appointmentDate,
        appointmentTime: updatedAppointment.appointmentTime,
        reason: updatedAppointment.reason,
        status: updatedAppointment.status,
        notes: updatedAppointment.notes,
        createdAt: updatedAppointment.createdAt,
        updatedAt: updatedAppointment.updatedAt
      }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel appointment (Patient only)
app.patch('/api/appointments/:id/cancel', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can cancel appointments' });
    }
    
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }
    
    const result = await appointmentsCollection.findOneAndUpdate(
      { 
        _id: new ObjectId(id),
        patientId: req.user.userId,
        status: 'pending'
      },
      { 
        $set: { 
          status: 'cancelled',
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'Appointment not found or cannot be cancelled' });
    }
    
    const appointment = result.value;
    
    // Emit event
    setImmediate(() => {
      emitEvent('appointment.cancelled', {
        appointmentId: appointment._id.toString(),
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName
      });
    });
    
    res.json({
      message: 'Appointment cancelled',
      appointment: {
        id: appointment._id.toString(),
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        reason: appointment.reason,
        status: appointment.status,
        notes: appointment.notes,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      }
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Appointment Service',
    timestamp: new Date().toISOString(),
    mongodb: db ? 'Connected' : 'Disconnected'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Appointment Service running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});


