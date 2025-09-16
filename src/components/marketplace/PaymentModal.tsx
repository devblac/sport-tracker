// ============================================================================
// PAYMENT MODAL
// ============================================================================
// Modal for handling Stripe payments for marketplace content and sessions
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import useMarketplaceStore from '@/stores/useMarketplaceStore';
import paymentService from '@/services/paymentService';
import type { PremiumContent, TrainerProfile, PaymentMethod } from '@/types/marketplace';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PremiumContent | TrainerProfile | null;
  itemType: 'content' | 'session';
  sessionData?: {
    date: string;
    timeSlot: string;
    duration: number;
  };
  onSuccess?: (purchaseId: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  item,
  itemType,
  sessionData,
  onSuccess
}) => {
  const [step, setStep] = useState<'payment_method' | 'processing' | 'success' | 'error'>('payment_method');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [newCardData, setNewCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [useNewCard, setUseNewCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const { paymentMethods, addPaymentMethod, purchaseContent, bookSession } = useMarketplaceStore();

  useEffect(() => {
    if (isOpen) {
      setStep('payment_method');
      setError(null);
      setProcessing(false);
      if (paymentMethods.length > 0 && !useNewCard) {
        setSelectedPaymentMethod(paymentMethods.find(pm => pm.isDefault)?.id || paymentMethods[0].id);
      }
    }
  }, [isOpen, paymentMethods, useNewCard]);

  if (!isOpen || !item) return null;

  const calculateTotal = () => {
    if (itemType === 'content') {
      return (item as PremiumContent).price;
    } else {
      const trainer = item as TrainerProfile;
      const duration = sessionData?.duration || 60;
      return trainer.hourlyRate * (duration / 60);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const handleCardInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'number') {
      // Format card number with spaces
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) return; // Max 16 digits + 3 spaces
    } else if (field === 'expiry') {
      // Format expiry as MM/YY
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      if (formattedValue.length > 5) return;
    } else if (field === 'cvc') {
      // Only allow numbers, max 4 digits
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 4) return;
    }

    setNewCardData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const validateCardData = () => {
    const { number, expiry, cvc, name } = newCardData;
    
    if (!name.trim()) return 'Cardholder name is required';
    if (number.replace(/\s/g, '').length < 13) return 'Invalid card number';
    if (expiry.length !== 5) return 'Invalid expiry date';
    if (cvc.length < 3) return 'Invalid CVC';
    
    // Validate expiry date
    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (parseInt(month) < 1 || parseInt(month) > 12) return 'Invalid month';
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      return 'Card has expired';
    }
    
    return null;
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      let paymentMethodId = selectedPaymentMethod;

      // Add new card if needed
      if (useNewCard) {
        const validationError = validateCardData();
        if (validationError) {
          setError(validationError);
          setProcessing(false);
          return;
        }

        const [month, year] = newCardData.expiry.split('/');
        const newPaymentMethod = await addPaymentMethod({
          type: 'card',
          isDefault: paymentMethods.length === 0,
          cardLast4: newCardData.number.slice(-4),
          cardBrand: getCardBrand(newCardData.number),
          expiryMonth: parseInt(month),
          expiryYear: 2000 + parseInt(year)
        });
        
        paymentMethodId = newPaymentMethod.id;
      }

      setStep('processing');

      // Process payment based on item type
      if (itemType === 'content') {
        await purchaseContent(item.id, paymentMethodId);
      } else {
        if (!sessionData) {
          throw new Error('Session data is required for booking');
        }
        
        await bookSession({
          trainerId: item.id,
          sessionType: 'one_on_one',
          date: sessionData.date,
          timeSlot: sessionData.timeSlot,
          duration: sessionData.duration,
          paymentMethodId
        });
      }

      setStep('success');
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.('purchase_' + Date.now());
        onClose();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setStep('error');
      setProcessing(false);
    }
  };

  const getCardBrand = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return 'visa';
    if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) return 'mastercard';
    if (cleanNumber.startsWith('3')) return 'amex';
    return 'unknown';
  };

  const renderPaymentMethodStep = () => (
    <div className="space-y-6">
      {/* Item Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex items-start space-x-4">
          <img
            src={itemType === 'content' 
              ? (item as PremiumContent).previewImages?.[0] || '/default-content.png'
              : (item as TrainerProfile).profileImage || '/default-avatar.png'
            }
            alt={itemType === 'content' ? (item as PremiumContent).title : (item as TrainerProfile).displayName}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {itemType === 'content' 
                ? (item as PremiumContent).title 
                : `Session with ${(item as TrainerProfile).displayName}`
              }
            </h3>
            {itemType === 'session' && sessionData && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {sessionData.date} at {sessionData.timeSlot} • {sessionData.duration} minutes
              </p>
            )}
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(calculateTotal(), item.currency || 'USD')}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Payment Method</h4>
        
        {/* Existing Payment Methods */}
        {paymentMethods.length > 0 && !useNewCard && (
          <div className="space-y-2 mb-4">
            {paymentMethods.map((pm) => (
              <label
                key={pm.id}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPaymentMethod === pm.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={pm.id}
                  checked={selectedPaymentMethod === pm.id}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <CreditCard className="w-5 h-5 mr-3 text-gray-400" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium capitalize">{pm.cardBrand}</span>
                    <span className="text-gray-600 dark:text-gray-300">•••• {pm.cardLast4}</span>
                    {pm.isDefault && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Expires {pm.expiryMonth?.toString().padStart(2, '0')}/{pm.expiryYear?.toString().slice(-2)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Add New Card Option */}
        <button
          onClick={() => setUseNewCard(!useNewCard)}
          className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          {useNewCard ? 'Use existing card' : 'Add new card'}
        </button>

        {/* New Card Form */}
        {useNewCard && (
          <div className="space-y-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                value={newCardData.name}
                onChange={(e) => handleCardInputChange('name', e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Card Number
              </label>
              <input
                type="text"
                value={newCardData.number}
                onChange={(e) => handleCardInputChange('number', e.target.value)}
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={newCardData.expiry}
                  onChange={(e) => handleCardInputChange('expiry', e.target.value)}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CVC
                </label>
                <input
                  type="text"
                  value={newCardData.cvc}
                  onChange={(e) => handleCardInputChange('cvc', e.target.value)}
                  placeholder="123"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
        <Lock className="w-4 h-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Processing Payment
      </h3>
      <p className="text-gray-600 dark:text-gray-300">
        Please wait while we process your payment...
      </p>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center py-8">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Payment Successful!
      </h3>
      <p className="text-gray-600 dark:text-gray-300">
        {itemType === 'content' 
          ? 'You now have access to this content'
          : 'Your session has been booked successfully'
        }
      </p>
    </div>
  );

  const renderErrorStep = () => (
    <div className="text-center py-8">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Payment Failed
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {error || 'Something went wrong with your payment'}
      </p>
      <button
        onClick={() => setStep('payment_method')}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {step === 'payment_method' ? 'Complete Purchase' : 
             step === 'processing' ? 'Processing' :
             step === 'success' ? 'Success' : 'Error'}
          </h2>
          <button
            onClick={onClose}
            disabled={processing}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'payment_method' && renderPaymentMethodStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'success' && renderSuccessStep()}
          {step === 'error' && renderErrorStep()}
        </div>

        {/* Footer */}
        {step === 'payment_method' && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={processing || (!selectedPaymentMethod && !useNewCard)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Pay {formatCurrency(calculateTotal(), item.currency || 'USD')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;