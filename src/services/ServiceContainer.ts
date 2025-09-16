// ============================================================================
// SERVICE CONTAINER
// ============================================================================
// Dependency injection container for services
// ============================================================================

import { WorkoutService } from './WorkoutService';
import { NotificationService } from './NotificationService';
import { SyncService } from './SyncService';
import { WorkoutAutoSaveService } from './WorkoutAutoSaveService';
import { WorkoutRecoveryService } from './WorkoutRecoveryService';

export interface ServiceDependencies {
  workoutService: WorkoutService;
  notificationService: NotificationService;
  syncService: SyncService;
  autoSaveService: WorkoutAutoSaveService;
}

class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  public register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  public get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not registered`);
    }
    return service;
  }

  public initialize(): ServiceDependencies {
    // Initialize services in correct order
    const workoutService = WorkoutService.getInstance();
    const notificationService = NotificationService.getInstance();
    const syncService = new SyncService();
    const autoSaveService = WorkoutAutoSaveService.getInstance();

    this.register('workoutService', workoutService);
    this.register('notificationService', notificationService);
    this.register('syncService', syncService);
    this.register('autoSaveService', autoSaveService);

    return {
      workoutService,
      notificationService,
      syncService,
      autoSaveService
    };
  }
}

export const serviceContainer = ServiceContainer.getInstance();