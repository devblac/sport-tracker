/**
 * Service Registry Pattern
 * Centralized service management and lifecycle control
 */

interface ServiceDefinition {
  name: string;
  factory: () => any;
  dependencies: string[];
  singleton: boolean;
  initialized: boolean;
  instance?: any;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  dependencies: string[];
}

export class ServiceRegistry {
  private services = new Map<string, ServiceDefinition>();
  private instances = new Map<string, any>();
  private initializationOrder: string[] = [];

  /**
   * Register a service with its dependencies
   */
  register(
    name: string,
    factory: () => any,
    options: {
      dependencies?: string[];
      singleton?: boolean;
    } = {}
  ): void {
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }

    this.services.set(name, {
      name,
      factory,
      dependencies: options.dependencies || [],
      singleton: options.singleton ?? true,
      initialized: false
    });
  }

  /**
   * Get service instance with dependency resolution
   */
  async get<T>(name: string): Promise<T> {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} is not registered`);
    }

    // Return existing instance for singletons
    if (service.singleton && service.instance) {
      return service.instance;
    }

    // Initialize dependencies first
    await this.initializeDependencies(service);

    // Create instance
    const instance = await service.factory();
    
    if (service.singleton) {
      service.instance = instance;
      service.initialized = true;
    }

    return instance;
  }

  /**
   * Initialize all services in dependency order
   */
  async initializeAll(): Promise<void> {
    const order = this.calculateInitializationOrder();
    
    for (const serviceName of order) {
      await this.get(serviceName);
    }
  }

  /**
   * Shutdown all services in reverse order
   */
  async shutdownAll(): Promise<void> {
    const order = [...this.initializationOrder].reverse();
    
    for (const serviceName of order) {
      const instance = this.instances.get(serviceName);
      if (instance && typeof instance.shutdown === 'function') {
        try {
          await instance.shutdown();
        } catch (error) {
          console.error(`Failed to shutdown service ${serviceName}:`, error);
        }
      }
    }

    this.instances.clear();
    this.services.forEach(service => {
      service.initialized = false;
      service.instance = undefined;
    });
  }

  /**
   * Get health status of all services
   */
  async getHealthStatus(): Promise<ServiceHealth[]> {
    const healthChecks: ServiceHealth[] = [];

    for (const [name, service] of this.services) {
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      try {
        const instance = service.instance;
        if (instance && typeof instance.healthCheck === 'function') {
          const isHealthy = await instance.healthCheck();
          status = isHealthy ? 'healthy' : 'degraded';
        } else if (!service.initialized) {
          status = 'unhealthy';
        }
      } catch (error) {
        status = 'unhealthy';
      }

      healthChecks.push({
        name,
        status,
        lastCheck: new Date(),
        dependencies: service.dependencies
      });
    }

    return healthChecks;
  }

  /**
   * Check if service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Get list of registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get service dependency graph
   */
  getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    
    for (const [name, service] of this.services) {
      graph[name] = service.dependencies;
    }

    return graph;
  }

  private async initializeDependencies(service: ServiceDefinition): Promise<void> {
    for (const depName of service.dependencies) {
      await this.get(depName);
    }
  }

  private calculateInitializationOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (serviceName: string) => {
      if (visited.has(serviceName)) return;
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected involving ${serviceName}`);
      }

      visiting.add(serviceName);

      const service = this.services.get(serviceName);
      if (service) {
        for (const dep of service.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(serviceName);
      visited.add(serviceName);
      order.push(serviceName);
    };

    for (const serviceName of this.services.keys()) {
      visit(serviceName);
    }

    this.initializationOrder = order;
    return order;
  }
}

// Global service registry instance
export const serviceRegistry = new ServiceRegistry();