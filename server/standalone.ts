import dotenv from "dotenv";
import { createApp, connectToDatabase } from './index';

dotenv.config();

async function startStandaloneServer() {
  const PORT = 3001;
  console.log('🚀 Starting Standalone Express Server...');

  try {
    const { app, httpServer } = createApp();

    try {
      const dbConnected = await connectToDatabase();
      console.log(dbConnected ? '✅ Database connected' : '⚠️ Using mock data');
    } catch (error) {
      console.warn('⚠️ Database failed, continuing with mock data');
    }

    httpServer.listen(PORT, () => {
      console.log(`✅ API Server running on port ${PORT}`);
      console.log(`🧪 Test: http://localhost:${PORT}/api/auth/test`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/ping`);
    });

    // Handle server errors
    httpServer.on('error', (error: any) => {
      console.error('❌ Server error:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      }
    });

  } catch (error: any) {
    console.error('❌ Failed to create server:', error.message);
    process.exit(1);
  }
}

startStandaloneServer().catch(console.error);
