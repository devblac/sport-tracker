/**
 * Share Modal Component
 * 
 * Modal for sharing content to various social media platforms.
 */

import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Download, 
  Check,
  ExternalLink,
  Palette,
  MessageSquare
} from 'lucide-react';
import { shareableContentService } from '@/services/ShareableContentService';

import type { 
  ShareableContent, 
  SharePlatform, 
  ShareOptions,
  CardTemplate,
  SHARE_PLATFORMS 
} from '@/types/shareableContent';

interface ShareModalProps {
  content: ShareableContent | null;
  isOpen: boolean;
  onClose: () => void;
  onTemplateChange?: (templateName: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  content,
  isOpen,
  onClose,
  onTemplateChange
}) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<SharePlatform[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [hashtags, setHashtags] = useState<string[]>(['fitness', 'workout', 'progress']);
  const [includeAppBranding, setIncludeAppBranding] = useState(true);
  const [includeUserInfo, setIncludeUserInfo] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [shareResults, setShareResults] = useState<Map<SharePlatform, boolean>>(new Map());
  const [availableTemplates, setAvailableTemplates] = useState<CardTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  React.useEffect(() => {
    if (content) {
      const templates = shareableContentService.getTemplatesForType(content.type);
      setAvailableTemplates(templates);
      setSelectedTemplate(content.template);
      setCustomMessage(content.description);
    }
  }, [content]);

  if (!isOpen || !content) return null;

  const platforms = shareableContentService.getSupportedPlatforms();
  const platformConfigs = SHARE_PLATFORMS;

  const handlePlatformToggle = (platform: SharePlatform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleHashtagAdd = (hashtag: string) => {
    if (hashtag.trim() && !hashtags.includes(hashtag.trim())) {
      setHashtags(prev => [...prev, hashtag.trim()]);
    }
  };

  const handleHashtagRemove = (hashtag: string) => {
    setHashtags(prev => prev.filter(h => h !== hashtag));
  };

  const handleShare = async () => {
    if (selectedPlatforms.length === 0) return;

    setIsSharing(true);
    const results = new Map<SharePlatform, boolean>();

    const shareOptions: ShareOptions = {
      platform: selectedPlatforms[0], // Will be overridden in loop
      includeAppBranding,
      includeUserInfo,
      customMessage: customMessage.trim() || undefined,
      hashtags: hashtags.length > 0 ? hashtags : undefined
    };

    for (const platform of selectedPlatforms) {
      try {
        const result = await shareableContentService.shareContent(content.id, {
          ...shareOptions,
          platform
        });
        results.set(platform, result.success);
      } catch (error) {
        results.set(platform, false);
      }
    }

    setShareResults(results);
    setIsSharing(false);

    // Auto-close after successful shares
    if (Array.from(results.values()).every(success => success)) {
      setTimeout(() => {
        onClose();
        setShareResults(new Map());
      }, 2000);
    }
  };

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    onTemplateChange?.(templateName);
  };

  const getSharePreviewText = () => {
    let text = customMessage || content.description;
    
    if (includeAppBranding) {
      text += '\n\n🏋️ Compartido desde FitnessApp';
    }

    if (hashtags.length > 0) {
      text += '\n\n' + hashtags.map(tag => `#${tag}`).join(' ');
    }

    return text;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Share2 className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Compartir Contenido
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {content.title}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Template Selection */}
          {availableTemplates.length > 1 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <Palette className="w-4 h-4 mr-2" />
                Plantilla
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {availableTemplates.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => handleTemplateChange(template.name)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      selectedTemplate === template.name
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div 
                      className="w-full h-8 rounded mb-2"
                      style={{ backgroundColor: template.backgroundColor }}
                    />
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Platform Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Plataformas
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {platforms.map((platform) => {
                const config = platformConfigs[platform];
                const isSelected = selectedPlatforms.includes(platform);
                const shareResult = shareResults.get(platform);
                
                return (
                  <button
                    key={platform}
                    onClick={() => handlePlatformToggle(platform)}
                    disabled={isSharing}
                    className={`p-3 rounded-lg border-2 transition-colors relative ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${isSharing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-2xl mb-1">{config.icon}</div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {config.name}
                    </p>
                    
                    {shareResult !== undefined && (
                      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                        shareResult ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {shareResult ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <X className="w-3 h-3 text-white" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Mensaje Personalizado
            </h3>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Escribe un mensaje personalizado..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Hashtags */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Hashtags
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {hashtags.map((hashtag) => (
                <span
                  key={hashtag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                >
                  #{hashtag}
                  <button
                    onClick={() => handleHashtagRemove(hashtag)}
                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Agregar hashtag..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleHashtagAdd(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Opciones
            </h3>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeAppBranding}
                onChange={(e) => setIncludeAppBranding(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Incluir marca de la app
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeUserInfo}
                onChange={(e) => setIncludeUserInfo(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Incluir información del usuario
              </span>
            </label>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Vista Previa
            </h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {getSharePreviewText()}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedPlatforms.length} plataforma{selectedPlatforms.length !== 1 ? 's' : ''} seleccionada{selectedPlatforms.length !== 1 ? 's' : ''}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleShare}
              disabled={selectedPlatforms.length === 0 || isSharing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSharing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Compartiendo...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Compartir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;