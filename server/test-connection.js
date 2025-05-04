const mongoose = require('mongoose');
const fetch = require('node-fetch');

// Test MongoDB connection
async function testMongoDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/balance');
    console.log('✅ MongoDB connection successful');
    
    // Test if we can query the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name).join(', '));
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Test API endpoints
async function testAPI() {
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:5000/api/health');
    console.log('✅ API health check:', healthResponse.ok ? 'OK' : 'Failed');
    
    // Test drinks endpoint
    const drinksResponse = await fetch('http://localhost:5000/api/drinks');
    console.log('✅ Drinks endpoint:', drinksResponse.ok ? 'OK' : 'Failed');
    
    return true;
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🔍 Testing MongoDB connection...');
  const mongoOk = await testMongoDB();
  
  console.log('\n🔍 Testing API endpoints...');
  const apiOk = await testAPI();
  
  console.log('\n📊 Test Results:');
  console.log(`MongoDB: ${mongoOk ? '✅ Connected' : '❌ Failed'}`);
  console.log(`API: ${apiOk ? '✅ Working' : '❌ Failed'}`);
  
  // Close MongoDB connection
  if (mongoOk) {
    await mongoose.connection.close();
  }
}

runTests(); 