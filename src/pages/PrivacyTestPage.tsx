/**
 * Privacy Test Page
 * 
 * Test page for demonstrating the privacy system components and functionality.
 */

import React, { useState } from 'react';
import { 
  Shield, 
  Settings, 
  UserX, 
  Flag,
  Eye,
  Lock,
  Users
} from 'lucide-react';
import { PrivacySettings } from '@/components/privacy/PrivacySettings';
import { BlockedUsersList } from '@/components/privacy/BlockedUsersList';
import { ReportUserModal } from '@/components/privacy/ReportUserModal';
import { usePrivacy } from '@/hooks/usePrivacy';

const TEST_USER_ID = 'test-user-privacy';

export const PrivacyTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'blocked' | 'reports'>('settings');
  const [showReportModal, setShowReportModal] = useState(false);

  const {
    privacySettings,
    privacySummary,
    isLoading
  } = usePrivacy(TEST_USER_ID);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando sistema de privacidad...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { 
      id: 'settings', 
      label: 'Configuración', 
      icon: Settings, 
      description: 'Configurar privacidad y visibilidad'
    },
    { 
      id: 'blocked', 
      label: 'Usuarios Bloqueados', 
      icon: UserX, 
      count: privacySummary?.blockedUsersCount || 0,
      description: 'Gestionar usuarios bloqueados'
    },
    { 
      id: 'reports', 
      label: 'Reportes', 
      icon: Flag, 
      count: privacySummary?.reportsCount || 0,
      description: 'Historial de reportes enviados'
    }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Shield className="w-8 h-8 text-blue-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Sistema de Privacidad
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Controla tu privacidad y seguridad en la plataforma
                  </p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Flag className="w-4 h-4" />
                  <span>Reportar Usuario</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Status Overview */}
      {privacySettings && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  privacySettings.profileVisibility === 'public' 
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                    : privacySettings.profileVisibility === 'friends'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {privacySettings.profileVisibility === 'public' ? <Eye className="w-4 h-4" /> :
                   privacySettings.profileVisibility === 'friends' ? <Users className="w-4 h-4" /> :
                   <Lock className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Perfil</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {privacySettings.profileVisibility === 'public' ? 'Público' :
                     privacySettings.profileVisibility === 'friends' ? 'Solo amigos' : 'Privado'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  privacySettings.allowFriendRequests
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Solicitudes</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {privacySettings.allowFriendRequests ? 'Permitidas' : 'Bloqueadas'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  privacySettings.showInSearch
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Búsquedas</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {privacySettings.showInSearch ? 'Visible' : 'Oculto'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Seguridad</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {(privacySummary?.blockedUsersCount || 0)} bloqueados
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors relative flex items-center space-x-2
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 text-xs px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div key={activeTab}>
          {activeTab === 'settings' && (
            <PrivacySettings userId={TEST_USER_ID} />
          )}

          {activeTab === 'blocked' && (
            <BlockedUsersList userId={TEST_USER_ID} />
          )}

          {activeTab === 'reports' && (
            <div className="text-center py-12">
              <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Historial de Reportes
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Aquí aparecerán los reportes que hayas enviado
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {privacySummary?.reportsCount || 0} reporte{(privacySummary?.reportsCount || 0) !== 1 ? 's' : ''} enviado{(privacySummary?.reportsCount || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Report User Modal */}
      <ReportUserModal
        userId={TEST_USER_ID}
        reportedUserId="example-user-123"
        reportedUserName="Usuario de Ejemplo"
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReported={() => {
          console.log('Usuario reportado exitosamente');
        }}
      />

      {/* Debug Panel */}
      <div className="fixed bottom-4 right-4">
        <details className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            Debug Info
          </summary>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs space-y-2 max-w-xs">
            <div>
              <strong>Profile Visibility:</strong> {privacySettings?.profileVisibility || 'Loading...'}
            </div>
            <div>
              <strong>Friend Requests:</strong> {privacySettings?.allowFriendRequests ? 'Allowed' : 'Blocked'}
            </div>
            <div>
              <strong>Show in Search:</strong> {privacySettings?.showInSearch ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Blocked Users:</strong> {privacySummary?.blockedUsersCount || 0}
            </div>
            <div>
              <strong>Reports Sent:</strong> {privacySummary?.reportsCount || 0}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default PrivacyTestPage;