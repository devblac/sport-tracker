// ============================================================================
// PAYMENT SERVICE
// ============================================================================
// Service for handling payments with Stripe integration
// ============================================================================

import type { 
  PaymentMethod, 
  Purchase, 
  Subscription,
  BookSessionForm,
  TrainingSession,
  PremiumContent
} from '@/types/marketplace';

// Stripe configuration - In production, these would come from environment variables
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_mock_key';
const STRIPE_SECRET_KEY = import.meta.env.VITE_STRIPE_SECRET_KEY || 'sk_test_mock_key';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  client_secret: string;
  metadata?: Record<string, string>;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export interface StripeCard {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

class PaymentService {
  private stripe: any = null;

  constructor() {
    // In a real implementation, you would initialize Stripe here
    // this.stripe = Stripe(STRIPE_PUBLIC_KEY);
  }

  // Initialize Stripe (mock implementation)
  async initializeStripe(): Promise<void> {
    // Mock initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    this.stripe = {
      // Mock Stripe object
      createPaymentMethod: this.mockCreatePaymentMethod,
      confirmCardPayment: this.mockConfirmCardPayment,
      createToken: this.mockCreateToken
    };
  }

  // Create payment intent for session booking
  async createSessionPaymentIntent(
    sessionData: BookSessionForm,
    trainer: any
  ): Promise<PaymentIntent> {
    try {
      const amount = Math.round(trainer.hourlyRate * (sessionData.duration / 60) * 100); // Convert to cents
      const platformFee = this.calculatePlatformFee(amount / 100) * 100; // Platform fee in cents
      
      // In production, this would call Stripe API
      const paymentIntent: PaymentIntent = {
        id: `pi_${Date.now()}`,
        amount,
        currency: trainer.currency.toLowerCase(),
        status: 'requires_confirmation',
        client_secret: `pi_${Date.now()}_secret_mock`,
        metadata: {
          type: 'session_booking',
          trainer_id: trainer.id,
          session_date: sessionData.date,
          session_duration: sessionData.duration.toString(),
          platform_fee: platformFee.toString()
        }
      };
      
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Store payment intent for webhook processing
      await this.storePaymentIntent(paymentIntent);
      
      return paymentIntent;
    } catch (error) {
      throw new Error('Failed to create payment intent for session');
    }
  }

  // Create payment intent for content purchase
  async createContentPaymentIntent(
    content: PremiumContent
  ): Promise<PaymentIntent> {
    try {
      const amount = Math.round(content.price * 100); // Convert to cents
      const platformFee = this.calculatePlatformFee(content.price) * 100; // Platform fee in cents
      
      const paymentIntent: PaymentIntent = {
        id: `pi_${Date.now()}`,
        amount,
        currency: content.currency.toLowerCase(),
        status: 'requires_confirmation',
        client_secret: `pi_${Date.now()}_secret_mock`,
        metadata: {
          type: 'content_purchase',
          content_id: content.id,
          trainer_id: content.trainerId,
          platform_fee: platformFee.toString()
        }
      };
      
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Store payment intent for webhook processing
      await this.storePaymentIntent(paymentIntent);
      
      return paymentIntent;
    } catch (error) {
      throw new Error('Failed to create payment intent for content');
    }
  }

  // Confirm payment
  async confirmPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Mock payment confirmation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate 95% success rate
      const success = Math.random() > 0.05;
      
      if (success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: 'Your card was declined. Please try a different payment method.' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Payment processing failed. Please try again.' 
      };
    }
  }

  // Add payment method
  async addPaymentMethod(
    cardDetails: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
      name: string;
    }
  ): Promise<PaymentMethod> {
    try {
      // Mock card validation
      if (cardDetails.number.length < 13) {
        throw new Error('Invalid card number');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        id: `pm_${Date.now()}`,
        userId: 'current_user',
        type: 'card',
        isDefault: false,
        cardLast4: cardDetails.number.slice(-4),
        cardBrand: this.getCardBrand(cardDetails.number),
        expiryMonth: cardDetails.exp_month,
        expiryYear: cardDetails.exp_year,
        stripePaymentMethodId: `pm_${Date.now()}_stripe`,
        createdAt: new Date()
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add payment method');
    }
  }

  // Remove payment method
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      throw new Error('Failed to remove payment method');
    }
  }

  // Create subscription
  async createSubscription(
    plan: 'basic' | 'premium' | 'trainer',
    paymentMethodId: string
  ): Promise<Subscription> {
    try {
      const prices = {
        basic: 9.99,
        premium: 19.99,
        trainer: 49.99
      };
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        id: `sub_${Date.now()}`,
        userId: 'current_user',
        plan,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: `sub_${Date.now()}_stripe`,
        price: prices[plan],
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      throw new Error('Failed to create subscription');
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      throw new Error('Failed to cancel subscription');
    }
  }

  // Process refund
  async processRefund(
    purchaseId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        refundId: `re_${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process refund'
      };
    }
  }

  // Get payment methods for user
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return mock payment methods
      return [
        {
          id: 'pm_1',
          userId,
          type: 'card',
          isDefault: true,
          cardLast4: '4242',
          cardBrand: 'visa',
          expiryMonth: 12,
          expiryYear: 2025,
          stripePaymentMethodId: 'pm_1_stripe',
          createdAt: new Date('2023-01-15')
        },
        {
          id: 'pm_2',
          userId,
          type: 'card',
          isDefault: false,
          cardLast4: '0005',
          cardBrand: 'mastercard',
          expiryMonth: 8,
          expiryYear: 2026,
          stripePaymentMethodId: 'pm_2_stripe',
          createdAt: new Date('2023-06-20')
        }
      ];
    } catch (error) {
      throw new Error('Failed to fetch payment methods');
    }
  }

  // Get transaction history
  async getTransactionHistory(
    userId: string,
    limit: number = 50
  ): Promise<Purchase[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Return mock transaction history
      return [
        {
          id: 'pur_1',
          userId,
          trainerId: 'trainer_1',
          itemType: 'session',
          itemId: 'session_1',
          amount: 75.00,
          currency: 'USD',
          status: 'completed',
          paymentMethod: 'card',
          stripePaymentIntentId: 'pi_1_stripe',
          purchasedAt: new Date('2023-12-01')
        },
        {
          id: 'pur_2',
          userId,
          trainerId: 'trainer_2',
          itemType: 'content',
          itemId: 'content_1',
          amount: 49.99,
          currency: 'USD',
          status: 'completed',
          paymentMethod: 'card',
          stripePaymentIntentId: 'pi_2_stripe',
          purchasedAt: new Date('2023-11-28')
        }
      ];
    } catch (error) {
      throw new Error('Failed to fetch transaction history');
    }
  }

  // Validate card number using Luhn algorithm
  private validateCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  // Get card brand from number
  private getCardBrand(cardNumber: string): string {
    const number = cardNumber.replace(/\D/g, '');
    
    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    if (number.startsWith('6')) return 'discover';
    
    return 'unknown';
  }

  // Mock Stripe methods
  private mockCreatePaymentMethod = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      id: `pm_${Date.now()}`,
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025
      }
    };
  };

  private mockConfirmCardPayment = async (clientSecret: string, paymentMethod: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const success = Math.random() > 0.05; // 95% success rate
    
    if (success) {
      return {
        paymentIntent: {
          id: clientSecret.split('_secret')[0],
          status: 'succeeded'
        }
      };
    } else {
      return {
        error: {
          type: 'card_error',
          code: 'card_declined',
          message: 'Your card was declined.'
        }
      };
    }
  };

  private mockCreateToken = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      id: `tok_${Date.now()}`,
      type: 'card',
      card: {
        id: `card_${Date.now()}`,
        brand: this.getCardBrand(params.card.number),
        last4: params.card.number.slice(-4),
        exp_month: params.card.exp_month,
        exp_year: params.card.exp_year
      }
    };
  };

  // Platform fee calculation
  calculatePlatformFee(amount: number): number {
    const feePercentage = 0.15; // 15% platform fee
    return Math.round(amount * feePercentage * 100) / 100;
  }

  // Calculate trainer earnings after platform fee
  calculateTrainerEarnings(amount: number): number {
    const platformFee = this.calculatePlatformFee(amount);
    return amount - platformFee;
  }

  // Store payment intent for webhook processing
  private async storePaymentIntent(paymentIntent: PaymentIntent): Promise<void> {
    try {
      const key = 'payment_intents';
      const existing = localStorage.getItem(key);
      const intents: PaymentIntent[] = existing ? JSON.parse(existing) : [];
      intents.push(paymentIntent);
      localStorage.setItem(key, JSON.stringify(intents));
    } catch (error) {
      console.error('Failed to store payment intent:', error);
    }
  }

  // Process webhook events (mock implementation)
  async processWebhookEvent(event: StripeWebhookEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentCancellation(event.data.object);
          break;
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Failed to process webhook event:', error);
      throw error;
    }
  }

  private async handlePaymentSuccess(paymentIntent: any): Promise<void> {
    const metadata = paymentIntent.metadata;
    
    if (metadata.type === 'session_booking') {
      // Create training session record
      // In real implementation, this would update the database
      console.log('Session booking confirmed:', metadata);
    } else if (metadata.type === 'content_purchase') {
      // Grant access to content
      // In real implementation, this would update user permissions
      console.log('Content purchase confirmed:', metadata);
    }
    
    // Update trainer earnings
    const trainerEarnings = this.calculateTrainerEarnings(paymentIntent.amount / 100);
    await this.updateTrainerEarnings(metadata.trainer_id, trainerEarnings);
  }

  private async handlePaymentFailure(paymentIntent: any): Promise<void> {
    // Handle failed payment - send notifications, update records
    console.log('Payment failed:', paymentIntent.id);
  }

  private async handlePaymentCancellation(paymentIntent: any): Promise<void> {
    // Handle cancelled payment - clean up reservations
    console.log('Payment cancelled:', paymentIntent.id);
  }

  private async updateTrainerEarnings(trainerId: string, amount: number): Promise<void> {
    // In real implementation, this would update the trainer's earnings in the database
    console.log(`Updated earnings for trainer ${trainerId}: +$${amount}`);
  }

  // Validate payment before processing
  async validatePayment(itemId: string, userId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check if user has already purchased this item
      const purchases = await this.getTransactionHistory(userId);
      const existingPurchase = purchases.find(p => p.itemId === itemId && p.status === 'completed');
      
      if (existingPurchase) {
        return { valid: false, error: 'You have already purchased this item' };
      }
      
      // Additional validation logic would go here
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Validation failed' };
    }
  }

  // Get pricing information including discounts
  async getContentPricing(contentId: string, userId: string): Promise<{
    basePrice: number;
    discount: number;
    finalPrice: number;
    currency: string;
  }> {
    // Mock pricing logic - in real app would check for user discounts, coupons, etc.
    const basePrice = 49.99; // Would fetch from content data
    const discount = 0; // Would calculate based on user status, coupons, etc.
    
    return {
      basePrice,
      discount,
      finalPrice: basePrice - discount,
      currency: 'USD'
    };
  }

  // Format price with currency
  formatPrice(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  }

  // Format currency
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return this.formatPrice(amount, currency);
  }

  // Get supported payment methods for region
  getSupportedPaymentMethods(countryCode: string = 'US'): string[] {
    const supportedMethods: Record<string, string[]> = {
      'US': ['card', 'apple_pay', 'google_pay'],
      'GB': ['card', 'apple_pay', 'google_pay', 'bacs_debit'],
      'DE': ['card', 'sepa_debit', 'giropay'],
      'FR': ['card', 'sepa_debit'],
      'ES': ['card', 'sepa_debit'],
      'IT': ['card', 'sepa_debit'],
      'NL': ['card', 'sepa_debit', 'ideal'],
      'BE': ['card', 'sepa_debit', 'bancontact'],
      'AT': ['card', 'sepa_debit', 'eps'],
      'CH': ['card', 'sepa_debit'],
      'CA': ['card', 'apple_pay', 'google_pay'],
      'AU': ['card', 'apple_pay', 'google_pay', 'au_becs_debit'],
      'JP': ['card', 'apple_pay', 'google_pay'],
      'SG': ['card', 'apple_pay', 'google_pay', 'grabpay'],
      'MX': ['card', 'oxxo'],
      'BR': ['card', 'boleto'],
      'IN': ['card', 'upi'],
    };
    
    return supportedMethods[countryCode] || ['card'];
  }

  // Calculate processing fees
  calculateProcessingFee(amount: number, paymentMethod: string = 'card'): number {
    const fees: Record<string, number> = {
      'card': 0.029, // 2.9% + $0.30
      'apple_pay': 0.029,
      'google_pay': 0.029,
      'sepa_debit': 0.008, // 0.8%
      'ach': 0.008,
      'wire': 0.005 // 0.5%
    };
    
    const feePercentage = fees[paymentMethod] || 0.029;
    const fixedFee = paymentMethod === 'card' ? 0.30 : 0;
    
    return (amount * feePercentage) + fixedFee;
  }

  // Get payout schedule for trainer
  getPayoutSchedule(trainerId: string): {
    schedule: 'daily' | 'weekly' | 'monthly';
    nextPayout: Date;
    minimumAmount: number;
  } {
    // Mock implementation - would fetch from trainer settings
    return {
      schedule: 'weekly',
      nextPayout: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      minimumAmount: 25.00
    };
  }

  // Create payout for trainer
  async createPayout(trainerId: string, amount: number): Promise<{
    success: boolean;
    payoutId?: string;
    error?: string;
  }> {
    try {
      // Validate minimum payout amount
      const schedule = this.getPayoutSchedule(trainerId);
      if (amount < schedule.minimumAmount) {
        return {
          success: false,
          error: `Minimum payout amount is ${this.formatCurrency(schedule.minimumAmount)}`
        };
      }
      
      // Mock payout creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        payoutId: `po_${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create payout'
      };
    }
  }
}

export default new PaymentService();