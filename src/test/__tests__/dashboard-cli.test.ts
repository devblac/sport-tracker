/**
 * Dashboard CLI Tests
 * 
 * Tests for the command-line interface of the test metrics dashboard.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DashboardCLI } from '../dashboard-cli';

// Mock process.argv and process.exit
const originalArgv = process.argv;
const originalExit = process.exit;

// Mock console methods
let consoleLogSpy: any;
let consoleErrorSpy: any;
let processExitSpy: any;

describe('DashboardCLI', () => {
  let cli: DashboardCLI;

  beforeEach(() => {
    cli = new DashboardCLI();
    
    // Set up spies for each test
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exit = originalExit;
    
    // Restore all spies
    consoleLogSpy?.mockRestore();
    consoleErrorSpy?.mockRestore();
    processExitSpy?.mockRestore();
    
    vi.clearAllMocks();
  });

  describe('Command Parsing', () => {
    it('should parse status command correctly', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'status'];
      
      await cli.run();
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('📊 Test Quality Dashboard Status')
      );
    });

    it('should parse status command with JSON format', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'status', '--format', 'json'];
      
      await cli.run();
      
      // Should output JSON instead of formatted text
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\{.*\}$/s)
      );
    });

    it('should parse help command', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'help'];
      
      await cli.run();
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Test Metrics Dashboard CLI')
      );
    });

    it('should show help for unknown commands', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'unknown-command'];
      
      await cli.run();
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Unknown command: unknown-command'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Test Metrics Dashboard CLI')
      );
    });
  });

  describe('Status Command', () => {
    it('should display dashboard status in text format', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'status'];
      
      await cli.run();
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('📊 Test Quality Dashboard Status')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Overall Status:')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Reliability:')
      );
    });

    it('should display dashboard status in JSON format', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'status', '--format', 'json'];
      
      await cli.run();
      
      const jsonOutput = mockConsoleLog.mock.calls.find(call => 
        typeof call[0] === 'string' && call[0].startsWith('{')
      );
      
      expect(jsonOutput).toBeDefined();
      
      if (jsonOutput) {
        const parsedOutput = JSON.parse(jsonOutput[0]);
        expect(parsedOutput).toHaveProperty('status');
        expect(parsedOutput).toHaveProperty('reliability');
        expect(parsedOutput).toHaveProperty('coverage');
        expect(parsedOutput).toHaveProperty('activeAlerts');
      }
    });
  });

  describe('Report Command', () => {
    it('should generate comprehensive report', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'report'];
      
      await cli.run();
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Generating test quality report...'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('# Test Quality Dashboard Report')
      );
    });
  });

  describe('Alerts Command', () => {
    it('should display active alerts', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'alerts'];
      
      await cli.run();
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🚨 Active Test Quality Alerts')
      );
    });

    it('should display no alerts message when none exist', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'alerts'];
      
      await cli.run();
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('✅ No active alerts - all systems healthy!')
      );
    });
  });

  describe('Trends Command', () => {
    it('should display trend analysis', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'trends'];
      
      await cli.run();
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('📈 Test Quality Trends')
      );
    });

    it('should display trends for custom number of days', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'trends', '--days', '14'];
      
      await cli.run();
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('📈 Test Quality Trends (Last 14 days)')
      );
    });
  });

  describe('Export Command', () => {
    it('should export data in JSON format', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'export'];
      
      await cli.run();
      
      const jsonOutput = mockConsoleLog.mock.calls.find(call => 
        typeof call[0] === 'string' && call[0].startsWith('{')
      );
      
      expect(jsonOutput).toBeDefined();
    });

    it('should export data in Prometheus format', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'export', '--format', 'prometheus'];
      
      await cli.run();
      
      const prometheusOutput = mockConsoleLog.mock.calls.find(call => 
        typeof call[0] === 'string' && call[0].includes('# HELP')
      );
      
      expect(prometheusOutput).toBeDefined();
    });
  });

  describe('Start Command', () => {
    it('should start dashboard in monitoring mode', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'start'];
      
      // Mock process.on to prevent actual signal handling
      const mockProcessOn = vi.spyOn(process, 'on').mockImplementation(() => process);
      
      // Start the dashboard (this will run indefinitely, so we need to stop it quickly)
      const runPromise = cli.run();
      
      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🚀 Starting Test Metrics Dashboard...')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('📊 Dashboard running - Press Ctrl+C to stop')
      );
      
      // Clean up
      mockProcessOn.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle CLI errors gracefully', async () => {
      // Mock the dashboard to throw an error
      const originalRun = cli.run;
      vi.spyOn(cli, 'run').mockImplementation(async () => {
        throw new Error('Test CLI error');
      });
      
      try {
        await cli.run();
      } catch (error) {
        // Error should be caught and handled
      }
      
      // Restore original method
      cli.run = originalRun;
    });
  });

  describe('Help Display', () => {
    it('should show comprehensive help information', async () => {
      process.argv = ['node', 'dashboard-cli.ts', 'help'];
      
      await cli.run();
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Test Metrics Dashboard CLI')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Usage: npm run dashboard <command> [options]')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Commands:')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Options:')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Examples:')
      );
    });
  });
});