const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/balance')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define the Drink schema
const drinkSchema = new mongoose.Schema({
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

// Create the Drink model
const Drink = mongoose.model('Drink', drinkSchema);

// Create a test drink
const testDrink = new Drink({
  category: 'beer',
  type: 'lager',
  brand: 'Heineken',
  alcoholContent: 5,
  quantity: 2,
  price: 6.99,
  location: 'Test Location',
  notes: 'Test drink for database verification',
  timestamp: new Date(),
  userId: 'test-user-123'
});

// Save the test drink
testDrink.save()
  .then(savedDrink => {
    console.log('Test drink saved successfully:', savedDrink);
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error saving test drink:', err);
    mongoose.connection.close();
  }); 