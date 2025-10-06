import { config } from 'dotenv';
import { join } from 'path';

export default async function globalSetup() {
  console.log('🚀 Setting up comprehensive test environment...');
  
  // Load test environment variables
  const envPath = join(__dirname, '..', '.env.test');
  config({ path: envPath });
  
  // Set test-specific environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce logging noise during tests
  
  // Test database setup (if needed)
  if (!process.env.TEST_DATABASE_URL) {
    process.env.TEST_DATABASE_URL = 'sqlite::memory:'; // In-memory SQLite for tests
  }
  
  // Test Supabase configuration (for integration tests)
  if (!process.env.TEST_SUPABASE_URL) {
    process.env.TEST_SUPABASE_URL = 'https://test-project.supabase.co';
  }
  
  if (!process.env.TEST_SUPABASE_ANON_KEY) {
    process.env.TEST_SUPABASE_ANON_KEY = 'test-anon-key';
  }
  
  if (!process.env.TEST_SUPABASE_SERVICE_KEY) {
    process.env.TEST_SUPABASE_SERVICE_KEY = 'test-service-key';
  }
  
  // Feature flag test configuration
  process.env.FEATURE_FLAGS_ENABLED = 'true';
  process.env.FEATURE_RESOURCE_INITIALIZATION = 'true';
  
  // Test server configuration
  process.env.TEST_SERVER_PORT = '0'; // Use random available port
  process.env.TEST_SERVER_HOST = 'localhost';
  
  // Security test configuration
  process.env.SECURITY_TESTS_ENABLED = 'true';
  process.env.TEST_CORRELATION_ID_PREFIX = 'test-correlation';
  
  // Performance test configuration
  process.env.PERFORMANCE_TESTS_ENABLED = 'true';
  process.env.PERFORMANCE_TEST_SLA = '5000'; // 5 seconds
  process.env.PERFORMANCE_TEST_CONCURRENT_LIMIT = '10';
  
  // Mock external services for testing
  process.env.MOCK_EXTERNAL_SERVICES = 'true';
  
  console.log('✅ Global test setup completed');
}