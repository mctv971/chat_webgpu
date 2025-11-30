import React, { useState, useRef, useEffect } from 'react';
import { ModelConfig } from '../types/models';

interface ModelSelectorProps {
  selectedModel: ModelConfig | null;
  availableModels: ModelConfig[];
  onSelectModel: (model: ModelConfig) => void;
  isLoading?: boolean;
  isGenerating?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  availableModels,
  onSelectModel,
  isLoading = false,
  isGenerating = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleSelectModel = (model: ModelConfig) => {
    onSelectModel(model);
    setIsDropdownOpen(false);
  };

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'Ultra-rapide': return 'text-green-600';
      case 'Très rapide': return 'text-emerald-600';
      case 'Rapide': return 'text-blue-600';
      case 'Moyen': return 'text-yellow-600';
      case 'Lent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Exceptionnel': return 'text-purple-600';
      case 'Excellent': return 'text-green-600';
      case 'Bon': return 'text-blue-600';
      case 'Basique': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton de sélection */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isLoading || isGenerating}
        className={`flex items-center gap-3 px-4 py-2 text-sm rounded-lg border transition-all duration-200 ${
          selectedModel
            ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        } ${(isLoading || isGenerating) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={selectedModel ? `Modèle: ${selectedModel.name}` : 'Sélectionner un modèle'}
      >
        {/* Icône de modèle */}
        <div className="w-6 h-6 rounded border-2 border-current flex items-center justify-center">
          <div className="w-2 h-2 bg-current rounded-full"></div>
        </div>
        
        <div className="flex-1 text-left min-w-0">
          {selectedModel ? (
            <>
              <div className="font-medium truncate">{selectedModel.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedModel.size} • {selectedModel.speed}
              </div>
            </>
          ) : (
            <span className="text-gray-700 dark:text-gray-300">Sélectionner un modèle</span>
          )}
        </div>
        
        <svg 
          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Sélectionner un modèle IA</div>
            
            <div className="space-y-2">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleSelectModel(model)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedModel?.id === model.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{model.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {model.description}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                          {model.size}
                        </span>
                        <span className={`font-medium ${getSpeedColor(model.speed)}`}>
                          {model.speed}
                        </span>
                        <span className={`font-medium ${getQualityColor(model.quality)}`}>
                          {model.quality}
                        </span>
                      </div>
                    </div>
                    
                    {selectedModel?.id === model.id && (
                      <div className="ml-2">
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-400">
              💡 Le modèle peut être changé à tout moment pendant la conversation
            </div>
          </div>
        </div>
      )}
    </div>
  );
};