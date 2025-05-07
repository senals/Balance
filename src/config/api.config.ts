export const API_CONFIG = {
  // This is your Express server URL, not MongoDB
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  
  // Endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    BUDGET: '/budgets',
    DRINKS: '/drinks',
    USERS: '/users',
    TRANSACTIONS: '/transactions'
  }
};

// Keep MongoDB config separate
export const MONGODB_CONFIG = {
  URI: 'mongodb+srv://senal:uzYKyyjKj9RQVDfw@cluster0.pehwqtc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
}; 