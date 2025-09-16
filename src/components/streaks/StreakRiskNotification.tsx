/**
 * Streak Risk Notification Component
 * 
 * Shows notifications when streak is at risk with different urgency levels
 * and actionable suggestions to maintain the streak.
 */

import React from 'react';
import {
  AlertTriangle,
  Clock,
  Target,
  X,
  Zap,
  Calendar
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { StreakStats, StreakSchedule } from '@/types/streaks';

interface StreakRiskNotificationProps {
  riskLevel: 'low' | 'medium' | 'high';
  stats: StreakStats;
  schedule: StreakSchedule;
  onDismiss: () => void;
  onTakeAction: () => void;
  className?: string;
}

export const StreakRiskNotification: React.FC<StreakRiskNotificationProps> = ({
  riskLevel,
  stats,
  schedule,
  onDismiss,
  onTakeAction,
  className = ''
}) => {
  const getRiskConfig = () => {
    switch (riskLevel) {
      case 'high':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          title: '🚨 ¡Tu racha está en peligro!',
          message: `Tu racha de ${stats.currentStreak} días está a punto de romperse. ¡Entrena hoy para mantenerla!`,
          actionText: 'Entrenar Ahora',
          actionColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'medium':
        return {
          icon: <Clock className="w-6 h-6 text-orange-600" />,
          bgColor: 'bg-orange-50 border-orange-200',
          textColor: 'text-orange-800',
          title: '⚠️ Atención a tu racha',
          message: `Tu racha de ${stats.currentStreak} días necesita atención. Planifica tu próximo entrenamiento pronto.`,
          actionText: 'Ver Horario',
          actionColor: 'bg-orange-600 hover:bg-orange-700'
        };
      case 'low':
        return {
          icon: <Target className="w-6 h-6 text-yellow-600" />,
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          title: '💪 Mantén el momentum',
          message: `Estás por debajo de tu objetivo semanal. ¡Un entrenamiento más y estarás de vuelta en el camino!`,
          actionText: 'Ver Entrenamientos',
          actionColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      default:
        return {
          icon: <Zap className="w-6 h-6 text-blue-600" />,
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          title: '💪 Mantén el momentum',
          message: 'Sigue así con tu rutina de entrenamiento.',
          actionText: 'Continuar',
          actionColor: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const config = getRiskConfig();

  const getNextScheduledDay = () => {
    const today = new Date();
    const todayDay = today.getDay();
    
    // Find next scheduled day
    let nextDay = schedule.scheduledDays.find(day => day > todayDay);
    let daysToAdd = 0;
    
    if (nextDay !== undefined) {
      daysToAdd = nextDay - todayDay;
    } else {
      // Next week
      nextDay = schedule.scheduledDays[0];
      daysToAdd = 7 - todayDay + nextDay;
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    
    return nextDate;
  };

  const nextScheduled = getNextScheduledDay();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className={cn(
      'border rounded-lg p-4 shadow-sm',
      config.bgColor,
      className
    )}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={cn('text-sm font-semibold', config.textColor)}>
            {config.title}
          </h3>
          
          <p className={cn('text-sm mt-1', config.textColor)}>
            {config.message}
          </p>

          {/* Stats Summary */}
          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <div className="text-center">
              <div className={cn('font-semibold', config.textColor)}>
                {stats.currentStreak}
              </div>
              <div className="text-gray-600">Días actuales</div>
            </div>
            <div className="text-center">
              <div className={cn('font-semibold', config.textColor)}>
                {stats.missedDaysThisWeek}
              </div>
              <div className="text-gray-600">Perdidos esta semana</div>
            </div>
            <div className="text-center">
              <div className={cn('font-semibold', config.textColor)}>
                {schedule.targetDaysPerWeek}
              </div>
              <div className="text-gray-600">Objetivo semanal</div>
            </div>
          </div>

          {/* Next Scheduled */}
          {nextScheduled && (
            <div className="mt-3 flex items-center space-x-2 text-xs text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                Próximo entrenamiento: {dayNames[nextScheduled.getDay()]}{' '}
                {nextScheduled.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center space-x-3">
            <button
              onClick={onTakeAction}
              className={cn(
                'px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors',
                config.actionColor
              )}
            >
              {config.actionText}
            </button>
            
            <button
              onClick={onDismiss}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Recordar más tarde
            </button>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default StreakRiskNotification;