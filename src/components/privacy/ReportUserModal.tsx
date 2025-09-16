/**
 * Report User Modal Component
 * 
 * Modal interface for reporting inappropriate users or content.
 */

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  X, 
  Flag, 
  MessageSquare,
  User,
  AlertTriangle as Spam,
  Shield
} from 'lucide-react';
import { usePrivacy } from '@/hooks/usePrivacy';

import type { ReportReason } from '@/types/privacy';

interface ReportUserModalProps {
  userId: string;
  reportedUserId: string;
  reportedUserName: string;
  isOpen: boolean;
  onClose: () => void;
  onReported?: () => void;
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  userId,
  reportedUserId,
  reportedUserName,
  isOpen,
  onClose,
  onReported
}) => {
  const { reportUser } = usePrivacy(userId);
  
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportReasons: { value: ReportReason; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value: 'spam',
      label: 'Spam',
      description: 'Contenido repetitivo, no deseado o promocional',
      icon: <Spam className="w-5 h-5" />
    },
    {
      value: 'harassment',
      label: 'Acoso',
      description: 'Comportamiento abusivo, intimidación o acoso',
      icon: <AlertTriangle className="w-5 h-5" />
    },
    {
      value: 'inappropriate_content',
      label: 'Contenido Inapropiado',
      description: 'Contenido ofensivo, explícito o inapropiado',
      icon: <Flag className="w-5 h-5" />
    },
    {
      value: 'fake_profile',
      label: 'Perfil Falso',
      description: 'Perfil que suplanta identidad o información falsa',
      icon: <User className="w-5 h-5" />
    },
    {
      value: 'other',
      label: 'Otro',
      description: 'Otro motivo no listado arriba',
      icon: <MessageSquare className="w-5 h-5" />
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      setError('Por favor selecciona un motivo para el reporte');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      await reportUser(
        reportedUserId,
        selectedReason,
        description.trim() || undefined
      );
      
      onReported?.();
      onClose();
      
      // Reset form
      setSelectedReason(null);
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el reporte');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    
    setSelectedReason(null);
    setDescription('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-red-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reportar Usuario
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {reportedUserName}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              ¿Por qué estás reportando a este usuario? *
            </label>
            
            <div className="space-y-2">
              {reportReasons.map((reason) => (
                <label
                  key={reason.value}
                  className={`
                    flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${selectedReason === reason.value
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value as ReportReason)}
                    className="mt-1 text-red-600 focus:ring-red-500"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={selectedReason === reason.value ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}>
                        {reason.icon}
                      </span>
                      <span className={`font-medium ${selectedReason === reason.value ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-white'}`}>
                        {reason.label}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${selectedReason === reason.value ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-400'}`}>
                      {reason.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Descripción adicional (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Proporciona más detalles sobre el problema..."
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
              {description.length}/500 caracteres
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Importante:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Los reportes falsos pueden resultar en acciones contra tu cuenta</li>
                  <li>• Revisaremos tu reporte y tomaremos las medidas apropiadas</li>
                  <li>• No compartiremos tu identidad con el usuario reportado</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={!selectedReason || isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportUserModal;