/**
 * Example usage of Circuit Breaker and Health Check services
 * This demonstrates how to use the services for database and external API calls
 */

import { getServiceMonitoring, initializeServiceMonitoring } from '../ServiceMonitoringIntegration';
import { ServiceNames } from '../CircuitBreakerService';
// Removed unused import

/**
 * Example: Database service with circuit breaker protection
 */
export class DatabaseServiceExample {
  private monitoring = getServiceMonitoring();

  async initialize() {
    await initializeServiceMonitoring();
    
    // Register custom database health check
    this.monitoring.registerService(
      'custom-database',
      async () => {
        // Simulate database health check
        try {
          // This would be a real database query
          await this.testDatabaseConnection();
          return true;
        } catch {
          return false;
        }
      },
      {
        failureThreshold: 3,
        recoveryTimeout: 30000, // 30 seconds
        fallbackEnabled: true,
      },
      async (error: Error) => {
        console.warn('Database fallback activated:', error.message);
        // Return cached data or offline mode indicator
        return { offline: true, cached: true };
      }
    );
  }

  /**
   * Execute database query with circuit breaker protection
   */
  async executeQuery<T>(query: () => Promise<T>): Promise<T> {
    return this.monitoring.executeWithProtection('custom-database', query);
  }

  /**
   * Get user data with fallback to cache
   */
  async getUserData(userId: string): Promise<any> {
    return this.executeQuery(async () => {
      // Simulate database query
      if (Math.random() < 0.1) { // 10% failure rate for demo
        throw new Error('Database connection failed');
      }
      
      return {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        lastLogin: new Date(),
      };
    });
  }

  /**
   * Save workout data with circuit breaker protection
   */
  async saveWorkout(workoutData: any): Promise<any> {
    return this.executeQuery(async () => {
      // Simulate save operation
      if (Math.random() < 0.05) { // 5% failure rate for demo
        throw new Error('Failed to save workout');
      }
      
      return {
        id: Math.random().toString(36),
        ...workoutData,
        savedAt: new Date(),
      };
    });
  }

  private async testDatabaseConnection(): Promise<void> {
    // Simulate database connection test
    if (Math.random() < 0.02) { // 2% failure rate for health checks
      throw new Error('Database health check failed');
    }
  }
}

/**
 * Example: External API service with circuit breaker protection
 */
export class ExternalAPIServiceExample {
  private monitoring = getServiceMonitoring();

  async initialize() {
    await initializeServiceMonitoring();
    
    // Register external API service
    this.monitoring.registerService(
      'weather-api',
      async () => {
        // Test external API availability
        try {
          const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=London&appid=demo');
          return response.ok;
        } catch {
          return false;
        }
      },
      {
        failureThreshold: 5, // More tolerant for external APIs
        recoveryTimeout: 120000, // 2 minutes
        fallbackEnabled: true,
      },
      async (error: Error) => {
        console.warn('Weather API fallback activated:', error.message);
        // Return cached weather data or default message
        return {
          weather: 'Weather data temporarily unavailable',
          cached: true,
          error: true,
        };
      }
    );
  }

  /**
   * Get weather data with circuit breaker protection
   */
  async getWeatherData(location: string): Promise<any> {
    return this.monitoring.executeWithProtection('weather-api', async () => {
      // Simulate external API call
      if (Math.random() < 0.15) { // 15% failure rate for demo
        throw new Error('Weather API request failed');
      }
      
      return {
        location,
        temperature: Math.round(Math.random() * 30 + 10), // 10-40°C
        condition: 'Sunny',
        humidity: Math.round(Math.random() * 100),
        timestamp: new Date(),
      };
    });
  }
}

/**
 * Example: Monitoring dashboard data
 */
export class MonitoringDashboardExample {
  private monitoring = getServiceMonitoring();

  async initialize() {
    await initializeServiceMonitoring();
  }

  /**
   * Get system health status for dashboard
   */
  getSystemHealth() {
    return this.monitoring.getSystemStatus();
  }

  /**
   * Get monitoring metrics for dashboard
   */
  getMetrics() {
    return this.monitoring.getMonitoringMetrics();
  }

  /**
   * Get service-specific status
   */
  getServiceStatus(serviceName: string) {
    return this.monitoring.getServiceStatus(serviceName);
  }

  /**
   * Check if critical services are healthy
   */
  areCriticalServicesHealthy(): boolean {
    const criticalServices = [
      ServiceNames.SUPABASE_DATABASE,
      ServiceNames.SUPABASE_AUTH,
    ];

    return criticalServices.every(service => 
      this.monitoring.isServiceHealthy(service)
    );
  }

  /**
   * Get degradation recommendations based on current status
   */
  getDegradationRecommendations(): {
    level: number;
    message: string;
    disabledFeatures: string[];
    actions: string[];
  } {
    const systemStatus = this.getSystemHealth();
    
    if (systemStatus.overall === 'unhealthy') {
      return {
        level: 3,
        message: 'System is experiencing significant issues',
        disabledFeatures: ['social-features', 'real-time-sync', 'advanced-analytics'],
        actions: [
          'Switch to offline mode',
          'Use cached data only',
          'Disable non-essential features',
          'Show user notification about limited functionality',
        ],
      };
    } else if (systemStatus.overall === 'degraded') {
      return {
        level: 2,
        message: 'Some services are experiencing issues',
        disabledFeatures: ['real-time-sync', 'social-features'],
        actions: [
          'Use cached data when possible',
          'Reduce API call frequency',
          'Show warning about potential delays',
        ],
      };
    } else {
      return {
        level: 1,
        message: 'All systems operational',
        disabledFeatures: [],
        actions: ['Continue normal operation'],
      };
    }
  }
}

/**
 * Example usage function
 */
export async function demonstrateCircuitBreaker() {
  console.log('🔧 Initializing Circuit Breaker Demo...');
  
  // Initialize services
  const dbService = new DatabaseServiceExample();
  const apiService = new ExternalAPIServiceExample();
  const dashboard = new MonitoringDashboardExample();
  
  await Promise.all([
    dbService.initialize(),
    apiService.initialize(),
    dashboard.initialize(),
  ]);

  console.log('✅ Services initialized');

  // Simulate some operations
  try {
    console.log('\n📊 Testing database operations...');
    const userData = await dbService.getUserData('user123');
    console.log('User data retrieved:', userData);

    const workoutResult = await dbService.saveWorkout({
      type: 'cardio',
      duration: 30,
      calories: 250,
    });
    console.log('Workout saved:', workoutResult);

    console.log('\n🌤️ Testing external API operations...');
    const weatherData = await apiService.getWeatherData('New York');
    console.log('Weather data:', weatherData);

  } catch (error) {
    console.error('Operation failed:', error);
  }

  // Show monitoring status
  console.log('\n📈 System Status:');
  const systemHealth = dashboard.getSystemHealth();
  console.log('Overall status:', systemHealth.overall);
  console.log('Services:', Object.keys(systemHealth.services));

  const metrics = dashboard.getMetrics();
  console.log('\n📊 Metrics:');
  console.log(`Success rate: ${metrics.successRate.toFixed(1)}%`);
  console.log(`Average response time: ${metrics.averageResponseTime.toFixed(0)}ms`);
  console.log(`Total requests: ${metrics.totalRequests}`);

  // Show degradation recommendations
  const recommendations = dashboard.getDegradationRecommendations();
  console.log('\n💡 Recommendations:');
  console.log(`Level ${recommendations.level}: ${recommendations.message}`);
  if (recommendations.disabledFeatures.length > 0) {
    console.log('Disabled features:', recommendations.disabledFeatures);
  }
  console.log('Actions:', recommendations.actions);

  return {
    systemHealth,
    metrics,
    recommendations,
  };
}

// Classes are already exported above, no need to re-export