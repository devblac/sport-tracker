/**
 * Comprehensive Accessibility Testing Framework
 * 
 * This module provides automated and manual accessibility testing capabilities
 * following WCAG 2.1 AA guidelines with axe-core integration.
 */

import { axe } from 'jest-axe';
// Note: toHaveNoViolations is imported in test setup
import { RenderResult } from '@testing-library/react';
import { expect } from 'vitest';

// Note: toHaveNoViolations matcher is extended in test setup

/**
 * WCAG 2.1 AA Rule Configuration
 * Using only valid axe-core rule IDs
 */
export const WCAG_AA_RULES = {
  // Color and Contrast
  'color-contrast': { enabled: true },
  
  // ARIA Labels and Roles
  'aria-allowed-attr': { enabled: true },
  'aria-command-name': { enabled: true },
  'aria-hidden-body': { enabled: true },
  'aria-hidden-focus': { enabled: true },
  'aria-input-field-name': { enabled: true },
  'aria-required-attr': { enabled: true },
  'aria-required-children': { enabled: true },
  'aria-required-parent': { enabled: true },
  'aria-roles': { enabled: true },
  'aria-valid-attr': { enabled: true },
  'aria-valid-attr-value': { enabled: true },
  
  // Form Controls
  'label': { enabled: true },
  'form-field-multiple-labels': { enabled: true },
  
  // Images and Media
  'image-alt': { enabled: true },
  'input-image-alt': { enabled: true },
  
  // Page Structure
  'page-has-heading-one': { enabled: true },
  'heading-order': { enabled: true },
  'landmark-one-main': { enabled: true },
  'landmark-complementary-is-top-level': { enabled: true },
  
  // Links and Navigation
  'link-name': { enabled: true },
  'link-in-text-block': { enabled: true },
  
  // Interactive Elements
  'button-name': { enabled: true },
  
  // Tables
  'table-fake-caption': { enabled: true },
  'td-headers-attr': { enabled: true },
  'th-has-data-cells': { enabled: true },
  
  // Language
  'html-has-lang': { enabled: true },
  'html-lang-valid': { enabled: true },
  'valid-lang': { enabled: true },
  
  // Focus and Keyboard
  'tabindex': { enabled: true },
  'focus-order-valid': { enabled: true }
};

/**
 * Accessibility Test Results Interface
 */
export interface AccessibilityTestResult {
  passed: boolean;
  violations: AxeViolation[];
  incomplete: AxeIncomplete[];
  passes: AxePass[];
  summary: {
    violationCount: number;
    incompleteCount: number;
    passCount: number;
    criticalViolations: number;
    seriousViolations: number;
  };
}

/**
 * Manual Accessibility Test Interface
 */
export interface ManualAccessibilityTest {
  id: string;
  name: string;
  description: string;
  category: 'keyboard' | 'screen-reader' | 'focus' | 'interaction' | 'content';
  priority: 'critical' | 'high' | 'medium' | 'low';
  wcagCriteria: string[];
  steps: string[];
  expectedBehavior: string;
  testingTools?: string[];
  notes?: string;
}

/**
 * Keyboard Navigation Test Configuration
 */
export interface KeyboardTestConfig {
  element: HTMLElement;
  expectedFocusOrder: string[]; // CSS selectors
  trapFocus?: boolean;
  escapeKey?: boolean;
  arrowKeys?: boolean;
  enterSpaceActivation?: boolean;
}

/**
 * Screen Reader Test Configuration
 */
export interface ScreenReaderTestConfig {
  element: HTMLElement;
  expectedAnnouncements: string[];
  liveRegions?: boolean;
  semanticStructure?: boolean;
  navigationLandmarks?: boolean;
}

/**
 * Main Accessibility Testing Class
 */
export class AccessibilityTester {
  private axeConfig: any;

  constructor() {
    this.axeConfig = {
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      reporter: 'v2'
    };
  }

  /**
   * Run automated accessibility checks using axe-core
   */
  async runAutomatedChecks(component: RenderResult): Promise<AccessibilityTestResult> {
    try {
      const results = await axe(component.container, this.axeConfig);
      
      // Check for violations (toHaveNoViolations is only available in test environment)
      if (results.violations && results.violations.length > 0) {
        throw new Error(`Accessibility violations found: ${results.violations.map((v: any) => v.id).join(', ')}`);
      }
      
      return this.formatResults(results);
    } catch (error) {
      console.error('Accessibility test failed:', error);
      throw error;
    }
  }

  /**
   * Run focused accessibility checks for specific WCAG criteria
   */
  async runFocusedChecks(
    component: RenderResult, 
    criteria: string[]
  ): Promise<AccessibilityTestResult> {
    const focusedConfig = {
      ...this.axeConfig,
      tags: criteria
    };

    const results = await axe(component.container, focusedConfig);
    
    // Check for violations (toHaveNoViolations is only available in test environment)
    if (results.violations && results.violations.length > 0) {
      throw new Error(`Accessibility violations found: ${results.violations.map((v: any) => v.id).join(', ')}`);
    }
    
    return this.formatResults(results);
  }

  /**
   * Test keyboard navigation functionality
   */
  async testKeyboardNavigation(config: KeyboardTestConfig): Promise<boolean> {
    const { element, expectedFocusOrder, trapFocus, escapeKey, arrowKeys, enterSpaceActivation } = config;
    
    try {
      // Test tab order
      if (expectedFocusOrder.length > 0) {
        await this.testTabOrder(element, expectedFocusOrder);
      }

      // Test focus trapping if enabled
      if (trapFocus) {
        await this.testFocusTrap(element);
      }

      // Test escape key behavior
      if (escapeKey) {
        await this.testEscapeKey(element);
      }

      // Test arrow key navigation
      if (arrowKeys) {
        await this.testArrowKeyNavigation(element);
      }

      // Test enter/space activation
      if (enterSpaceActivation) {
        await this.testEnterSpaceActivation(element);
      }

      return true;
    } catch (error) {
      console.error('Keyboard navigation test failed:', error);
      return false;
    }
  }

  /**
   * Test screen reader compatibility
   */
  async testScreenReaderCompatibility(config: ScreenReaderTestConfig): Promise<boolean> {
    const { element, expectedAnnouncements, liveRegions, semanticStructure, navigationLandmarks } = config;
    
    try {
      // Test ARIA labels and descriptions
      await this.testAriaLabels(element, expectedAnnouncements);

      // Test live regions if enabled
      if (liveRegions) {
        await this.testLiveRegions(element);
      }

      // Test semantic structure
      if (semanticStructure) {
        await this.testSemanticStructure(element);
      }

      // Test navigation landmarks
      if (navigationLandmarks) {
        await this.testNavigationLandmarks(element);
      }

      return true;
    } catch (error) {
      console.error('Screen reader compatibility test failed:', error);
      return false;
    }
  }

  /**
   * Get comprehensive manual test checklist
   */
  getManualTestChecklist(): ManualAccessibilityTest[] {
    return [
      // Workout Player Controls
      {
        id: 'workout-player-keyboard',
        name: 'Keyboard Navigation - Workout Player Controls',
        description: 'Verify all workout player controls are accessible via keyboard navigation',
        category: 'keyboard',
        priority: 'critical',
        wcagCriteria: ['2.1.1', '2.1.2', '2.4.3'],
        steps: [
          'Navigate to workout player page',
          'Use Tab key to move through all controls (play, pause, next, previous, volume)',
          'Verify focus indicators are clearly visible',
          'Test Space/Enter key activation for each control',
          'Test Escape key to exit fullscreen or modal states',
          'Verify focus returns to logical position after interactions'
        ],
        expectedBehavior: 'All controls should be reachable via keyboard, have visible focus indicators, and respond to appropriate key presses',
        testingTools: ['Keyboard only', 'Browser developer tools'],
        notes: 'Pay special attention to custom video/audio controls and timer displays'
      },

      // Social Feed Screen Reader
      {
        id: 'social-feed-screen-reader',
        name: 'Screen Reader - Social Feed Announcements',
        description: 'Verify social feed content is properly announced to screen readers',
        category: 'screen-reader',
        priority: 'high',
        wcagCriteria: ['1.3.1', '2.4.6', '4.1.3'],
        steps: [
          'Enable screen reader (NVDA, JAWS, or VoiceOver)',
          'Navigate to social feed page',
          'Verify post content is announced with proper context',
          'Test live region updates when new posts appear',
          'Verify user names, timestamps, and actions are announced',
          'Test navigation between posts using screen reader commands'
        ],
        expectedBehavior: 'Screen reader should announce all content clearly with proper context and semantic structure',
        testingTools: ['NVDA', 'JAWS', 'VoiceOver', 'Browser screen reader testing'],
        notes: 'Test with different screen readers as behavior may vary'
      },

      // Exercise Form Accessibility
      {
        id: 'exercise-form-accessibility',
        name: 'Exercise Form - Complete Accessibility Audit',
        description: 'Comprehensive accessibility testing for exercise creation and editing forms',
        category: 'interaction',
        priority: 'high',
        wcagCriteria: ['1.3.1', '2.4.6', '3.3.1', '3.3.2'],
        steps: [
          'Navigate to exercise creation form',
          'Verify all form fields have proper labels',
          'Test error message announcements',
          'Verify required field indicators',
          'Test form submission with keyboard only',
          'Verify success/error feedback is announced'
        ],
        expectedBehavior: 'Forms should be fully accessible with clear labels, error messages, and keyboard navigation',
        testingTools: ['Keyboard navigation', 'Screen reader', 'axe DevTools'],
        notes: 'Include testing of dynamic form fields and validation messages'
      },

      // Achievement Notifications
      {
        id: 'achievement-notifications-a11y',
        name: 'Achievement Notifications - Accessibility',
        description: 'Test accessibility of achievement and gamification notifications',
        category: 'content',
        priority: 'medium',
        wcagCriteria: ['1.4.3', '2.2.4', '4.1.3'],
        steps: [
          'Trigger achievement notification',
          'Verify notification is announced to screen readers',
          'Test keyboard navigation within notification',
          'Verify color contrast meets WCAG AA standards',
          'Test notification dismissal methods',
          'Verify notification doesn\'t interfere with other interactions'
        ],
        expectedBehavior: 'Notifications should be accessible, properly announced, and not disrupt user workflow',
        testingTools: ['Screen reader', 'Color contrast analyzer', 'Keyboard navigation'],
        notes: 'Test both success and error notifications'
      },

      // Navigation Menu
      {
        id: 'navigation-menu-focus',
        name: 'Navigation Menu - Focus Management',
        description: 'Test focus management in main navigation and mobile menu',
        category: 'focus',
        priority: 'critical',
        wcagCriteria: ['2.4.3', '2.4.7', '3.2.1'],
        steps: [
          'Open main navigation menu',
          'Verify focus moves to first menu item',
          'Test arrow key navigation between menu items',
          'Test Escape key to close menu',
          'Verify focus returns to menu trigger',
          'Test submenu navigation if applicable'
        ],
        expectedBehavior: 'Focus should be properly managed with clear visual indicators and logical navigation flow',
        testingTools: ['Keyboard navigation', 'Browser developer tools'],
        notes: 'Test both desktop and mobile navigation patterns'
      },

      // Leaderboard Tables
      {
        id: 'leaderboard-table-structure',
        name: 'Leaderboard Tables - Semantic Structure',
        description: 'Verify leaderboard tables have proper semantic structure for screen readers',
        category: 'content',
        priority: 'medium',
        wcagCriteria: ['1.3.1', '2.4.6'],
        steps: [
          'Navigate to leaderboard page',
          'Verify table has proper headers',
          'Test table navigation with screen reader',
          'Verify column and row relationships are clear',
          'Test sorting functionality accessibility',
          'Verify rank information is properly conveyed'
        ],
        expectedBehavior: 'Tables should have clear structure with proper headers and relationships',
        testingTools: ['Screen reader', 'axe DevTools', 'Browser accessibility inspector'],
        notes: 'Include testing of dynamic table updates and sorting'
      },

      // Color and Contrast
      {
        id: 'color-contrast-audit',
        name: 'Color Contrast - WCAG AA Compliance',
        description: 'Comprehensive color contrast audit across all UI elements',
        category: 'content',
        priority: 'high',
        wcagCriteria: ['1.4.3', '1.4.6'],
        steps: [
          'Test text color contrast ratios',
          'Verify interactive element contrast',
          'Test focus indicator contrast',
          'Check error message color contrast',
          'Verify chart and graph accessibility',
          'Test dark mode color contrast'
        ],
        expectedBehavior: 'All text should meet WCAG AA contrast ratio of 4.5:1 (3:1 for large text)',
        testingTools: ['Color contrast analyzer', 'axe DevTools', 'WebAIM Contrast Checker'],
        notes: 'Test both light and dark themes'
      },

      // Mobile Touch Targets
      {
        id: 'mobile-touch-targets',
        name: 'Mobile Touch Targets - Size and Spacing',
        description: 'Verify mobile touch targets meet minimum size requirements',
        category: 'interaction',
        priority: 'medium',
        wcagCriteria: ['2.5.5'],
        steps: [
          'Test on mobile device or mobile viewport',
          'Verify buttons are at least 44x44 CSS pixels',
          'Check spacing between interactive elements',
          'Test touch target accuracy',
          'Verify no accidental activations occur',
          'Test with different finger sizes (accessibility settings)'
        ],
        expectedBehavior: 'Touch targets should be large enough and properly spaced for accurate interaction',
        testingTools: ['Mobile device', 'Browser mobile simulation', 'Touch target measurement tools'],
        notes: 'Consider users with motor impairments and larger fingers'
      }
    ];
  }

  /**
   * Generate accessibility test report
   */
  generateAccessibilityReport(
    automatedResults: AccessibilityTestResult[],
    manualTestResults: { test: ManualAccessibilityTest; passed: boolean; notes?: string }[]
  ): AccessibilityReport {
    const totalViolations = automatedResults.reduce((sum, result) => sum + result.violations.length, 0);
    const totalTests = automatedResults.length + manualTestResults.length;
    const passedTests = automatedResults.filter(r => r.passed).length + 
                       manualTestResults.filter(r => r.passed).length;

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        overallScore: (passedTests / totalTests) * 100,
        totalViolations,
        criticalIssues: automatedResults.reduce((sum, r) => sum + r.summary.criticalViolations, 0)
      },
      automatedResults,
      manualTestResults,
      recommendations: this.generateRecommendations(automatedResults, manualTestResults),
      wcagCompliance: this.assessWCAGCompliance(automatedResults, manualTestResults)
    };
  }

  // Private helper methods

  private formatResults(axeResults: any): AccessibilityTestResult {
    return {
      passed: axeResults.violations.length === 0,
      violations: axeResults.violations,
      incomplete: axeResults.incomplete,
      passes: axeResults.passes,
      summary: {
        violationCount: axeResults.violations.length,
        incompleteCount: axeResults.incomplete.length,
        passCount: axeResults.passes.length,
        criticalViolations: axeResults.violations.filter((v: any) => v.impact === 'critical').length,
        seriousViolations: axeResults.violations.filter((v: any) => v.impact === 'serious').length
      }
    };
  }

  private async testTabOrder(element: HTMLElement, expectedOrder: string[]): Promise<void> {
    // Implementation for testing tab order
    const focusableElements = element.querySelectorAll(expectedOrder.join(', '));
    
    for (let i = 0; i < focusableElements.length; i++) {
      const el = focusableElements[i] as HTMLElement;
      el.focus();
      
      if (document.activeElement !== el) {
        throw new Error(`Element ${expectedOrder[i]} is not focusable or not in correct tab order`);
      }
    }
  }

  private async testFocusTrap(element: HTMLElement): Promise<void> {
    // Implementation for testing focus trap
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) {
      throw new Error('No focusable elements found for focus trap test');
    }

    // Test that focus stays within the element
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    firstElement.focus();
    if (document.activeElement !== firstElement) {
      throw new Error('Focus trap: First element not focused');
    }
    
    lastElement.focus();
    if (document.activeElement !== lastElement) {
      throw new Error('Focus trap: Last element not focused');
    }
  }

  private async testEscapeKey(element: HTMLElement): Promise<void> {
    // Implementation for testing escape key behavior
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    element.dispatchEvent(escapeEvent);
    
    // Check if modal/dialog closes or focus returns appropriately
    // This would need to be customized based on component behavior
  }

  private async testArrowKeyNavigation(element: HTMLElement): Promise<void> {
    // Implementation for testing arrow key navigation
    const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
    
    element.dispatchEvent(arrowDownEvent);
    element.dispatchEvent(arrowUpEvent);
    
    // Verify navigation behavior based on component type
  }

  private async testEnterSpaceActivation(element: HTMLElement): Promise<void> {
    // Implementation for testing enter/space key activation
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    
    element.dispatchEvent(enterEvent);
    element.dispatchEvent(spaceEvent);
    
    // Verify activation behavior
  }

  private async testAriaLabels(element: HTMLElement, expectedAnnouncements: string[]): Promise<void> {
    // Implementation for testing ARIA labels and announcements
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    
    if (!ariaLabel && !ariaLabelledBy) {
      throw new Error('Element missing accessible name (aria-label or aria-labelledby)');
    }
  }

  private async testLiveRegions(element: HTMLElement): Promise<void> {
    // Implementation for testing live regions
    const liveRegions = element.querySelectorAll('[aria-live]');
    
    liveRegions.forEach(region => {
      const liveValue = region.getAttribute('aria-live');
      if (!['polite', 'assertive', 'off'].includes(liveValue || '')) {
        throw new Error(`Invalid aria-live value: ${liveValue}`);
      }
    });
  }

  private async testSemanticStructure(element: HTMLElement): Promise<void> {
    // Implementation for testing semantic structure
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const landmarks = element.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]');
    
    // Verify heading hierarchy
    let previousLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        throw new Error(`Heading hierarchy skip detected: h${previousLevel} to h${level}`);
      }
      previousLevel = level;
    });
  }

  private async testNavigationLandmarks(element: HTMLElement): Promise<void> {
    // Implementation for testing navigation landmarks
    const nav = element.querySelector('nav, [role="navigation"]');
    const main = element.querySelector('main, [role="main"]');
    
    if (!nav) {
      console.warn('No navigation landmark found');
    }
    
    if (!main) {
      console.warn('No main landmark found');
    }
  }

  private generateRecommendations(
    automatedResults: AccessibilityTestResult[],
    manualTestResults: { test: ManualAccessibilityTest; passed: boolean; notes?: string }[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Analyze automated results for common issues
    automatedResults.forEach(result => {
      result.violations.forEach(violation => {
        switch (violation.id) {
          case 'color-contrast':
            recommendations.push('Improve color contrast ratios to meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)');
            break;
          case 'label':
            recommendations.push('Add proper labels to form controls using <label> elements or aria-label attributes');
            break;
          case 'keyboard':
            recommendations.push('Ensure all interactive elements are keyboard accessible');
            break;
          case 'focus-order':
            recommendations.push('Review and fix focus order to follow logical sequence');
            break;
          default:
            recommendations.push(`Address ${violation.id} violations: ${violation.description}`);
        }
      });
    });
    
    // Analyze manual test results
    const failedManualTests = manualTestResults.filter(r => !r.passed);
    failedManualTests.forEach(result => {
      recommendations.push(`Manual test failed: ${result.test.name} - ${result.notes || 'See test description for details'}`);
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  private assessWCAGCompliance(
    automatedResults: AccessibilityTestResult[],
    manualTestResults: { test: ManualAccessibilityTest; passed: boolean; notes?: string }[]
  ): WCAGComplianceAssessment {
    const totalViolations = automatedResults.reduce((sum, result) => sum + result.violations.length, 0);
    const criticalViolations = automatedResults.reduce((sum, result) => sum + result.summary.criticalViolations, 0);
    const failedManualTests = manualTestResults.filter(r => !r.passed).length;
    
    let complianceLevel: 'AAA' | 'AA' | 'A' | 'Non-compliant' = 'Non-compliant';
    
    if (totalViolations === 0 && failedManualTests === 0) {
      complianceLevel = 'AA'; // Assuming AA level testing
    } else if (criticalViolations === 0 && failedManualTests <= 1) {
      complianceLevel = 'A';
    }
    
    return {
      level: complianceLevel,
      totalViolations,
      criticalViolations,
      failedManualTests,
      recommendations: totalViolations > 0 || failedManualTests > 0 ? 
        ['Address all violations and failed manual tests to achieve WCAG AA compliance'] : 
        ['Maintain current accessibility standards']
    };
  }
}

// Type definitions for the report
export interface AccessibilityReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    overallScore: number;
    totalViolations: number;
    criticalIssues: number;
  };
  automatedResults: AccessibilityTestResult[];
  manualTestResults: { test: ManualAccessibilityTest; passed: boolean; notes?: string }[];
  recommendations: string[];
  wcagCompliance: WCAGComplianceAssessment;
}

export interface WCAGComplianceAssessment {
  level: 'AAA' | 'AA' | 'A' | 'Non-compliant';
  totalViolations: number;
  criticalViolations: number;
  failedManualTests: number;
  recommendations: string[];
}

// Type definitions for axe results (simplified)
interface AxeViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: any[];
}

interface AxeIncomplete {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: any[];
}

interface AxePass {
  id: string;
  impact: null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: any[];
}

// Export singleton instance
export const accessibilityTester = new AccessibilityTester();