import mongoose from 'mongoose';

// MongoDB Atlas connection string
export const MONGODB_URI = 'mongodb+srv://senal:uzYKyyjKj9RQVDfw@cluster0.pehwqtc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Export a function to get the connection string
export const getConnectionString = (): string => {
  if (!MONGODB_URI) {
    throw new Error('MongoDB connection string is not defined');
  }
  return MONGODB_URI;
};

// Export a function to test the connection
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const connection = await mongoose.connect(MONGODB_URI);
    
    if (connection.connection.readyState === 1) {
      console.log('MongoDB connection successful');
      await mongoose.disconnect();
      return true;
    } else {
      console.log('MongoDB connection failed - not ready');
      return false;
    }
  } catch (error) {
    console.error('MongoDB connection failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}; 