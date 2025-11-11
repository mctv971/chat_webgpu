'use client';

import { useState, useEffect, useCallback } from 'react';
import { KnowledgeBase, EmbeddingModel, AVAILABLE_EMBEDDING_MODELS } from '@/types/models';
import { dbManager } from '@/lib/indexedDB';
import { embeddingManager } from '@/lib/embedding';
import { documentProcessor, ChunkingOptions, DEFAULT_CHUNKING_OPTIONS } from '@/lib/documentProcessor';

interface KnowledgeBaseState {
  knowledgeBases: KnowledgeBase[];
  isLoading: boolean;
  error: string | null;
  embeddingModelLoaded: boolean;
  embeddingModelLoading: boolean;
  currentEmbeddingModel: EmbeddingModel | null;
}

export const useKnowledgeBase = () => {
  const [state, setState] = useState<KnowledgeBaseState>({
    knowledgeBases: [],
    isLoading: false,
    error: null,
    embeddingModelLoaded: false,
    embeddingModelLoading: false,
    currentEmbeddingModel: null
  });

  // Initialiser IndexedDB et charger les knowledge bases
  const initializeDB = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await dbManager.init();
      const kbs = await dbManager.getAllKnowledgeBases();
      
      setState(prev => ({
        ...prev,
        knowledgeBases: kbs,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur d\'initialisation',
        isLoading: false
      }));
    }
  }, []);

  // Charger un modèle d'embedding
  const loadEmbeddingModel = useCallback(async (
    model: EmbeddingModel,
    onProgress?: (progress: number) => void
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        embeddingModelLoading: true, 
        error: null 
      }));

      await embeddingManager.loadModel(model, onProgress);

      setState(prev => ({
        ...prev,
        embeddingModelLoaded: true,
        embeddingModelLoading: false,
        currentEmbeddingModel: model
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        embeddingModelLoading: false,
        embeddingModelLoaded: false,
        error: error instanceof Error ? error.message : 'Erreur de chargement du modèle d\'embedding'
      }));
    }
  }, []);

  // Créer une nouvelle knowledge base
  const createKnowledgeBase = useCallback(async (
    name: string,
    description: string,
    documents: Array<{ name: string; content: string }>,
    options: ChunkingOptions = DEFAULT_CHUNKING_OPTIONS,
    onProgress?: (overall: number, stage: string, detail?: string) => void
  ) => {
    if (!state.embeddingModelLoaded) {
      throw new Error('Aucun modèle d\'embedding chargé');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const newKB = await documentProcessor.createKnowledgeBase(
        name,
        description,
        documents,
        options,
        onProgress
      );

      setState(prev => ({
        ...prev,
        knowledgeBases: [...prev.knowledgeBases, newKB],
        isLoading: false
      }));

      return newKB;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur lors de la création',
        isLoading: false
      }));
      throw error;
    }
  }, [state.embeddingModelLoaded]);

  // Supprimer une knowledge base
  const deleteKnowledgeBase = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      await dbManager.deleteKnowledgeBase(id);

      setState(prev => ({
        ...prev,
        knowledgeBases: prev.knowledgeBases.filter(kb => kb.id !== id),
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression',
        isLoading: false
      }));
    }
  }, []);

  // Recharger les knowledge bases
  const refreshKnowledgeBases = useCallback(async () => {
    try {
      const kbs = await dbManager.getAllKnowledgeBases();
      setState(prev => ({ ...prev, knowledgeBases: kbs }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur de rechargement'
      }));
    }
  }, []);

  // Obtenir les statistiques de stockage
  const getStorageStats = useCallback(async () => {
    try {
      const totalSize = await dbManager.getDatabaseSize();
      const embeddingCacheStats = embeddingManager.getCacheStats();
      
      return {
        totalKnowledgeBases: state.knowledgeBases.length,
        totalChunks: state.knowledgeBases.reduce((sum, kb) => sum + kb.totalChunks, 0),
        totalSizeBytes: totalSize,
        embeddingCache: embeddingCacheStats
      };
    } catch (error) {
      console.error('Erreur lors de l\'obtention des statistiques:', error);
      return null;
    }
  }, [state.knowledgeBases]);

  // Nettoyer tout le stockage
  const clearAllData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await dbManager.clearAll();
      embeddingManager.clearCache();
      
      setState(prev => ({
        ...prev,
        knowledgeBases: [],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur lors du nettoyage',
        isLoading: false
      }));
    }
  }, []);

  // Validation d'un document
  const validateDocument = useCallback((content: string) => {
    return documentProcessor.validateDocument(content);
  }, []);

  // Estimation du nombre de chunks
  const estimateChunks = useCallback((content: string, options?: ChunkingOptions) => {
    return documentProcessor.estimateChunks(content, options);
  }, []);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialiser au montage
  useEffect(() => {
    initializeDB();
  }, [initializeDB]);

  return {
    // État
    ...state,
    
    // Actions
    loadEmbeddingModel,
    createKnowledgeBase,
    deleteKnowledgeBase,
    refreshKnowledgeBases,
    getStorageStats,
    clearAllData,
    clearError,
    
    // Utilitaires
    validateDocument,
    estimateChunks,
    
    // Données de référence
    availableEmbeddingModels: AVAILABLE_EMBEDDING_MODELS
  };
};