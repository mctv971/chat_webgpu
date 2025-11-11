'use client';

import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';
import { EmbeddingModel } from '@/types/models';

class EmbeddingManager {
  private static instance: EmbeddingManager;
  private model: FeatureExtractionPipeline | null = null;
  private isLoading = false;
  private currentModel: EmbeddingModel | null = null;
  
  // Cache pour éviter de recalculer les mêmes embeddings
  private embeddingCache = new Map<string, number[]>();

  private constructor() {}

  static getInstance(): EmbeddingManager {
    if (!EmbeddingManager.instance) {
      EmbeddingManager.instance = new EmbeddingManager();
    }
    return EmbeddingManager.instance;
  }

  async loadModel(
    modelConfig: EmbeddingModel,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (this.isLoading) {
      throw new Error('Un modèle est déjà en cours de chargement');
    }

    if (this.currentModel?.id === modelConfig.id && this.model) {
      return; // Modèle déjà chargé
    }

    this.isLoading = true;
    onProgress?.(0);

    try {
      console.log(`Chargement du modèle d'embedding: ${modelConfig.name}`);
      
      // Chargement du modèle avec callback de progression
      // Utiliser le nom exact du repository Hugging Face
      let modelName: string;
      switch (modelConfig.id) {
        case 'all-minilm-l6-v2':
          modelName = 'Xenova/all-MiniLM-L6-v2';
          break;
        case 'all-minilm-l12-v2':
          modelName = 'Xenova/all-MiniLM-L12-v2';
          break;
        default:
          modelName = `Xenova/${modelConfig.id}`;
      }

      this.model = await pipeline(
        'feature-extraction',
        modelName,
        {
          progress_callback: (progress: any) => {
            if (progress.progress !== undefined) {
              onProgress?.(progress.progress * 100);
            }
          }
        }
      ) as FeatureExtractionPipeline;

      this.currentModel = modelConfig;
      this.embeddingCache.clear(); // Clear cache when switching models
      
      console.log(`Modèle d'embedding ${modelConfig.name} chargé avec succès !`);
      onProgress?.(100);
      
    } catch (error) {
      console.error('Erreur lors du chargement du modèle d\'embedding:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.model) {
      throw new Error('Aucun modèle d\'embedding chargé');
    }

    // Vérifier le cache
    const cacheKey = `${this.currentModel?.id}:${text}`;
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    try {
      // Nettoyer et limiter le texte selon les contraintes du modèle
      const cleanText = text.trim();
      const maxTokens = this.currentModel?.maxTokens || 256;
      
      // Approximation: ~4 caractères par token
      const truncatedText = cleanText.length > maxTokens * 4 
        ? cleanText.substring(0, maxTokens * 4) 
        : cleanText;

      // Générer l'embedding
      const result = await this.model(truncatedText, {
        pooling: 'mean',
        normalize: true,
      });

      // Extraire le vecteur (format peut varier selon le modèle)
      let embedding: number[];
      if (Array.isArray(result)) {
        embedding = result;
      } else if (result.data) {
        embedding = Array.from(result.data);
      } else {
        // result est déjà un Tensor
        embedding = Array.from(result.data);
      }

      // Mettre en cache
      this.embeddingCache.set(cacheKey, embedding);

      return embedding;

    } catch (error) {
      console.error('Erreur lors de la génération d\'embedding:', error);
      throw error;
    }
  }

  async generateBatchEmbeddings(
    texts: string[], 
    onProgress?: (processed: number, total: number) => void
  ): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i++) {
      const embedding = await this.generateEmbedding(texts[i]);
      embeddings.push(embedding);
      onProgress?.(i + 1, texts.length);
    }

    return embeddings;
  }

  // Calcul de similarité cosinus
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Les vecteurs doivent avoir la même dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Recherche des embeddings les plus similaires
  findSimilar(
    queryEmbedding: number[],
    candidateEmbeddings: Array<{ embedding: number[]; data: any }>,
    threshold = 0.5,
    maxResults = 10
  ): Array<{ similarity: number; data: any }> {
    const results = candidateEmbeddings
      .map(candidate => ({
        similarity: this.cosineSimilarity(queryEmbedding, candidate.embedding),
        data: candidate.data
      }))
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);

    return results;
  }

  // Gestionnaire de cache
  getCacheSize(): number {
    return this.embeddingCache.size;
  }

  clearCache(): void {
    this.embeddingCache.clear();
  }

  getCacheStats(): { size: number; model: string | null } {
    return {
      size: this.embeddingCache.size,
      model: this.currentModel?.name || null
    };
  }

  // État du modèle
  isModelLoaded(): boolean {
    return this.model !== null;
  }

  getCurrentModel(): EmbeddingModel | null {
    return this.currentModel;
  }

  isModelLoading(): boolean {
    return this.isLoading;
  }

  // Libération de ressources
  unloadModel(): void {
    this.model = null;
    this.currentModel = null;
    this.embeddingCache.clear();
  }
}

// Export de l'instance singleton
export const embeddingManager = EmbeddingManager.getInstance();