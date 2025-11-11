'use client';

import { useState, useRef } from 'react';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { KnowledgeBase, EmbeddingModel } from '@/types/models';
import { DEFAULT_CHUNKING_OPTIONS, ChunkingOptions } from '@/lib/documentProcessor';
import { WikipediaImporter } from '@/components/WikipediaImporter';

interface KnowledgeManagerProps {
  onKnowledgeBaseSelect?: (kb: KnowledgeBase | null) => void;
  selectedKnowledgeBase?: KnowledgeBase | null;
}

export default function KnowledgeManager({ onKnowledgeBaseSelect, selectedKnowledgeBase }: KnowledgeManagerProps) {
  const {
    knowledgeBases,
    isLoading,
    error,
    embeddingModelLoaded,
    embeddingModelLoading,
    currentEmbeddingModel,
    availableEmbeddingModels,
    loadEmbeddingModel,
    createKnowledgeBase,
    deleteKnowledgeBase,
    clearError,
    validateDocument,
    estimateChunks,
  } = useKnowledgeBase();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'wikipedia'>('files');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    documents: [] as Array<{ name: string; content: string }>
  });
  const [embeddingProgress, setEmbeddingProgress] = useState(0);
  const [createProgress, setCreateProgress] = useState({ overall: 0, stage: '', detail: '' });
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sélection du modèle d'embedding
  const handleEmbeddingModelSelect = async (model: EmbeddingModel) => {
    setEmbeddingProgress(0);
    await loadEmbeddingModel(model, setEmbeddingProgress);
  };

  // Gestion des fichiers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    for (const file of files) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        try {
          const content = await file.text();
          const validation = validateDocument(content);
          
          if (!validation.valid) {
            alert(`Fichier ${file.name}: ${validation.message}`);
            continue;
          }

          setFormData(prev => ({
            ...prev,
            documents: [...prev.documents, { name: file.name, content }]
          }));
        } catch (error) {
          console.error(`Erreur lecture fichier ${file.name}:`, error);
          alert(`Erreur lors de la lecture du fichier ${file.name}`);
        }
      } else {
        alert(`Fichier ${file.name}: Seuls les fichiers .txt sont supportés`);
      }
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Créer une knowledge base
  const handleCreateKnowledgeBase = async () => {
    if (!embeddingModelLoaded) {
      alert('Veuillez d\'abord charger un modèle d\'embedding');
      return;
    }

    if (!formData.name.trim()) {
      alert('Veuillez saisir un nom');
      return;
    }

    if (formData.documents.length === 0) {
      alert('Veuillez ajouter au moins un document');
      return;
    }

    setIsCreating(true);
    try {
      await createKnowledgeBase(
        formData.name,
        formData.description,
        formData.documents,
        DEFAULT_CHUNKING_OPTIONS,
        (overall, stage, detail) => {
          setCreateProgress({ overall, stage, detail: detail || '' });
        }
      );

      // Reset form
      setFormData({ name: '', description: '', documents: [] });
      setShowCreateForm(false);
      setCreateProgress({ overall: 0, stage: '', detail: '' });
      
    } catch (error) {
      console.error('Erreur création knowledge base:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Supprimer un document de la liste
  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  // Gérer l'import d'articles Wikipedia
  const handleWikipediaImport = (articles: Array<{ title: string; content: string }>) => {
    const wikipediaDocuments = articles.map(article => ({
      name: `Wikipedia - ${article.title}.txt`,
      content: article.content
    }));

    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...wikipediaDocuments]
    }));

    // Basculer vers l'onglet fichiers pour voir les documents ajoutés
    setActiveTab('files');
  };

  // Formatage de la taille
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Knowledge Bases
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={isLoading || isCreating}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          {showCreateForm ? 'Annuler' : '+ Créer'}
        </button>
      </div>

      {/* Erreurs */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex justify-between items-center">
          <span className="text-sm">{error}</span>
          <button onClick={clearError} className="text-red-700 hover:text-red-900">✕</button>
        </div>
      )}

      {/* Sélection du modèle d'embedding */}
      {!embeddingModelLoaded && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Choisir un modèle d'embedding
          </h3>
          <div className="space-y-2">
            {availableEmbeddingModels.map((model) => (
              <button
                key={model.id}
                onClick={() => handleEmbeddingModelSelect(model)}
                disabled={embeddingModelLoading}
                className="w-full text-left p-3 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{model.name}</div>
                    <div className="text-sm text-gray-900 dark:text-gray-200">{model.size} - {model.dimensions}D</div>
                  </div>
                  <div className="text-xs text-gray-900 dark:text-gray-300">
                    {model.language.join(', ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {embeddingModelLoading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-900 dark:text-gray-200 mb-2">
                <span>Chargement du modèle d'embedding...</span>
                <span>{Math.round(embeddingProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${embeddingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modèle d'embedding chargé */}
      {embeddingModelLoaded && currentEmbeddingModel && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-green-800 dark:text-green-200">
                ✓ Modèle d'embedding chargé
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                {currentEmbeddingModel.name} ({currentEmbeddingModel.dimensions}D)
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100 text-sm"
            >
              Changer
            </button>
          </div>
        </div>
      )}

      {/* Formulaire de création */}
      {showCreateForm && embeddingModelLoaded && (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg p-6">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
            Créer une Knowledge Base
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Nom
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Documentation technique"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de cette knowledge base..."
                rows={3}
                className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Onglets */}
            <div className="border-b border-zinc-300 dark:border-zinc-600">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('files')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'files'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100'
                  }`}
                >
                  📄 Fichiers
                </button>
                <button
                  onClick={() => setActiveTab('wikipedia')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'wikipedia'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100'
                  }`}
                >
                  🌐 Wikipedia
                </button>
              </nav>
            </div>

            {/* Contenu des onglets */}
            {activeTab === 'files' && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Documents (.txt uniquement)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            )}

            {activeTab === 'wikipedia' && (
              <div>
                <WikipediaImporter onImport={handleWikipediaImport} />
              </div>
            )}
            
            {/* Liste des documents */}
            {formData.documents.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Documents ajoutés ({formData.documents.length})
                </div>
                {formData.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-zinc-100 dark:bg-zinc-700 rounded">
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{doc.name}</div>
                      <div className="text-xs text-zinc-700 dark:text-zinc-300">
                        {formatSize(new Blob([doc.content]).size)} - ~{estimateChunks(doc.content)} chunks
                      </div>
                    </div>
                    <button
                      onClick={() => removeDocument(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Progress de création */}
            {isCreating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300">
                  <span>{createProgress.stage}</span>
                  <span>{Math.round(createProgress.overall)}%</span>
                </div>
                {createProgress.detail && (
                  <div className="text-xs text-zinc-700 dark:text-zinc-300">
                    {createProgress.detail}
                  </div>
                )}
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${createProgress.overall}%` }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handleCreateKnowledgeBase}
                disabled={isCreating || formData.documents.length === 0 || !formData.name.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                {isCreating ? 'Création...' : 'Créer la Knowledge Base'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                disabled={isCreating}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des knowledge bases */}
      <div className="space-y-3">
        {knowledgeBases.length === 0 ? (
          <div className="text-center py-8 text-zinc-700 dark:text-zinc-300">
            {embeddingModelLoaded 
              ? "Aucune knowledge base créée. Cliquez sur 'Créer' pour commencer."
              : "Chargez d'abord un modèle d'embedding pour créer des knowledge bases."
            }
          </div>
        ) : (
          knowledgeBases.map((kb) => (
            <div
              key={kb.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedKnowledgeBase?.id === kb.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-zinc-300 dark:border-zinc-600 hover:border-blue-300'
              }`}
              onClick={() => onKnowledgeBaseSelect?.(selectedKnowledgeBase?.id === kb.id ? null : kb)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: kb.color }}
                    />
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{kb.name}</h3>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
                    {kb.description}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-zinc-700 dark:text-zinc-300">
                    <span>{kb.totalDocuments} docs</span>
                    <span>{kb.totalChunks} chunks</span>
                    <span>{formatSize(kb.sizeBytes)}</span>
                    <span>{new Date(kb.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Supprimer la knowledge base "${kb.name}" ?`)) {
                        deleteKnowledgeBase(kb.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}