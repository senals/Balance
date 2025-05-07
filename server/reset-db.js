const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define schemas
const DrinkSchema = new Schema({
  category: String,
  type: String,
  brand: String,
  alcoholContent: Number,
  quantity: Number,
  price: Number,
  location: String,
  notes: String,
  timestamp: Date,
  userId: String
}, { timestamps: true });

const UserSchema = new Schema({
  id: String,
  username: String,
  email: String,
  password: String,
  profile: {
    age: Number,
    weight: Number,
    height: Number,
    gender: String,
    medicalConditions: [String],
    medications: [String]
  },
  settings: {
    notificationsEnabled: Boolean,
    darkModeEnabled: Boolean,
    privacyModeEnabled: Boolean,
    dailyLimit: Number
  },
  statistics: {
    totalDrinks: Number,
    totalSpent: Number,
    averageDrinksPerWeek: Number,
    lastAssessmentScore: Number
  }
}, { timestamps: true });

const DrinkHistorySchema = new Schema({
  userId: String,
  drinkName: String,
  drinkType: String,
  amount: Number,
  price: Number,
  date: Date,
  location: String,
  notes: String
}, { timestamps: true });

const ReadinessAssessmentSchema = new Schema({
  userId: String,
  date: Date,
  score: Number,
  answers: [{
    questionId: String,
    answer: String,
    score: Number
  }],
  feedback: String,
  recommendations: [String]
}, { timestamps: true });

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/balance')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create models
const Drink = mongoose.model('Drink', DrinkSchema);
const User = mongoose.model('User', UserSchema);
const DrinkHistory = mongoose.model('DrinkHistory', DrinkHistorySchema);
const ReadinessAssessment = mongoose.model('ReadinessAssessment', ReadinessAssessmentSchema);

// Reset function
async function resetDatabase() {
  try {
    // Delete all data from each collection
    await Promise.all([
      Drink.deleteMany({}),
      User.deleteMany({}),
      DrinkHistory.deleteMany({}),
      ReadinessAssessment.deleteMany({})
    ]);
    
    console.log('Database reset successful!');
    console.log('All collections have been cleared.');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
}

// Run the reset
resetDatabase(); 