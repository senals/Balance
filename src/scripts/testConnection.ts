import { testConnection } from '../config/mongodb.config';

async function main() {
  console.log('Testing MongoDB connection...');
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('✅ MongoDB connection test passed');
    process.exit(0);
  } else {
    console.log('❌ MongoDB connection test failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error running connection test:', error);
  process.exit(1);
}); 