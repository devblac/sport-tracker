/**
 * Streak Shield Manager Component
 * 
 * Allows users to view and activate streak protection shields.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStreakRewards } from '@/hooks/useStreakRewards';

interface StreakShieldManagerProps {
  userId: string;
  className?: string;
  onShieldUsed?: (shieldName: string) => void;
}

export const StreakShieldManager: React.FC<StreakShieldManagerProps> = ({
  userId,
  className = '',
  onShieldUsed
}) => {
  const {
    availableShields,
    activeShields,
    useShield,
    isLoading
  } = useStreakRewards(userId);

  const [usingShield, setUsingShield] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUseShield = async (shieldId: string, shieldName: string) => {
    setUsingShield(shieldId);
    setMessage(null);

    try {
      const result = await useShield(shieldId);
      
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });

      if (result.success && onShieldUsed) {
        onShieldUsed(shieldName);
      }

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error al activar el escudo'
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setUsingShield(null);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 text-gray-700';
      case 'uncommon': return 'border-green-300 text-green-700';
      case 'rare': return 'border-blue-300 text-blue-700';
      case 'epic': return 'border-purple-300 text-purple-700';
      case 'legendary': return 'border-yellow-300 text-yellow-700';
      case 'mythic': return 'border-red-300 text-red-700';
      default: return 'border-gray-300 text-gray-700';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-50 dark:bg-gray-800';
      case 'uncommon': return 'bg-green-50 dark:bg-green-900/20';
      case 'rare': return 'bg-blue-50 dark:bg-blue-900/20';
      case 'epic': return 'bg-purple-50 dark:bg-purple-900/20';
      case 'legendary': return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'mythic': return 'bg-red-50 dark:bg-red-900/20';
      default: return 'bg-gray-50 dark:bg-gray-800';
    }
  };

  const getShieldTypeIcon = (type: string) => {
    switch (type) {
      case 'freeze': return '❄️';
      case 'compensation': return '⏰';
      case 'grace': return '🕊️';
      case 'protection': return '🛡️';
      default: return '🛡️';
    }
  };

  const getShieldTypeDescription = (type: string) => {
    switch (type) {
      case 'freeze': return 'Congela tu racha temporalmente';
      case 'compensation': return 'Permite compensar días perdidos';
      case 'grace': return 'Período de gracia extendido';
      case 'protection': return 'Protección completa de la racha';
      default: return 'Protección de racha';
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 dark:bg-gray-700 h-24 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Message Display */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Shields */}
      {activeShields.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <span className="mr-2">🛡️</span>
            Escudos Activos
          </h3>
          <div className="space-y-2">
            {activeShields.map((shield) => (
              <motion.div
                key={shield.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-lg border-2 ${getRarityColor(shield.rarity)} ${getRarityBg(shield.rarity)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getShieldTypeIcon(shield.type)}</span>
                    <div>
                      <h4 className="font-semibold">{shield.name}</h4>
                      <p className="text-sm opacity-75">{getShieldTypeDescription(shield.type)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {shield.expiresAt && (
                        <>
                          Expira: {new Date(shield.expiresAt).toLocaleDateString()}
                        </>
                      )}
                    </div>
                    <div className="text-xs opacity-75">
                      {shield.usesRemaining} usos restantes
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Available Shields */}
      {availableShields.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <span className="mr-2">📦</span>
            Escudos Disponibles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableShields.map((shield) => (
              <motion.div
                key={shield.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${getRarityColor(shield.rarity)} ${getRarityBg(shield.rarity)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{getShieldTypeIcon(shield.type)}</span>
                    <div>
                      <h4 className="font-semibold">{shield.name}</h4>
                      <p className="text-xs opacity-75 capitalize">{shield.rarity}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{shield.duration} días</div>
                    <div className="text-xs opacity-75">{shield.uses} usos</div>
                  </div>
                </div>

                <p className="text-sm mb-3 opacity-90">{shield.description}</p>
                <p className="text-xs mb-4 opacity-75">{getShieldTypeDescription(shield.type)}</p>

                <button
                  onClick={() => handleUseShield(shield.id, shield.name)}
                  disabled={usingShield === shield.id}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                    usingShield === shield.id
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-current text-white hover:opacity-90 active:scale-95'
                  }`}
                >
                  {usingShield === shield.id ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Activando...</span>
                    </div>
                  ) : (
                    'Activar Escudo'
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* No Shields Available */}
      {availableShields.length === 0 && activeShields.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🛡️</div>
          <h3 className="text-lg font-semibold mb-2">No tienes escudos disponibles</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Mantén tu racha para desbloquear escudos de protección
          </p>
        </div>
      )}

      {/* Shield Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          ℹ️ ¿Cómo funcionan los escudos?
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• <strong>Protección:</strong> Mantiene tu racha aunque faltes un día</li>
          <li>• <strong>Congelación:</strong> Pausa tu racha temporalmente</li>
          <li>• <strong>Compensación:</strong> Permite recuperar días perdidos</li>
          <li>• <strong>Gracia:</strong> Extiende el período de gracia para entrenar</li>
        </ul>
      </div>
    </div>
  );
};

export default StreakShieldManager;