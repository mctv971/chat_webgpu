import React, { useState, useRef, useEffect } from 'react';
import { KnowledgeBase } from '../types/models';

interface RAGControlsProps {
  isEnabled: boolean;
  selectedKnowledgeBase: { id: string; name: string } | null;
  knowledgeBases: KnowledgeBase[];
  onToggleRAG: (enabled: boolean) => void;
  onSelectKnowledgeBase: (id: string | null, name: string | null) => void;
  isLoading?: boolean;
}

export const RAGControls: React.FC<RAGControlsProps> = ({
  isEnabled,
  selectedKnowledgeBase,
  knowledgeBases,
  onToggleRAG,
  onSelectKnowledgeBase,
  isLoading = false,
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

  const handleToggleRAG = () => {
    if (!isEnabled && knowledgeBases.length === 0) {
      alert('Aucune base de connaissances disponible. Créez-en une d\'abord dans l\'onglet Knowledge.');
      return;
    }
    
    if (!isEnabled && !selectedKnowledgeBase && knowledgeBases.length > 0) {
      // Auto-select the first knowledge base when enabling RAG
      onSelectKnowledgeBase(knowledgeBases[0].id, knowledgeBases[0].name);
    }
    
    onToggleRAG(!isEnabled);
  };

  const handleSelectKnowledgeBase = (kb: KnowledgeBase) => {
    onSelectKnowledgeBase(kb.id, kb.name);
    setIsDropdownOpen(false);
  };

  const handleDisableKnowledgeBase = () => {
    onSelectKnowledgeBase(null, null);
    onToggleRAG(false);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* RAG Toggle Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isLoading}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
          isEnabled
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={isEnabled ? 'RAG activé - Cliquez pour configurer' : 'RAG désactivé - Cliquez pour activer'}
      >
        <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span className="font-medium">RAG</span>
        {isEnabled && selectedKnowledgeBase && (
          <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded border dark:border-gray-600 max-w-32 truncate">
            {selectedKnowledgeBase.name}
          </span>
        )}
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
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Configuration RAG</h3>
              <button
                onClick={handleToggleRAG}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  isEnabled 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {isEnabled ? 'Désactiver' : 'Activer'}
              </button>
            </div>

            {knowledgeBases.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                <div className="mb-2">Aucune base de connaissances</div>
                <div className="text-xs">Créez-en une dans l'onglet Knowledge</div>
              </div>
            ) : (
              <>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Base de connaissances ({knowledgeBases.length} disponibles)
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {knowledgeBases.map((kb) => (
                    <button
                      key={kb.id}
                      onClick={() => handleSelectKnowledgeBase(kb)}
                      className={`w-full text-left p-2 text-sm rounded border transition-colors ${
                        selectedKnowledgeBase?.id === kb.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-medium truncate">{kb.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {kb.totalDocuments} documents • {kb.totalChunks || 0} chunks
                      </div>
                    </button>
                  ))}
                </div>
                
                {selectedKnowledgeBase && (
                  <button
                    onClick={handleDisableKnowledgeBase}
                    className="w-full mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 py-1"
                  >
                    Désélectionner la base
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};