import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/balance';
    console.log('Attempting to connect to MongoDB at:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('\nTo fix this error:');
    console.log('1. Make sure MongoDB is installed on your system');
    console.log('2. Ensure MongoDB service is running');
    console.log('3. Check if the MongoDB URI is correct in your .env file');
    console.log('\nYou can still start the server without MongoDB for development, but database operations will fail.');
  }
};

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome to Balance API',
    status: 'Server is running',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`API available at http://localhost:${port}`);
      console.log(`MongoDB Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startServer(); 