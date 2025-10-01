/**
 * Accessibility Testing Utilities
 * 
 * Helper functions and utilities for accessibility testing across the application
 */

import { render, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import { accessibilityTester, AccessibilityTestResult, KeyboardTestConfig, ScreenReaderTestConfig } from './accessibility-tester';

/**
 * Enhanced render function with accessibility testing capabilities
 */
export const renderWithA11y = async (
  component: ReactElement,
  options?: {
    runAutomatedChecks?: boolean;
    wcagCriteria?: string[];
  }
): Promise<RenderResult & { a11yResults?: AccessibilityTestResult }> => {
  const renderResult = render(component);
  
  if (options?.runAutomatedChecks !== false) {
    try {
      const a11yResults = options?.wcagCriteria 
        ? await accessibilityTester.runFocusedChecks(renderResult, options.wcagCriteria)
        : await accessibilityTester.runAutomatedChecks(renderResult);
      
      return { ...renderResult, a11yResults };
    } catch (error) {
      console.error('Accessibility check failed during render:', error);
      return renderResult;
    }
  }
  
  return renderResult;
};

/**
 * Test keyboard navigation for a component
 */
export const testKeyboardNavigation = async (
  component: ReactElement,
  config: Partial<KeyboardTestConfig> = {}
): Promise<boolean> => {
  const { container } = render(component);
  const user = userEvent.setup();
  
  const defaultConfig: KeyboardTestConfig = {
    element: container,
    expectedFocusOrder: [],
    trapFocus: false,
    escapeKey: false,
    arrowKeys: false,
    enterSpaceActivation: true,
    ...config
  };
  
  return accessibilityTester.testKeyboardNavigation(defaultConfig);
};

/**
 * Test screen reader compatibility for a component
 */
export const testScreenReaderCompatibility = async (
  component: ReactElement,
  config: Partial<ScreenReaderTestConfig> = {}
): Promise<boolean> => {
  const { container } = render(component);
  
  const defaultConfig: ScreenReaderTestConfig = {
    element: container,
    expectedAnnouncements: [],
    liveRegions: false,
    semanticStructure: true,
    navigationLandmarks: false,
    ...config
  };
  
  return accessibilityTester.testScreenReaderCompatibility(defaultConfig);
};

/**
 * Accessibility test helpers for common UI patterns
 */
export const a11yTestHelpers = {
  /**
   * Test button accessibility
   */
  async testButton(buttonElement: HTMLElement): Promise<void> {
    // Check for accessible name
    const accessibleName = buttonElement.getAttribute('aria-label') || 
                          buttonElement.getAttribute('aria-labelledby') ||
                          buttonElement.textContent?.trim();
    
    if (!accessibleName) {
      throw new Error('Button missing accessible name');
    }
    
    // Check for proper role
    const role = buttonElement.getAttribute('role') || buttonElement.tagName.toLowerCase();
    if (!['button', 'link'].includes(role)) {
      throw new Error(`Invalid button role: ${role}`);
    }
    
    // Check if focusable
    const tabIndex = buttonElement.getAttribute('tabindex');
    if (tabIndex === '-1' && !buttonElement.hasAttribute('disabled')) {
      throw new Error('Button is not focusable');
    }
  },

  /**
   * Test form field accessibility
   */
  async testFormField(fieldElement: HTMLElement): Promise<void> {
    const fieldId = fieldElement.getAttribute('id');
    const ariaLabel = fieldElement.getAttribute('aria-label');
    const ariaLabelledBy = fieldElement.getAttribute('aria-labelledby');
    
    // Check for label association
    let hasLabel = false;
    
    if (fieldId) {
      const label = document.querySelector(`label[for="${fieldId}"]`);
      hasLabel = !!label;
    }
    
    if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
      throw new Error('Form field missing accessible label');
    }
    
    // Check for required field indication
    const required = fieldElement.hasAttribute('required') || 
                    fieldElement.getAttribute('aria-required') === 'true';
    
    if (required) {
      // Should have some indication of being required
      const requiredIndicator = fieldElement.getAttribute('aria-describedby') ||
                               document.querySelector(`label[for="${fieldId}"]`)?.textContent?.includes('*') ||
                               fieldElement.getAttribute('aria-label')?.includes('required');
      
      if (!requiredIndicator) {
        console.warn('Required field may not be clearly indicated to screen readers');
      }
    }
  },

  /**
   * Test heading hierarchy
   */
  async testHeadingHierarchy(container: HTMLElement): Promise<void> {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (index === 0 && level !== 1) {
        console.warn('First heading should be h1');
      }
      
      if (level > previousLevel + 1) {
        throw new Error(`Heading hierarchy skip: h${previousLevel} to h${level}`);
      }
      
      previousLevel = level;
    });
  },

  /**
   * Test color contrast (basic check)
   */
  async testColorContrast(element: HTMLElement): Promise<void> {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    // This is a basic check - in real implementation, you'd use a proper contrast calculation
    if (color === backgroundColor) {
      throw new Error('Text and background colors are the same');
    }
    
    // For proper contrast testing, integrate with a color contrast library
    console.log(`Color contrast check needed for element with color: ${color}, background: ${backgroundColor}`);
  },

  /**
   * Test focus indicators
   */
  async testFocusIndicators(element: HTMLElement): Promise<void> {
    const user = userEvent.setup();
    
    // Focus the element
    element.focus();
    
    if (document.activeElement !== element) {
      throw new Error('Element is not focusable');
    }
    
    // Check for visible focus indicator
    const styles = window.getComputedStyle(element);
    const outline = styles.outline;
    const outlineWidth = styles.outlineWidth;
    const boxShadow = styles.boxShadow;
    
    if (outline === 'none' && outlineWidth === '0px' && !boxShadow.includes('inset')) {
      console.warn('Element may not have a visible focus indicator');
    }
  },

  /**
   * Test live regions
   */
  async testLiveRegion(element: HTMLElement, expectedAnnouncement: string): Promise<void> {
    const ariaLive = element.getAttribute('aria-live');
    
    if (!ariaLive || !['polite', 'assertive'].includes(ariaLive)) {
      throw new Error('Element is not a proper live region');
    }
    
    // Simulate content change
    const originalContent = element.textContent;
    element.textContent = expectedAnnouncement;
    
    // In a real test, you'd verify the screen reader announcement
    // For now, we just check the setup is correct
    
    // Restore original content
    element.textContent = originalContent;
  },

  /**
   * Test modal/dialog accessibility
   */
  async testModal(modalElement: HTMLElement): Promise<void> {
    // Check for proper role
    const role = modalElement.getAttribute('role');
    if (role !== 'dialog' && role !== 'alertdialog') {
      throw new Error('Modal missing proper role (dialog or alertdialog)');
    }
    
    // Check for aria-labelledby or aria-label
    const ariaLabel = modalElement.getAttribute('aria-label');
    const ariaLabelledBy = modalElement.getAttribute('aria-labelledby');
    
    if (!ariaLabel && !ariaLabelledBy) {
      throw new Error('Modal missing accessible name');
    }
    
    // Check for focus management
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) {
      throw new Error('Modal has no focusable elements');
    }
    
    // Check for aria-modal
    const ariaModal = modalElement.getAttribute('aria-modal');
    if (ariaModal !== 'true') {
      console.warn('Modal should have aria-modal="true"');
    }
  }
};

/**
 * Keyboard event simulation helpers
 */
export const keyboardTestHelpers = {
  /**
   * Simulate Tab key press
   */
  async pressTab(element?: HTMLElement): Promise<void> {
    const user = userEvent.setup();
    await user.keyboard('{Tab}');
  },

  /**
   * Simulate Shift+Tab key press
   */
  async pressShiftTab(element?: HTMLElement): Promise<void> {
    const user = userEvent.setup();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
  },

  /**
   * Simulate Enter key press
   */
  async pressEnter(element?: HTMLElement): Promise<void> {
    const user = userEvent.setup();
    if (element) {
      await user.click(element);
    }
    await user.keyboard('{Enter}');
  },

  /**
   * Simulate Space key press
   */
  async pressSpace(element?: HTMLElement): Promise<void> {
    const user = userEvent.setup();
    if (element) {
      await user.click(element);
    }
    await user.keyboard(' ');
  },

  /**
   * Simulate Escape key press
   */
  async pressEscape(element?: HTMLElement): Promise<void> {
    const user = userEvent.setup();
    await user.keyboard('{Escape}');
  },

  /**
   * Simulate Arrow key presses
   */
  async pressArrowDown(element?: HTMLElement): Promise<void> {
    const user = userEvent.setup();
    await user.keyboard('{ArrowDown}');
  },

  async pressArrowUp(element?: HTMLElement): Promise<void> {
    const user = userEvent.setup();
    await user.keyboard('{ArrowUp}');
  },

  async pressArrowLeft(element?: HTMLElement): Promise<void> {
    const user = userEvent.setup();
    await user.keyboard('{ArrowLeft}');
  },

  async pressArrowRight(element?: HTMLElement): Promise<void> {
    const user = userEvent.setup();
    await user.keyboard('{ArrowRight}');
  }
};

/**
 * Screen reader testing helpers
 */
export const screenReaderTestHelpers = {
  /**
   * Get accessible name for an element
   */
  getAccessibleName(element: HTMLElement): string {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) return labelElement.textContent || '';
    }
    
    const id = element.getAttribute('id');
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent || '';
    }
    
    return element.textContent || '';
  },

  /**
   * Get accessible description for an element
   */
  getAccessibleDescription(element: HTMLElement): string {
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    if (ariaDescribedBy) {
      const descriptionElement = document.getElementById(ariaDescribedBy);
      if (descriptionElement) return descriptionElement.textContent || '';
    }
    
    const title = element.getAttribute('title');
    if (title) return title;
    
    return '';
  },

  /**
   * Check if element is announced to screen readers
   */
  isAnnouncedToScreenReader(element: HTMLElement): boolean {
    const ariaHidden = element.getAttribute('aria-hidden');
    if (ariaHidden === 'true') return false;
    
    const role = element.getAttribute('role');
    if (role === 'presentation' || role === 'none') return false;
    
    const styles = window.getComputedStyle(element);
    if (styles.display === 'none' || styles.visibility === 'hidden') return false;
    
    return true;
  },

  /**
   * Get semantic role of element
   */
  getSemanticRole(element: HTMLElement): string {
    const explicitRole = element.getAttribute('role');
    if (explicitRole) return explicitRole;
    
    // Return implicit role based on tag name
    const tagName = element.tagName.toLowerCase();
    const implicitRoles: Record<string, string> = {
      'button': 'button',
      'a': 'link',
      'input': 'textbox', // simplified
      'textarea': 'textbox',
      'select': 'combobox',
      'h1': 'heading',
      'h2': 'heading',
      'h3': 'heading',
      'h4': 'heading',
      'h5': 'heading',
      'h6': 'heading',
      'nav': 'navigation',
      'main': 'main',
      'header': 'banner',
      'footer': 'contentinfo',
      'aside': 'complementary',
      'section': 'region',
      'article': 'article',
      'ul': 'list',
      'ol': 'list',
      'li': 'listitem',
      'table': 'table',
      'tr': 'row',
      'td': 'cell',
      'th': 'columnheader'
    };
    
    return implicitRoles[tagName] || 'generic';
  }
};

/**
 * Accessibility test matchers for Vitest
 */
export const a11yMatchers = {
  /**
   * Check if element is accessible
   */
  toBeAccessible: (element: HTMLElement) => {
    try {
      const accessibleName = screenReaderTestHelpers.getAccessibleName(element);
      const isAnnounced = screenReaderTestHelpers.isAnnouncedToScreenReader(element);
      
      return {
        pass: accessibleName.length > 0 && isAnnounced,
        message: () => `Element should be accessible with proper name and visibility`
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Accessibility check failed: ${error}`
      };
    }
  },

  /**
   * Check if element has proper focus management
   */
  toHaveProperFocus: (element: HTMLElement) => {
    const tabIndex = element.getAttribute('tabindex');
    const isFocusable = element.matches(':focus') || 
                       ['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase()) ||
                       (tabIndex && tabIndex !== '-1');
    
    return {
      pass: isFocusable,
      message: () => `Element should be focusable`
    };
  },

  /**
   * Check if element has proper ARIA attributes
   */
  toHaveProperAria: (element: HTMLElement) => {
    const role = element.getAttribute('role');
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    
    const hasAccessibleName = ariaLabel || ariaLabelledBy || element.textContent?.trim();
    
    return {
      pass: !!hasAccessibleName,
      message: () => `Element should have accessible name via aria-label, aria-labelledby, or text content`
    };
  }
};

// Export all utilities (removing duplicate exports)
export { accessibilityTester };