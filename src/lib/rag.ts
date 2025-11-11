'use client';

import { DocumentChunk, SearchResult, RAGConfig } from '@/types/models';
import { embeddingManager } from './embedding';
import { dbManager } from './indexedDB';

class RAGManager {
  private static instance: RAGManager;

  private constructor() {}

  static getInstance(): RAGManager {
    if (!RAGManager.instance) {
      RAGManager.instance = new RAGManager();
    }
    return RAGManager.instance;
  }

  // Recherche sémantique dans une knowledge base
  async searchInKnowledgeBase(
    query: string,
    knowledgeBaseId: string,
    config: RAGConfig
  ): Promise<SearchResult[]> {
    try {
      // 1. Générer l'embedding de la requête
      const queryEmbedding = await embeddingManager.generateEmbedding(query);

      // 2. Récupérer tous les chunks de la knowledge base
      const chunks = await dbManager.getChunksByKnowledgeBase(knowledgeBaseId);

      if (chunks.length === 0) {
        return [];
      }

      // 3. Calculer les similarités
      const candidates = chunks.map(chunk => ({
        embedding: chunk.embedding,
        data: chunk
      }));

      const similarResults = embeddingManager.findSimilar(
        queryEmbedding,
        candidates,
        config.similarityThreshold,
        config.maxResults * 2 // Récupérer plus de résultats pour le reranking
      );

      // 4. Convertir en SearchResult
      let searchResults: SearchResult[] = similarResults.map(result => ({
        chunk: result.data,
        similarity: result.similarity,
        relevance: result.similarity // Par défaut, relevance = similarity
      }));

      // 5. Re-ranking optionnel (simple pour commencer)
      if (config.useReranking) {
        searchResults = this.rerank(query, searchResults);
      }

      // 6. Limiter au nombre final de résultats
      return searchResults.slice(0, config.maxResults);

    } catch (error) {
      console.error('Erreur lors de la recherche sémantique:', error);
      throw error;
    }
  }

  // Recherche dans toutes les knowledge bases
  async searchGlobal(
    query: string,
    config: RAGConfig
  ): Promise<SearchResult[]> {
    try {
      // Récupérer toutes les knowledge bases
      const allKBs = await dbManager.getAllKnowledgeBases();
      
      if (allKBs.length === 0) {
        return [];
      }

      // Rechercher dans chaque KB
      const allResults: SearchResult[] = [];
      
      for (const kb of allKBs) {
        const kbResults = await this.searchInKnowledgeBase(query, kb.id, config);
        allResults.push(...kbResults);
      }

      // Trier par relevance et limiter
      allResults.sort((a, b) => b.relevance - a.relevance);
      return allResults.slice(0, config.maxResults);

    } catch (error) {
      console.error('Erreur lors de la recherche globale:', error);
      throw error;
    }
  }

  // Re-ranking simple basé sur la longueur et la position des mots-clés
  private rerank(query: string, results: SearchResult[]): SearchResult[] {
    const queryWords = query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2); // Ignorer les mots trop courts

    return results.map(result => {
      let relevanceBoost = 0;
      const content = result.chunk.content.toLowerCase();

      // Bonus pour la présence exacte de mots-clés
      for (const word of queryWords) {
        const occurrences = (content.match(new RegExp(word, 'g')) || []).length;
        relevanceBoost += occurrences * 0.1;
      }

      // Bonus pour les chunks plus récents
      const ageBonus = this.getAgeBonus(result.chunk.metadata.createdAt);
      relevanceBoost += ageBonus;

      // Malus pour les chunks très longs ou très courts
      const lengthPenalty = this.getLengthPenalty(content.length);
      relevanceBoost -= lengthPenalty;

      // Calcul de la relevance finale
      const finalRelevance = Math.min(1, result.similarity + relevanceBoost);

      return {
        ...result,
        relevance: finalRelevance
      };
    }).sort((a, b) => b.relevance - a.relevance);
  }

  // Bonus basé sur l'âge du document (plus récent = bonus)
  private getAgeBonus(createdAt: Date): number {
    const now = new Date();
    const daysDiff = (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff < 7) return 0.05;      // Documents très récents
    if (daysDiff < 30) return 0.02;     // Documents récents
    if (daysDiff < 90) return 0;        // Documents moyens
    return -0.02;                       // Documents anciens
  }

  // Pénalité basée sur la longueur du chunk
  private getLengthPenalty(length: number): number {
    if (length < 100) return 0.1;       // Trop court
    if (length > 2000) return 0.05;     // Trop long
    return 0;                           // Longueur optimale
  }

  // Construire le contexte RAG pour le prompt
  buildRAGContext(
    query: string,
    searchResults: SearchResult[],
    maxContextLength: number = 3000
  ): string {
    if (searchResults.length === 0) {
      return '';
    }

    let context = '';
    let currentLength = 0;

    const contextHeader = `Contexte pertinent pour la question "${query}":\n\n`;
    context += contextHeader;
    currentLength += contextHeader.length;

    for (let i = 0; i < searchResults.length; i++) {
      const result = searchResults[i];
      const chunkText = result.chunk.content.trim();
      
      // Ajouter un identifiant de source pour les citations
      const sourceId = `[SOURCE_${i + 1}]`;
      const sourceInfo = `${sourceId} (${result.chunk.metadata.sourceName}):\n`;
      const chunkContent = `${chunkText}\n\n`;
      const totalAdd = sourceInfo.length + chunkContent.length;

      // Vérifier si on dépasse la limite
      if (currentLength + totalAdd > maxContextLength) {
        // Essayer de tronquer le dernier chunk
        const remainingSpace = maxContextLength - currentLength - sourceInfo.length - 10; // -10 pour "..."
        
        if (remainingSpace > 100) { // Au moins 100 caractères
          context += sourceInfo;
          context += chunkText.substring(0, remainingSpace) + '...';
        }
        break;
      }

      context += sourceInfo;
      context += chunkContent;
      currentLength += totalAdd;
    }

    return context.trim();
  }

  // Créer le prompt RAG complet
  createRAGPrompt(
    userQuery: string,
    searchResults: SearchResult[],
    systemPrompt?: string
  ): string {
    const context = this.buildRAGContext(userQuery, searchResults);
    
    const defaultSystemPrompt = `Tu es un assistant IA qui répond aux questions en te basant sur le contexte fourni. 

Instructions importantes:
- Utilise UNIQUEMENT les informations du contexte fourni pour répondre
- Réponds de manière naturelle et fluide, sans citer explicitement les sources dans ta réponse
- Si le contexte ne contient pas d'information pertinente, dis-le clairement
- Sois précis et concis dans tes réponses
- Si tu n'es pas sûr d'une information, exprime ton incertitude
- Ne mentionne pas les identifiants [SOURCE_X] dans ta réponse

Réponds simplement et naturellement à la question en utilisant les informations fournies.`;

    const prompt = `${systemPrompt || defaultSystemPrompt}

${context}

Question: ${userQuery}

Réponse:`;

    return prompt;
  }

  // Analyser une requête pour détecter les intentions
  analyzeQuery(query: string): {
    type: 'search' | 'question' | 'analysis' | 'general';
    keywords: string[];
    complexity: 'simple' | 'medium' | 'complex';
  } {
    const lowerQuery = query.toLowerCase();
    
    // Détecter le type de requête
    let type: 'search' | 'question' | 'analysis' | 'general' = 'general';
    
    if (/^(qu'|que|qui|comment|pourquoi|quand|où|combien|quel|quelle)/.test(lowerQuery)) {
      type = 'question';
    } else if (/\b(analyse|compare|explique|détaille|résume|évalue)\b/.test(lowerQuery)) {
      type = 'analysis';
    } else if (/\b(trouve|cherche|liste|montre|affiche)\b/.test(lowerQuery)) {
      type = 'search';
    }

    // Extraire les mots-clés
    const keywords = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['les', 'des', 'une', 'dans', 'avec', 'pour', 'sur', 'par'].includes(word));

    // Déterminer la complexité
    const complexity = keywords.length < 3 ? 'simple' : 
                     keywords.length < 6 ? 'medium' : 'complex';

    return { type, keywords, complexity };
  }

  // Configuration RAG adaptative basée sur l'analyse de la requête
  getAdaptiveRAGConfig(query: string): RAGConfig {
    const analysis = this.analyzeQuery(query);
    
    const baseConfig: RAGConfig = {
      enabled: true,
      selectedKnowledgeBase: null,
      similarityThreshold: 0.3,
      maxResults: 5,
      useReranking: true,
      contextLength: 3000
    };

    // Ajuster selon le type de requête
    switch (analysis.type) {
      case 'search':
        return {
          ...baseConfig,
          maxResults: 8,
          similarityThreshold: 0.4,
          useReranking: true
        };
      
      case 'analysis':
        return {
          ...baseConfig,
          maxResults: 10,
          similarityThreshold: 0.25,
          contextLength: 4000,
          useReranking: true
        };
      
      case 'question':
        return {
          ...baseConfig,
          maxResults: 6,
          similarityThreshold: 0.35,
          useReranking: true
        };
      
      default:
        return baseConfig;
    }
  }
}

// Export de l'instance singleton
export const ragManager = RAGManager.getInstance();