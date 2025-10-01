/**
 * Service Container for Dependency Injection
 * Replaces singleton pattern with proper DI container
 */

interface ServiceFactory<T> {
  create(): T;
  singleton?: boolean;
}

export class ServiceContainer {
  private services = new Map<string, any>();
  private factories = new Map<string, ServiceFactory<any>>();

  register<T>(name: string, factory: ServiceFactory<T>): void {
    this.factories.set(name, factory);
  }

  get<T>(name: string): T {
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not registered`);
    }

    if (factory.singleton) {
      if (!this.services.has(name)) {
        this.services.set(name, factory.create());
      }
      return this.services.get(name);
    }

    return factory.create();
  }

  clear(): void {
    this.services.clear();
  }
}

export const serviceContainer = new ServiceContainer();