'use client';

import { DocumentChunk, SearchResult, RAGConfig } from '@/types/models';
import { embeddingManager } from './embedding';
import { dbManager } from './indexedDB';

type PromptMode = 'strict' | 'balanced' | 'rich';

interface ModelCapabilities {
  maxContext: number;   // longueur max du contexte RAG (en caractères approx.)
  maxChunks: number;    // nombre max de chunks/documents à injecter
  promptMode: PromptMode;
}

// Capacités par modèle (tu peux ajuster au besoin)
export const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  'qwen2.5-0.5b': {
    maxContext: 1800,
    maxChunks: 2,
    promptMode: 'strict',
  },
  'tinyllama': {
    maxContext: 1500,
    maxChunks: 2,
    promptMode: 'strict',
  },
  'llama-3.2-1b': {
    maxContext: 2200,
    maxChunks: 3,
    promptMode: 'balanced',
  },
  'phi-3.5-mini': {
    maxContext: 4200,
    maxChunks: 4,
    promptMode: 'balanced',
  },
  // Si tu ajoutes des modèles plus gros côté WebLLM, tu peux les configurer ici
  'phi-3.5-3.8b': {
    maxContext: 9000,
    maxChunks: 6,
    promptMode: 'rich',
  },
  'qwen2.5-3b': {
    maxContext: 9000,
    maxChunks: 6,
    promptMode: 'rich',
  },
  'llama-3.1-8b': {
    maxContext: 12000,
    maxChunks: 8,
    promptMode: 'rich',
  },
};

// Fallback si modèle inconnu → on se base sur Phi-3.5 Mini
function getModelCapabilities(modelId?: string): ModelCapabilities {
  if (modelId && MODEL_CAPABILITIES[modelId]) {
    return MODEL_CAPABILITIES[modelId];
  }
  return MODEL_CAPABILITIES['phi-3.5-mini'];
}

class RAGManager {
  private static instance: RAGManager;

  private constructor() {}

  static getInstance(): RAGManager {
    if (!RAGManager.instance) {
      RAGManager.instance = new RAGManager();
    }
    return RAGManager.instance;
  }

  // =============================
  //   RECHERCHE DANS UNE KB
  // =============================

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
        data: chunk,
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
        relevance: result.similarity, // Par défaut, relevance = similarity
      }));

      // 5. Re-ranking optionnel
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

  // =============================
  //   RERANKING
  // =============================

  // Re-ranking simple basé sur la longueur et la position des mots-clés
  private rerank(query: string, results: SearchResult[]): SearchResult[] {
    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2); // Ignorer les mots trop courts

    return results
      .map(result => {
        let relevanceBoost = 0;
        const content = result.chunk.content.toLowerCase();

        // Bonus pour la présence exacte de mots-clés
        for (const word of queryWords) {
          const occurrences = (content.match(new RegExp(`\\b${word}\\b`, 'g')) || [])
            .length;
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
          relevance: finalRelevance,
        };
      })
      .sort((a, b) => b.relevance - a.relevance);
  }

  // Bonus basé sur l'âge du document (plus récent = bonus)
  private getAgeBonus(createdAt: Date): number {
    const now = new Date();
    const created = new Date(createdAt);
    const daysDiff =
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff < 7) return 0.05; // Documents très récents
    if (daysDiff < 30) return 0.02; // Documents récents
    if (daysDiff < 90) return 0; // Documents moyens
    return -0.02; // Documents anciens
  }

  // Pénalité basée sur la longueur du chunk
  private getLengthPenalty(length: number): number {
    if (length < 100) return 0.1; // Trop court
    if (length > 2000) return 0.05; // Trop long
    return 0; // Longueur optimale
  }

  // =============================
  //   CONSTRUCTION DU CONTEXTE
  // =============================

  /**
   * Construit le contexte RAG en prenant en compte :
   * - la limite de contexte du modèle (via modelId si fourni)
   * - ou un maxContextLength fourni manuellement (fallback)
   */
  buildRAGContext(
    query: string,
    searchResults: SearchResult[],
    maxContextLength: number = 6000,
    modelId?: string
  ): string {
    if (searchResults.length === 0) {
      return '';
    }

    const caps = getModelCapabilities(modelId);
    const effectiveMaxContext = modelId
      ? caps.maxContext
      : maxContextLength;

    let context = '';
    let currentLength = 0;

    const contextHeader = `=== DOCUMENTS PERTINENTS ===\n\n`;
    context += contextHeader;
    currentLength += contextHeader.length;

    // Ne pas dépasser le nombre max de chunks pour ce modèle
    const limitedResults = modelId
      ? searchResults.slice(0, caps.maxChunks)
      : searchResults;

    for (let i = 0; i < limitedResults.length; i++) {
      const result = limitedResults[i];
      const chunkText = result.chunk.content.trim();

      const sourceId = `[Document ${i + 1}]`;
      const similarityPercent = Math.round(result.similarity * 100);
      const sourceName = result.chunk.metadata.sourceName || 'Source inconnue';

      const sourceInfo = `${sourceId} Source: ${sourceName} (Pertinence: ${similarityPercent}%)\n`;
      const chunkContent = `${chunkText}\n\n---\n\n`;
      const totalAdd = sourceInfo.length + chunkContent.length;

      if (currentLength + totalAdd > effectiveMaxContext) {
        const remainingSpace =
          effectiveMaxContext - currentLength - sourceInfo.length - 10; // -10 pour "..."

        if (remainingSpace > 100) {
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

  // =============================
  //   PROMPT RAG
  // =============================

  private buildModelAwareSystemPrompt(
    baseContext: string,
    modelId?: string
  ): string {
    const caps = getModelCapabilities(modelId);

    if (caps.promptMode === 'strict') {
      return `Tu es un petit modèle spécialisé en RAG. Répond STRICTEMENT à partir des documents.

RÈGLES IMPORTANTES :
1. Utilise UNIQUEMENT les informations présentes dans les documents.
2. N'ajoute aucune connaissance externe.
3. Si la réponse n'est pas dans les documents, réponds exactement : "Les documents fournis ne contiennent pas cette information".

${baseContext}

=== FIN DES DOCUMENTS ===

Maintenant, réponds à la question suivante en te basant STRICTEMENT sur les documents ci-dessus :`;
    }

    if (caps.promptMode === 'rich') {
      return `Tu es un assistant IA expert qui répond aux questions en analysant attentivement les documents fournis.

📋 INSTRUCTIONS :
1. Analyse tous les documents fournis ci-dessous.
2. Base ta réponse UNIQUEMENT sur ces documents.
3. Si plusieurs documents contiennent des informations pertinentes, SYNTHÉTISE-les.
4. Si les documents ne contiennent pas la réponse, dis clairement "Les documents fournis ne contiennent pas cette information".
5. Réponds de manière précise, structurée et complète.
6. N'invente JAMAIS d'informations qui ne sont pas dans les documents.

${baseContext}

=== FIN DES DOCUMENTS ===

Maintenant, réponds à cette question en te basant STRICTEMENT sur les documents ci-dessus :`;
    }

    // balanced (par défaut)
    return `Tu es un assistant IA qui répond aux questions en te basant sur les documents fournis.

RÈGLES :
1. Utilise uniquement les informations des documents.
2. Synthétise lorsque plusieurs documents sont pertinents.
3. Si la réponse n'est pas présente, indique-le clairement.

${baseContext}

=== FIN DES DOCUMENTS ===

Réponds à la question suivante en te basant sur les documents ci-dessus :`;
  }

  /**
   * Créer le prompt RAG complet
   * Signature compatible avec ton ancien code :
   * - createRAGPrompt(userQuery, searchResults)
   * - createRAGPrompt(userQuery, searchResults, systemPrompt)
   * - createRAGPrompt(userQuery, searchResults, systemPrompt, modelId)
   */
  createRAGPrompt(
    userQuery: string,
    searchResults: SearchResult[],
    systemPrompt?: string,
    modelId?: string
  ): string {
    const context = this.buildRAGContext(
      userQuery,
      searchResults,
      6000,
      modelId
    );

    const defaultSystemPrompt = this.buildModelAwareSystemPrompt(
      context,
      modelId
    );

    const prompt = systemPrompt || defaultSystemPrompt;

    return prompt;
  }

  // =============================
  //   ANALYSE DE LA REQUÊTE
  // =============================

  // Analyser une requête pour détecter les intentions
  analyzeQuery(query: string): {
    type: 'search' | 'question' | 'analysis' | 'general';
    keywords: string[];
    complexity: 'simple' | 'medium' | 'complex';
  } {
    const lowerQuery = query.toLowerCase();

    let type: 'search' | 'question' | 'analysis' | 'general' = 'general';

    if (
      /^(qu'|que|qui|comment|pourquoi|quand|où|combien|quel|quelle)/.test(
        lowerQuery
      )
    ) {
      type = 'question';
    } else if (
      /\b(analyse|compare|explique|détaille|résume|évalue)\b/.test(lowerQuery)
    ) {
      type = 'analysis';
    } else if (
      /\b(trouve|cherche|liste|montre|affiche)\b/.test(lowerQuery)
    ) {
      type = 'search';
    }

    const keywords = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(
        word =>
          ![
            'les',
            'des',
            'une',
            'dans',
            'avec',
            'pour',
            'sur',
            'par',
            'aux',
            'ses',
            'est',
            'sont',
          ].includes(word)
      );

    const complexity =
      keywords.length < 3 ? 'simple' : keywords.length < 6 ? 'medium' : 'complex';

    return { type, keywords, complexity };
  }

  /**
   * Configuration RAG adaptative basée sur :
   * - l'analyse de la requête
   * - les capacités du modèle (via modelId si fourni)
   */
  getAdaptiveRAGConfig(query: string, modelId?: string): RAGConfig {
    const analysis = this.analyzeQuery(query);
    const caps = getModelCapabilities(modelId);

    // Base config influencée par le modèle
    const baseConfig: RAGConfig = {
      enabled: true,
      selectedKnowledgeBase: null,
      similarityThreshold: 0.38,
      maxResults: caps.maxChunks,
      useReranking: true,
      contextLength: caps.maxContext,
    };

    // Ajuster selon le type de requête
    switch (analysis.type) {
      case 'search':
        return {
          ...baseConfig,
          maxResults: Math.min(caps.maxChunks + 2, 10),
          similarityThreshold: 0.42,
        };

      case 'analysis':
        return {
          ...baseConfig,
          maxResults: Math.min(caps.maxChunks + 4, 12),
          similarityThreshold: 0.35,
          contextLength: Math.min(caps.maxContext + 2000, caps.maxContext * 1.5),
        };

      case 'question':
        return {
          ...baseConfig,
          similarityThreshold: 0.38,
        };

      default:
        return baseConfig;
    }
  }

  // =============================
  //   ANALYSE DES CITATIONS
  // =============================

  // Analyser la réponse pour identifier les chunks réellement utilisés
  analyzeResponseCitations(
    response: string,
    searchResults: SearchResult[]
  ): SearchResult[] {
    const analyzedResults = searchResults.map(result => {
      const chunk = result.chunk;
      const chunkContent = chunk.content.toLowerCase();
      const responseLower = response.toLowerCase();

      const citations: any[] = [];
      let usedInResponse = false;

      const chunkSentences = chunk.content
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20);

      for (const sentence of chunkSentences) {
        const sentenceLower = sentence.toLowerCase();

        const words = sentenceLower.split(/\s+/);

        if (words.length >= 5) {
          for (let i = 0; i <= words.length - 5; i++) {
            const segment = words.slice(i, i + 5).join(' ');

            if (segment.length > 20 && responseLower.includes(segment)) {
              usedInResponse = true;

              const startIndex = chunk.content.indexOf(sentence);
              if (startIndex !== -1) {
                citations.push({
                  text: sentence,
                  startIndex: startIndex,
                  endIndex: startIndex + sentence.length,
                  confidence: 0.9,
                });
              }
              break;
            }
          }
        }
      }

      if (!usedInResponse) {
        const responseWords = new Set(
          responseLower.split(/\W+/).filter(w => w.length > 4)
        );

        const chunkWords = chunkContent.split(/\W+/).filter(w => w.length > 4);

        const commonWords = chunkWords.filter(w => responseWords.has(w));

        if (commonWords.length >= 3) {
          usedInResponse = true;

          const bestSentence = chunkSentences.find(s =>
            commonWords.some(w => s.toLowerCase().includes(w))
          );

          if (bestSentence) {
            const startIndex = chunk.content.indexOf(bestSentence);
            citations.push({
              text: bestSentence,
              startIndex: startIndex,
              endIndex: startIndex + bestSentence.length,
              confidence: 0.6,
            });
          }
        }
      }

      return {
        ...result,
        usedInResponse,
        citations: citations.length > 0 ? citations : undefined,
      };
    });

    return analyzedResults;
  }
}

// Export de l'instance singleton
export const ragManager = RAGManager.getInstance();
