/**
 * Blocked Users List Component
 * 
 * Interface for viewing and managing blocked users.
 */

import React, { useState } from 'react';
import { 
  Shield, 
  UserX, 
  Search, 
  Calendar,
  AlertTriangle,
  Trash2,
  Eye
} from 'lucide-react';
import { usePrivacy } from '@/hooks/usePrivacy';

interface BlockedUsersListProps {
  userId: string;
  className?: string;
}

export const BlockedUsersList: React.FC<BlockedUsersListProps> = ({
  userId,
  className = ''
}) => {
  const {
    blockedUsers,
    unblockUser,
    isLoading,
    error
  } = usePrivacy(userId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleUnblockUser = async (blockedUserId: string) => {
    if (!confirm('¿Estás seguro de que quieres desbloquear a este usuario?')) {
      return;
    }

    try {
      await unblockUser(blockedUserId);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to unblock user:', error);
    }
  };

  // Filter blocked users by search query
  const filteredUsers = blockedUsers.filter(blockedUser => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    // Note: In a real app, you'd need to fetch user details for the blocked user ID
    return blockedUser.blockedUserId.toLowerCase().includes(query) ||
           blockedUser.reason?.toLowerCase().includes(query);
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-20 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Shield className="w-6 h-6 text-red-500" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Usuarios Bloqueados
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {blockedUsers.length} usuario{blockedUsers.length !== 1 ? 's' : ''} bloqueado{blockedUsers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Search */}
      {blockedUsers.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar usuarios bloqueados..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Blocked Users List */}
      {filteredUsers.length > 0 ? (
        <div className="space-y-3">
          {filteredUsers.map((blockedUser) => (
            <div
              key={blockedUser.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Avatar Placeholder */}
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>

                  {/* User Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Usuario Bloqueado
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {blockedUser.blockedUserId}
                    </p>
                    
                    {blockedUser.reason && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                          {blockedUser.reason}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>Bloqueado el {formatDate(blockedUser.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedUser(selectedUser === blockedUser.id ? null : blockedUser.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Ver detalles"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => handleUnblockUser(blockedUser.blockedUserId)}
                    className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                    title="Desbloquear usuario"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedUser === blockedUser.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">ID del usuario:</span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {blockedUser.blockedUserId}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Fecha de bloqueo:</span>
                      <span className="text-gray-900 dark:text-white">
                        {formatDate(blockedUser.createdAt)}
                      </span>
                    </div>
                    
                    {blockedUser.reason && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Motivo:</span>
                        <span className="text-gray-900 dark:text-white">
                          {blockedUser.reason}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleUnblockUser(blockedUser.blockedUserId)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Desbloquear Usuario
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          {searchQuery.trim() ? (
            <>
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron usuarios
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Intenta con diferentes términos de búsqueda
              </p>
            </>
          ) : (
            <>
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay usuarios bloqueados
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Los usuarios que bloquees aparecerán aquí
              </p>
            </>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Sobre el bloqueo de usuarios:</p>
            <ul className="space-y-1 text-xs">
              <li>• Los usuarios bloqueados no pueden ver tu perfil ni contenido</li>
              <li>• No pueden enviarte solicitudes de amistad ni mensajes</li>
              <li>• No aparecerán en tus búsquedas ni sugerencias</li>
              <li>• Puedes desbloquear usuarios en cualquier momento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockedUsersList;