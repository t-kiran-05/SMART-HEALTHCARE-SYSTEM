require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3001;

let db, usersCollection;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db('healthcare');
    usersCollection = db.collection('users');
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    console.log('✅ Auth Service: Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

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

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role, fullName, phone, specialization } = req.body;
    
    if (!email || !password || !role || !fullName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    if (role === 'doctor' && !specialization) {
      return res.status(400).json({ error: 'Specialization required for doctors' });
    }
    
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      fullName,
      phone: phone || null,
      specialization: role === 'doctor' ? specialization : null,
      createdAt: new Date()
    };
    
    const result = await usersCollection.insertOne(newUser);
    
    const user = {
      id: result.insertedId.toString(),
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.fullName
    };
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.status(201).json({ message: 'Registration successful', user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        specialization: user.specialization
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phone: user.phone,
        specialization: user.specialization
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/doctors', verifyToken, async (req, res) => {
  try {
    const doctors = await usersCollection.find(
      { role: 'doctor' },
      { projection: { password: 0 } }
    ).toArray();
    
    const formattedDoctors = doctors.map(doc => ({
      id: doc._id.toString(),
      fullName: doc.fullName,
      specialization: doc.specialization,
      email: doc.email
    }));
    
    res.json({ doctors: formattedDoctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Auth Service',
    mongodb: db ? 'Connected' : 'Disconnected'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
});