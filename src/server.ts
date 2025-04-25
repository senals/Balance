import express from 'express';
import mongoose from 'mongoose';
import { getConnectionString, options } from './config/mongodb.config';
import { declareHandler } from './middleware/declareHandler';
import bookRoutes from './routes/book.routes';

const app = express();
app.use(express.json());

// Connect to MongoDB
const connectToMongoDB = async () => {
  try {
    const connectionString = getConnectionString();
    await mongoose.connect(connectionString, options);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // You might want to exit the process on connection failure
    // process.exit(1);
  }
};

// Initialize MongoDB connection
connectToMongoDB();

// Middleware
app.use(declareHandler);

// Routes
app.use('/books', bookRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 