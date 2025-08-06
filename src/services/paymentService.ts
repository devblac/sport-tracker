// Payment Service - Simple Stripe integration for premium content
// Cost-effective approach using Stripe's client-side integration

import { PaymentIntent } from '../types/marketplace';
import { premiumContentService } from './premiumContentService';

// Stripe types (simplified)
interface StripePaymentElement {
  mount: (element: string) => void;
  unmount: () => void;
}

interface StripeElements {
  create: (type: string, options?: any) => StripePaymentElement;
}

interface StripeInstance {
  elements: (options?: any) => StripeElements;
  confirmPayment: (options: any) => Promise<{ error?: any; paymentIntent?: any }>;
}

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeInstance;
  }
}

class PaymentService {
  private stripe: StripeInstance | null = null;
  private elements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;

  // Stripe publishable key (should be in environment variables)
  private readonly STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_...';

  /**
   * Initialize Stripe
   */
  async initializeStripe(): Promise<boolean> {
    try {
      // Load Stripe script if not already loaded
      if (!window.Stripe) {
        await this.loadStripeScript();
      }

      if (window.Stripe) {
        this.stripe = window.Stripe(this.STRIPE_PUBLISHABLE_KEY);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      return false;
    }
  }

  /**
   * Create payment form for content purchase
   */
  async createPaymentForm(contentId: string, userId: string, containerId: string): Promise<boolean> {
    try {
      if (!this.stripe) {
        const initialized = await this.initializeStripe();
        if (!initialized) {
          throw new Error('Failed to initialize Stripe');
        }
      }

      // Create payment intent on our backend (or simulate it)
      const paymentIntent = await this.createPaymentIntent(contentId, userId);
      
      // Create Stripe elements
      this.elements = this.stripe!.elements({
        clientSecret: paymentIntent.client_secret, // Would come from backend
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#3b82f6',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px'
          }
        }
      });

      // Create payment element
      this.paymentElement = this.elements.create('payment', {
        layout: 'tabs'
      });

      // Mount payment element
      this.paymentElement.mount(`#${containerId}`);

      return true;
    } catch (error) {
      console.error('Failed to create payment form:', error);
      return false;
    }
  }

  /**
   * Process payment for content
   */
  async processPayment(contentId: string, userId: string, returnUrl: string): Promise<{
    success: boolean;
    error?: string;
    paymentIntent?: any;
  }> {
    try {
      if (!this.stripe || !this.elements) {
        throw new Error('Stripe not initialized');
      }

      const { error, paymentIntent } = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required'
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Record the purchase locally
        await this.recordSuccessfulPurchase(contentId, userId, paymentIntent);
        
        return {
          success: true,
          paymentIntent
        };
      }

      return {
        success: false,
        error: 'Payment was not completed'
      };
    } catch (error) {
      console.error('Payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }

  /**
   * Get payment methods for user (simplified)
   */
  async getPaymentMethods(): Promise<string[]> {
    // In a real implementation, this would fetch saved payment methods
    return ['card', 'apple_pay', 'google_pay'];
  }

  /**
   * Validate payment before processing
   */
  async validatePayment(contentId: string, userId: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      // Check if user already owns the content
      const hasPurchased = await premiumContentService.hasPurchasedContent(contentId, userId);
      if (hasPurchased) {
        return {
          valid: false,
          error: 'You already own this content'
        };
      }

      // Check if content exists and is active
      const catalog = await premiumContentService.getPremiumContentCatalog();
      const content = catalog.find(c => c.id === contentId);
      
      if (!content) {
        return {
          valid: false,
          error: 'Content not found'
        };
      }

      if (!content.is_active) {
        return {
          valid: false,
          error: 'Content is no longer available'
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Validation failed'
      };
    }
  }

  /**
   * Get pricing for content with any applicable discounts
   */
  async getContentPricing(contentId: string, userId: string): Promise<{
    originalPrice: number;
    finalPrice: number;
    currency: string;
    discount?: {
      type: string;
      amount: number;
      description: string;
    };
  }> {
    const catalog = await premiumContentService.getPremiumContentCatalog();
    const content = catalog.find(c => c.id === contentId);
    
    if (!content) {
      throw new Error('Content not found');
    }

    // For now, return original pricing
    // In the future, could apply user-specific discounts, promotions, etc.
    return {
      originalPrice: content.price,
      finalPrice: content.price,
      currency: content.currency
    };
  }

  /**
   * Format price for display
   */
  formatPrice(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    });

    return formatter.format(amount / 100); // Convert from cents
  }

  /**
   * Cleanup payment form
   */
  cleanup(): void {
    if (this.paymentElement) {
      this.paymentElement.unmount();
      this.paymentElement = null;
    }
    this.elements = null;
  }

  // ===== PRIVATE METHODS =====

  private async loadStripeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="stripe.com"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Stripe script'));
      document.head.appendChild(script);
    });
  }

  private async createPaymentIntent(contentId: string, userId: string): Promise<any> {
    // In a real implementation, this would call your backend API
    // For now, simulate the response
    const catalog = await premiumContentService.getPremiumContentCatalog();
    const content = catalog.find(c => c.id === contentId);
    
    if (!content) {
      throw new Error('Content not found');
    }

    // Simulate backend response
    return {
      id: `pi_${Date.now()}`,
      client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: content.price,
      currency: content.currency.toLowerCase(),
      status: 'requires_payment_method'
    };
  }

  private async recordSuccessfulPurchase(contentId: string, userId: string, paymentIntent: any): Promise<void> {
    const catalog = await premiumContentService.getPremiumContentCatalog();
    const content = catalog.find(c => c.id === contentId);
    
    if (!content) {
      throw new Error('Content not found');
    }

    await premiumContentService.recordPurchase({
      content_id: contentId,
      user_id: userId,
      purchase_date: new Date(),
      price_paid: content.price,
      currency: content.currency,
      payment_method: 'stripe',
      transaction_id: paymentIntent.id,
      last_accessed: new Date()
    });
  }
}

export const paymentService = new PaymentService();