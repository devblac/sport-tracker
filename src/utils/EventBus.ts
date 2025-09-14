// ============================================================================
// EVENT BUS
// ============================================================================
// Type-safe event bus for decoupled communication
// ============================================================================

type EventMap = {
  'workout:started': { workoutId: string; userId: string };
  'workout:completed': { workoutId: string; xpEarned: number; achievements: string[] };
  'workout:paused': { workoutId: string };
  'workout:resumed': { workoutId: string };
  'streak:updated': { userId: string; currentStreak: number; isAtRisk: boolean };
  'achievement:unlocked': { userId: string; achievementId: string; xpEarned: number };
  'sync:status': { isOnline: boolean; pendingItems: number };
  'backup:completed': { userId: string; backupSize: number };
};

type EventCallback<T> = (data: T) => void;

class EventBus {
  private static instance: EventBus;
  private listeners: Map<keyof EventMap, Set<EventCallback<any>>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<K extends keyof EventMap>(
    event: K,
    callback: EventCallback<EventMap[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  public off<K extends keyof EventMap>(
    event: K,
    callback: EventCallback<EventMap[K]>
  ): void {
    this.listeners.get(event)?.delete(callback);
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = EventBus.getInstance();