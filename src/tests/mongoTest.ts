import mongoose from 'mongoose';
import { Budget } from '../models/Budget';
import { MONGODB_URI } from '../config/mongodb.config';

async function testMongoConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB!');

    // Test creating a budget
    const testBudget = new Budget({
      userId: 'test-user-123',
      dailyBudget: 50,
      weeklyBudget: 350,
      monthlyBudget: 1500,
      expenses: [{
        amount: 10,
        category: 'Test',
        date: new Date().toISOString(),
        notes: 'Test expense'
      }]
    });

    console.log('Saving test budget...');
    await testBudget.save();
    console.log('Test budget saved successfully!');

    // Test retrieving the budget
    console.log('Retrieving test budget...');
    const retrievedBudget = await Budget.findOne({ userId: 'test-user-123' });
    console.log('Retrieved budget:', JSON.stringify(retrievedBudget, null, 2));

    // Clean up test data
    console.log('Cleaning up test data...');
    await Budget.deleteOne({ userId: 'test-user-123' });
    console.log('Test data cleaned up successfully!');

  } catch (error) {
    console.error('Error during MongoDB test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testMongoConnection(); 