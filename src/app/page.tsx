'use client';

import { useState, useEffect } from 'react';
import { AVAILABLE_MODELS, ModelConfig, KnowledgeBase, RAGConfig, SearchResult } from '@/types/models';
import { ChatMessage } from '@/types/conversation';
import { useWebLLM } from '@/hooks/useWebLLM';
import { useConversations } from '@/hooks/useConversations';
import { ragManager } from '@/lib/rag';
import { embeddingManager } from '@/lib/embedding';
import { dbManager } from '@/lib/indexedDB';
import KnowledgeManager from '@/components/KnowledgeManager';
import { ConversationSidebar } from '@/components/ConversationSidebar';
import { RAGControls } from '@/components/RAGControls';
import { ModelSelector } from '@/components/ModelSelector';

export default function Home() {
  // États pour WebLLM
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // États pour Knowledge Management
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [showDetailedSources, setShowDetailedSources] = useState(true);
  
  // États pour les onglets
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge'>('chat');
  
  // Hooks
  const { modelState, initModel, generateResponse, unloadModel } = useWebLLM();
  const {
    conversations,
    currentConversation,
    isLoading: conversationsLoading,
    error: conversationsError,
    createConversation,
    loadConversation,
    addMessageToConversation,
    updateConversationRAGConfig,
    deleteConversation,
    renameConversation,
    clearCurrentConversation,
  } = useConversations();

  // Charger les bases de connaissances au démarrage
  useEffect(() => {
    const loadKnowledgeBases = async () => {
      try {
        const kbs = await dbManager.getAllKnowledgeBases();
        setKnowledgeBases(kbs);
      } catch (error) {
        console.error('Erreur lors du chargement des bases de connaissances:', error);
      }
    };

    loadKnowledgeBases();
  }, []);

  // Fonction pour initialiser le modèle d'embedding si besoin
  useEffect(() => {
    if (!embeddingManager.isModelLoaded()) {
      const defaultModel = { 
        id: 'all-MiniLM-L6-v2', 
        name: 'all-MiniLM-L6-v2', 
        repoId: 'Xenova/all-MiniLM-L6-v2',
        size: '80MB',
        dimensions: 384,
        maxTokens: 512,
        language: ['en', 'fr'],
        downloadUrl: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2'
      };
      embeddingManager.loadModel(defaultModel).catch(console.error);
    }
  }, []);

  // Fonctions pour WebLLM
  const handleModelSelect = async (model: ModelConfig) => {
    setSelectedModel(model);
    await initModel(model);
  };

  // Gestion des conversations
  const handleNewConversation = async () => {
    try {
      await createConversation();
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
    }
  };

  const handleSelectConversation = async (id: string) => {
    try {
      await loadConversation(id);
    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      try {
        await deleteConversation(id);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await renameConversation(id, newTitle);
    } catch (error) {
      console.error('Erreur lors du renommage:', error);
    }
  };

  // Gestion du RAG
  const handleToggleRAG = async (enabled: boolean) => {
    if (!currentConversation) return;
    
    try {
      await updateConversationRAGConfig(
        enabled,
        enabled ? currentConversation.ragConfig.selectedKnowledgeBaseId : null,
        enabled ? currentConversation.ragConfig.selectedKnowledgeBaseName : null
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du RAG:', error);
    }
  };

  const handleSelectKnowledgeBase = async (id: string | null, name: string | null) => {
    if (!currentConversation) return;
    
    try {
      await updateConversationRAGConfig(id !== null, id, name);
    } catch (error) {
      console.error('Erreur lors de la sélection de la base:', error);
    }
  };

  // Gestion de l'envoi de message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating || !modelState.isReady) return;

    // Créer une nouvelle conversation si nécessaire
    if (!currentConversation) {
      await handleNewConversation();
      // Attendre que la conversation soit créée
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!currentConversation) {
      console.error('Aucune conversation disponible');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    try {
      // Ajouter le message utilisateur
      await addMessageToConversation(userMessage);
      setInputMessage('');
      setIsGenerating(true);

      let ragContext: SearchResult[] = [];
      
      // Si RAG est activé
      if (currentConversation?.ragConfig.enabled && currentConversation.ragConfig.selectedKnowledgeBaseId && embeddingManager.isModelLoaded()) {
        try {
          console.log('Recherche RAG en cours...');
          
          const adaptiveConfig = ragManager.getAdaptiveRAGConfig(inputMessage.trim());
          adaptiveConfig.selectedKnowledgeBase = currentConversation.ragConfig.selectedKnowledgeBaseId;
          
          const searchResults = await ragManager.searchInKnowledgeBase(
            inputMessage.trim(),
            currentConversation.ragConfig.selectedKnowledgeBaseId,
            adaptiveConfig
          );

          if (searchResults.length > 0) {
            console.log(`Trouvé ${searchResults.length} résultats pertinents`);
            ragContext = searchResults;
          }
        } catch (ragError) {
          console.warn('Erreur RAG, utilisation du mode normal:', ragError);
        }
      }

      // Préparer les messages pour la génération
      const conversationHistory = currentConversation ? [...currentConversation.messages, userMessage] : [userMessage];
      
      let messagesForGeneration: ChatMessage[];

      if (ragContext.length > 0) {
        const systemMessage: ChatMessage = {
          id: 'rag-system',
          role: 'system',
          content: ragManager.createRAGPrompt(inputMessage.trim(), ragContext),
          timestamp: new Date()
        };

        const recentHistory = conversationHistory.slice(-10);
        messagesForGeneration = [systemMessage, ...recentHistory, userMessage];
      } else {
        const recentHistory = conversationHistory.slice(-10);
        messagesForGeneration = [...recentHistory, userMessage];
      }

      // Générer la réponse
      let fullResponse = '';
      await generateResponse(
        messagesForGeneration,
        (completeResponse) => {
          // completeResponse est déjà la réponse complète accumulée depuis useWebLLM
          fullResponse = completeResponse;
          // Mise à jour en temps réel du message assistant
          // Note: ici on pourrait mettre à jour l'état local pour l'affichage en temps réel
        }
      );

      // Créer le message assistant avec la réponse complète
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        ragContext: ragContext.length > 0 ? ragContext : undefined
      };
      
      await addMessageToConversation(assistantMessage);
      
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Gestion des touches pour l'envoi
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Gestion mise à jour des bases de connaissances
  const handleKnowledgeBasesUpdate = async () => {
    try {
      const kbs = await dbManager.getAllKnowledgeBases();
      setKnowledgeBases(kbs);
    } catch (error) {
      console.error('Erreur lors du chargement des bases:', error);
    }
  };


  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar des conversations */}
      <ConversationSidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        isLoading={conversationsLoading}
      />

      {/* Zone principale */}
      <div className="flex-1 flex flex-col">
        {/* Header avec onglets */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'knowledge'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Knowledge
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Sélecteur de modèle dans le header */}
              <ModelSelector
                selectedModel={selectedModel}
                availableModels={AVAILABLE_MODELS}
                onSelectModel={handleModelSelect}
                isLoading={modelState.isLoading}
                isGenerating={isGenerating}
              />
              
              <div className="text-sm text-gray-500">
                {currentConversation && (
                  <span>
                    {currentConversation.messageCount} messages
                    {currentConversation.ragConfig.enabled && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        RAG: {currentConversation.ragConfig.selectedKnowledgeBaseName}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col">
            {/* Zone de conversation */}
            <div className="flex-1 overflow-y-auto p-6">
              {!selectedModel || !modelState.isReady ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-4">🤖</div>
                    <div className="text-lg mb-2">Aucun modèle sélectionné</div>
                    <div>Utilisez le sélecteur de modèle en bas pour commencer</div>
                    {modelState.isLoading && (
                      <div className="mt-4">
                        <div className="inline-flex items-center">
                          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                          Chargement du modèle...
                        </div>
                        {modelState.progress && (
                          <div className="mt-2 text-sm text-gray-500">
                            {modelState.progress}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {currentConversation ? (
                    <div className="max-w-4xl mx-auto">
                      <div className="space-y-6">
                        {currentConversation.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-3xl p-4 rounded-lg break-words ${
                                message.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100'
                              }`}
                            >
                              <div className="whitespace-pre-wrap text-base break-words overflow-hidden">{message.content}</div>
                              
                              {/* Sources RAG */}
                              {message.role === 'assistant' && message.ragContext && showDetailedSources && (
                                <details className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                  <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-300">
                                    📚 Sources utilisées ({message.ragContext.length})
                                  </summary>
                                  <div className="mt-2 space-y-2">
                                    {message.ragContext.map((source, index) => (
                                      <div key={index} className="text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded border-l-2 border-blue-500">
                                        <div className="font-medium text-gray-700 dark:text-gray-300">
                                          {source.chunk.metadata?.sourceName || `Source ${index + 1}`}
                                        </div>
                                        <div className="text-gray-600 dark:text-gray-400 mt-1">
                                          {source.chunk.content.substring(0, 200)}...
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-500 mt-1">
                                          Similarité: {(source.similarity * 100).toFixed(1)}%
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              )}
                              
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {isGenerating && (
                          <div className="flex justify-start">
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                <span className="text-gray-600 dark:text-gray-400">Génération en cours...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-xl mb-2">💬</div>
                        <div>Sélectionnez une conversation ou créez-en une nouvelle</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Zone de saisie - Toujours visible */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-end space-x-3">
                  {/* Contrôles RAG */}
                  <RAGControls
                    isEnabled={currentConversation?.ragConfig?.enabled || false}
                    selectedKnowledgeBase={
                      currentConversation?.ragConfig?.selectedKnowledgeBaseId
                        ? {
                            id: currentConversation.ragConfig.selectedKnowledgeBaseId,
                            name: currentConversation.ragConfig.selectedKnowledgeBaseName || 'Base inconnue'
                          }
                        : null
                    }
                    knowledgeBases={knowledgeBases}
                    onToggleRAG={handleToggleRAG}
                    onSelectKnowledgeBase={handleSelectKnowledgeBase}
                    isLoading={isGenerating}
                  />

                  {/* Input de message */}
                  <div className="flex-1">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Tapez votre message..."
                      disabled={isGenerating || !modelState.isReady}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
                      rows={1}
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                  </div>

                  {/* Bouton d'envoi */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isGenerating || !modelState.isReady}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    Envoyer
                  </button>
                </div>

                {/* Toggle pour les sources détaillées */}
                <div className="mt-3 flex justify-end">
                  <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={showDetailedSources}
                      onChange={(e) => setShowDetailedSources(e.target.checked)}
                      className="mr-2"
                    />
                    Afficher les sources détaillées
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Onglet Knowledge */
          <div className="flex-1 overflow-y-auto p-6">
            <KnowledgeManager 
              onKnowledgeBaseSelect={(kb) => {
                if (kb) {
                  handleKnowledgeBasesUpdate();
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

