/**
 * Streak Special Days Manager Component
 * 
 * Allows users to mark sick days, vacation days, and manage their limited
 * usage with clear visual feedback and remaining day counters.
 */

import React, { useState } from 'react';
import {
  Heart,
  Plane,
  AlertTriangle,
  X,
  Info,
  Shield
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useStreakStore } from '@/stores/useStreakStore';
import type { StreakStats, StreakSchedule } from '@/types/streaks';

interface StreakSpecialDaysManagerProps {
  userId: string;
  stats: StreakStats;
  activeSchedule: StreakSchedule;
  onClose: () => void;
  className?: string;
}

interface SpecialDayRequest {
  date: string;
  type: 'sick' | 'vacation';
  notes: string;
}

export const StreakSpecialDaysManager: React.FC<StreakSpecialDaysManagerProps> = ({
  userId,
  stats,
  activeSchedule,
  onClose,
  className = ''
}) => {
  const { markSickDay, markVacationDay, isLoading } = useStreakStore();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedType, setSelectedType] = useState<'sick' | 'vacation'>('sick');
  const [notes, setNotes] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<SpecialDayRequest | null>(null);

  // Get current month for date picker
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM

  // Calculate usage for current month
  const currentMonthStr = today.toISOString().slice(0, 7);
  const sickDaysUsedThisMonth = 7 - stats.sickDaysAvailable; // Assuming max 7 per month
  const vacationDaysUsedThisMonth = 14 - stats.vacationDaysAvailable; // Assuming max 14 per month

  const maxSickDays = 7;
  const maxVacationDays = 14;

  // Handle date selection
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  // Handle type selection
  const handleTypeChange = (type: 'sick' | 'vacation') => {
    setSelectedType(type);
  };

  // Validate request
  const validateRequest = (): string | null => {
    if (!selectedDate) {
      return 'Selecciona una fecha';
    }

    const requestDate = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Can't mark future dates (except tomorrow for planning)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (requestDate > tomorrow) {
      return 'You can only mark days up to tomorrow';
    }

    // Can't mark dates too far in the past (max 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    if (requestDate < weekAgo) {
      return 'You cannot mark days from more than a week ago';
    }

    // Check limits
    if (selectedType === 'sick' && stats.sickDaysAvailable <= 0) {
      return 'You have used all your sick days for this month';
    }

    if (selectedType === 'vacation' && stats.vacationDaysAvailable <= 0) {
      return 'You have used all your vacation days for this month';
    }

    return null;
  };

  // Handle submit
  const handleSubmit = () => {
    const error = validateRequest();
    if (error) {
      // Show error toast or alert
      return;
    }

    const request: SpecialDayRequest = {
      date: selectedDate,
      type: selectedType,
      notes: notes.trim()
    };

    setPendingRequest(request);
    setShowConfirmation(true);
  };

  // Confirm and execute request
  const handleConfirm = async () => {
    if (!pendingRequest) return;

    try {
      let success = false;
      
      if (pendingRequest.type === 'sick') {
        success = await markSickDay(
          userId,
          pendingRequest.date,
          activeSchedule.id,
          pendingRequest.notes || undefined
        );
      } else {
        success = await markVacationDay(
          userId,
          pendingRequest.date,
          activeSchedule.id,
          pendingRequest.notes || undefined
        );
      }

      if (success) {
        // Reset form
        setSelectedDate('');
        setNotes('');
        setShowConfirmation(false);
        setPendingRequest(null);
        
        // Show success message
        // This could be a toast notification
      }
    } catch (error) {
      console.error('Error marking special day:', error);
    }
  };

  // Cancel confirmation
  const handleCancel = () => {
    setShowConfirmation(false);
    setPendingRequest(null);
  };

  const validationError = validateRequest();

  return (
    <div className={cn('bg-white rounded-xl shadow-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">
              Special Days
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <p className="text-purple-100 mt-2 text-sm">
          Mark sick days or vacation days to protect your streak
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Usage Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Heart className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Sick Days</h3>
                <p className="text-sm text-red-600">
                  {stats.sickDaysAvailable} of {maxSickDays} available this month
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-red-700 mb-1">
                <span>Usados: {sickDaysUsedThisMonth}</span>
                <span>Disponibles: {stats.sickDaysAvailable}</span>
              </div>
              <div className="w-full bg-red-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all"
                  style={{ width: `${(sickDaysUsedThisMonth / maxSickDays) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Plane className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-800">Vacation Days</h3>
                <p className="text-sm text-blue-600">
                  {stats.vacationDaysAvailable} of {maxVacationDays} available this month
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-blue-700 mb-1">
                <span>Usados: {vacationDaysUsedThisMonth}</span>
                <span>Disponibles: {stats.vacationDaysAvailable}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(vacationDaysUsedThisMonth / maxVacationDays) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Día Especial
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTypeChange('sick')}
                className={cn(
                  'p-4 border-2 rounded-lg transition-all text-left',
                  selectedType === 'sick'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-center space-x-3">
                  <Heart className={cn(
                    'w-5 h-5',
                    selectedType === 'sick' ? 'text-red-600' : 'text-gray-400'
                  )} />
                  <div>
                    <h4 className={cn(
                      'font-medium',
                      selectedType === 'sick' ? 'text-red-800' : 'text-gray-700'
                    )}>
                      Día de Enfermedad
                    </h4>
                    <p className="text-xs text-gray-600">
                      Para cuando estás enfermo o lesionado
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTypeChange('vacation')}
                className={cn(
                  'p-4 border-2 rounded-lg transition-all text-left',
                  selectedType === 'vacation'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-center space-x-3">
                  <Plane className={cn(
                    'w-5 h-5',
                    selectedType === 'vacation' ? 'text-blue-600' : 'text-gray-400'
                  )} />
                  <div>
                    <h4 className={cn(
                      'font-medium',
                      selectedType === 'vacation' ? 'text-blue-800' : 'text-gray-700'
                    )}>
                      Vacation Day
                    </h4>
                    <p className="text-xs text-gray-600">
                      Para vacaciones o descanso planificado
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              max={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                selectedType === 'sick' 
                  ? 'Ej: Gripe, dolor de espalda, etc.'
                  : 'Ej: Viaje familiar, vacaciones de verano, etc.'
              }
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">{validationError}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!!validationError || isLoading}
            className={cn(
              'w-full py-3 px-4 rounded-lg font-medium transition-all',
              validationError || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : selectedType === 'sick'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Procesando...</span>
              </div>
            ) : (
              `Mark as ${selectedType === 'sick' ? 'Sick Day' : 'Vacation Day'}`
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Información importante:</p>
              <ul className="space-y-1 text-amber-700">
                <li>• Special days protect your streak without breaking it</li>
                <li>• Limits reset each month</li>
                <li>• You can only mark days up to a week ago</li>
                <li>• Use these days responsibly to maintain system integrity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && pendingRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4',
                  pendingRequest.type === 'sick' ? 'bg-red-100' : 'bg-blue-100'
                )}>
                  {pendingRequest.type === 'sick' ? (
                    <Heart className="w-6 h-6 text-red-600" />
                  ) : (
                    <Plane className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirm {pendingRequest.type === 'sick' ? 'Sick Day' : 'Vacation Day'}
                </h3>
                
                <p className="text-gray-600 mb-4">
                  ¿Estás seguro de que quieres marcar el{' '}
                  <span className="font-medium">
                    {new Date(pendingRequest.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>{' '}
                  as {pendingRequest.type === 'sick' ? 'sick day' : 'vacation day'}?
                </p>

                {pendingRequest.notes && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 text-left">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Notes:</span> {pendingRequest.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 py-2 px-4 text-white rounded-lg transition-colors',
                      pendingRequest.type === 'sick'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700',
                      isLoading && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {isLoading ? 'Procesando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakSpecialDaysManager;