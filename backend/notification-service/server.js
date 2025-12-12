// notification-service/server.js
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3003;

// MongoDB connection
let db;
let notificationsCollection;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare');
    await client.connect();
    db = client.db();
    notificationsCollection = db.collection('notifications');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
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

// Event handler
const handleEvent = async (eventType, data) => {
  console.log(`Received event: ${eventType}`, data);
  
  let notificationMessage = '';
  let recipientType = '';
  let recipientId = null;
  
  switch (eventType) {
    case 'appointment.created':
      notificationMessage = `New appointment request from ${data.patientName} on ${data.appointmentDate} at ${data.appointmentTime}`;
      recipientType = 'doctor';
      recipientId = data.doctorId;
      break;
      
    case 'appointment.approved':
      notificationMessage = `Your appointment with Dr. ${data.doctorName} has been approved!`;
      recipientType = 'patient';
      recipientId = data.patientId;
      break;
      
    case 'appointment.rejected':
      notificationMessage = `Your appointment with Dr. ${data.doctorName} has been rejected. ${data.notes || ''}`;
      recipientType = 'patient';
      recipientId = data.patientId;
      break;
      
    case 'appointment.completed':
      notificationMessage = `Your appointment with Dr. ${data.doctorName} has been marked as completed.`;
      recipientType = 'patient';
      recipientId = data.patientId;
      break;
      
    case 'appointment.cancelled':
      notificationMessage = `Appointment with ${data.patientName} has been cancelled.`;
      recipientType = 'doctor';
      recipientId = data.doctorId;
      break;
      
    default:
      console.log('Unknown event type:', eventType);
      return;
  }
  
  // Store notification in database
  try {
    const notification = {
      eventType,
      message: notificationMessage,
      recipientType,
      recipientId,
      data,
      read: false,
      createdAt: new Date(),
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    await notificationsCollection.insertOne(notification);
    console.log('Notification stored:', notification);
    
    // In a real application, you would also:
    // - Send email via Nodemailer
    // - Send SMS via Twilio
    // - Send push notification
    // - Trigger WebSocket event for real-time updates
    
  } catch (error) {
    console.error('Error storing notification:', error);
  }
};

// Routes
// Receive events from other services
app.post('/api/events', async (req, res) => {
  try {
    const { eventType, data, timestamp } = req.body;
    
    if (!eventType || !data) {
      return res.status(400).json({ error: 'Invalid event data' });
    }
    
    // Handle event asynchronously
    setImmediate(() => handleEvent(eventType, data));
    
    res.status(200).json({ message: 'Event received' });
  } catch (error) {
    console.error('Event processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notifications for a user (would need auth in production)
app.get('/api/notifications/:userId/:userType', async (req, res) => {
  try {
    const { userId, userType } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    const notifications = await notificationsCollection
      .find({
        recipientId: parseInt(userId),
        recipientType: userType
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .toArray();
    
    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = require('mongodb');
    
    const result = await notificationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { read: true } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread count
app.get('/api/notifications/:userId/:userType/unread-count', async (req, res) => {
  try {
    const { userId, userType } = req.params;
    
    const count = await notificationsCollection.countDocuments({
      recipientId: parseInt(userId),
      recipientType: userType,
      read: false
    });
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete old notifications (cleanup)
app.delete('/api/notifications/cleanup', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await notificationsCollection.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      read: true
    });
    
    res.json({ 
      message: 'Cleanup completed', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Notification Service',
    dbConnected: !!db
  });
});

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});