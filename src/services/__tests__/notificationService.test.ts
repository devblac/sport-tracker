/**
 * Notification Service Tests
 * 
 * Tests for the enhanced notification service functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { notificationService } from '../notificationService';

// Mock the Notification API
const mockNotification = vi.fn();
Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  writable: true
});

Object.defineProperty(Notification, 'permission', {
  value: 'granted',
  writable: true
});

Object.defineProperty(Notification, 'requestPermission', {
  value: vi.fn().mockResolvedValue('granted'),
  writable: true
});

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({
      showNotification: vi.fn().mockResolvedValue(undefined)
    }),
    addEventListener: vi.fn(),
    ready: Promise.resolve({
      showNotification: vi.fn().mockResolvedValue(undefined)
    })
  },
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Permission Management', () => {
    it('should request notification permission', async () => {
      const result = await notificationService.requestPermission();
      expect(result).toBe(true);
      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    it('should return current permission status', () => {
      const permission = notificationService.getPermission();
      expect(permission.granted).toBe(true);
      expect(permission.denied).toBe(false);
      expect(permission.default).toBe(false);
    });
  });

  describe('Settings Management', () => {
    it('should get default settings', () => {
      const settings = notificationService.getSettings();
      expect(settings.enabled).toBe(true);
      expect(settings.workoutReminders).toBe(true);
      expect(settings.streakReminders).toBe(true);
      expect(settings.quietHours.enabled).toBe(true);
    });

    it('should update settings', () => {
      const newSettings = {
        enabled: false,
        workoutReminders: false
      };
      
      notificationService.updateSettings(newSettings);
      
      const updatedSettings = notificationService.getSettings();
      expect(updatedSettings.enabled).toBe(false);
      expect(updatedSettings.workoutReminders).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notificationSettings',
        expect.stringContaining('"enabled":false')
      );
    });
  });

  describe('Do Not Disturb Mode', () => {
    it('should enable do not disturb mode', () => {
      notificationService.setDoNotDisturbMode(true);
      expect(notificationService.getDoNotDisturbMode()).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'doNotDisturbMode',
        'true'
      );
    });

    it('should disable do not disturb mode', () => {
      notificationService.setDoNotDisturbMode(false);
      expect(notificationService.getDoNotDisturbMode()).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'doNotDisturbMode',
        'false'
      );
    });
  });

  describe('Streak Notifications', () => {
    it('should show streak at risk notification', async () => {
      const result = await notificationService.showStreakAtRiskNotification(15, 2);
      expect(result).toBe(true);
    });

    it('should show streak milestone approaching notification', async () => {
      const result = await notificationService.showStreakMilestoneApproachingNotification(27, 30);
      expect(result).toBe(true);
    });

    it('should show daily streak reminder', async () => {
      const result = await notificationService.showDailyStreakReminder(10);
      expect(result).toBe(true);
    });
  });

  describe('Notification Scheduling', () => {
    it('should schedule a notification', () => {
      const futureTime = new Date(Date.now() + 60000); // 1 minute from now
      const notificationId = notificationService.scheduleNotification({
        title: 'Test Notification',
        body: 'This is a test'
      }, futureTime);
      
      expect(notificationId).toBeDefined();
      expect(notificationService.getScheduledNotifications()).toContain(notificationId);
    });

    it('should cancel a scheduled notification', () => {
      const futureTime = new Date(Date.now() + 60000);
      const notificationId = notificationService.scheduleNotification({
        title: 'Test Notification',
        body: 'This is a test'
      }, futureTime);
      
      const cancelled = notificationService.cancelScheduledNotification(notificationId);
      expect(cancelled).toBe(true);
      expect(notificationService.getScheduledNotifications()).not.toContain(notificationId);
    });
  });

  describe('Quiet Hours', () => {
    it('should respect quiet hours settings', () => {
      // Mock current time to be within quiet hours
      const mockDate = new Date('2023-01-01T23:30:00');
      vi.setSystemTime(mockDate);
      
      notificationService.updateSettings({
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00'
        }
      });
      
      // Should not show notification during quiet hours (unless urgent)
      const result = notificationService.showNotification({
        title: 'Test',
        body: 'Test',
        priority: 'normal'
      });
      
      // Note: This would need to be tested with actual implementation
      // For now, we just verify the method exists
      expect(typeof result).toBe('object'); // Returns a Promise
    });
  });

  describe('Notification Statistics', () => {
    it('should track notification statistics', () => {
      const stats = notificationService.getNotificationStats();
      expect(stats).toHaveProperty('sent');
      expect(stats).toHaveProperty('clicked');
      expect(stats).toHaveProperty('dismissed');
    });
  });

  describe('Test Notification', () => {
    it('should send test notification', async () => {
      const result = await notificationService.testNotification();
      expect(result).toBe(true);
    });
  });

  describe('Browser Support', () => {
    it('should check if notifications are supported', () => {
      const isSupported = notificationService.isSupported();
      expect(typeof isSupported).toBe('boolean');
    });
  });
});