'use client';

import { DocumentChunk, KnowledgeBase } from '@/types/models';
import { embeddingManager } from './embedding';
import { dbManager } from './indexedDB';

export interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
  splitOn: 'sentence' | 'paragraph' | 'character';
  minChunkSize: number;
  maxChunkSize: number;
}

export const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  chunkSize: 512,
  chunkOverlap: 50,
  splitOn: 'sentence',
  minChunkSize: 100,
  maxChunkSize: 1000
};

class DocumentProcessor {
  private static instance: DocumentProcessor;

  private constructor() {}

  static getInstance(): DocumentProcessor {
    if (!DocumentProcessor.instance) {
      DocumentProcessor.instance = new DocumentProcessor();
    }
    return DocumentProcessor.instance;
  }

  // Nettoyage du texte
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')           // Normaliser les retours à la ligne
      .replace(/\r/g, '\n')             // Normaliser les retours à la ligne
      .replace(/\n{3,}/g, '\n\n')       // Réduire les multiples retours à la ligne
      .replace(/[ \t]{2,}/g, ' ')       // Réduire les espaces multiples
      .trim();
  }

  // Découpage en phrases
  private splitIntoSentences(text: string): string[] {
    // Regex pour détecter la fin de phrase en français et anglais
    const sentenceEnders = /[.!?]+/g;
    const sentences: string[] = [];
    
    let lastIndex = 0;
    let match;
    
    while ((match = sentenceEnders.exec(text)) !== null) {
      const sentence = text.slice(lastIndex, match.index + match[0].length).trim();
      if (sentence.length > 10) { // Ignorer les phrases très courtes
        sentences.push(sentence);
      }
      lastIndex = match.index + match[0].length;
    }
    
    // Ajouter le reste du texte s'il y en a
    const remaining = text.slice(lastIndex).trim();
    if (remaining.length > 10) {
      sentences.push(remaining);
    }
    
    return sentences;
  }

  // Découpage en paragraphes
  private splitIntoParagraphs(text: string): string[] {
    return text
      .split(/\n\s*\n/)
      .filter(paragraph => paragraph.trim().length > 20)
      .map(paragraph => paragraph.trim());
  }

  // Découpage intelligent du texte
  chunkText(text: string, options: ChunkingOptions = DEFAULT_CHUNKING_OPTIONS): string[] {
    const cleanedText = this.cleanText(text);
    const chunks: string[] = [];

    let segments: string[];

    switch (options.splitOn) {
      case 'sentence':
        segments = this.splitIntoSentences(cleanedText);
        break;
      case 'paragraph':
        segments = this.splitIntoParagraphs(cleanedText);
        break;
      case 'character':
      default:
        // Découpage par caractères avec recherche de points de coupure naturels
        segments = this.splitByCharacters(cleanedText, options.chunkSize);
        break;
    }

    // Regrouper les segments pour former des chunks de taille appropriée
    let currentChunk = '';
    let currentLength = 0;

    for (const segment of segments) {
      const segmentLength = segment.length;

      // Si le segment seul dépasse la taille max, le découper
      if (segmentLength > options.maxChunkSize) {
        // Finaliser le chunk actuel s'il existe
        if (currentChunk.trim() && currentLength >= options.minChunkSize) {
          chunks.push(currentChunk.trim());
        }

        // Découper le segment trop long
        const subChunks = this.splitByCharacters(segment, options.chunkSize);
        chunks.push(...subChunks);

        currentChunk = '';
        currentLength = 0;
        continue;
      }

      // Vérifier si ajouter ce segment dépasse la taille cible
      if (currentLength + segmentLength > options.chunkSize && currentChunk.trim()) {
        // Finaliser le chunk actuel s'il atteint la taille minimale
        if (currentLength >= options.minChunkSize) {
          chunks.push(currentChunk.trim());

          // Gérer le chevauchement
          if (options.chunkOverlap > 0) {
            const overlapText = currentChunk.slice(-options.chunkOverlap);
            currentChunk = overlapText + ' ' + segment;
            currentLength = overlapText.length + segmentLength + 1;
          } else {
            currentChunk = segment;
            currentLength = segmentLength;
          }
        } else {
          // Le chunk actuel est trop petit, continuer à l'étendre
          currentChunk += ' ' + segment;
          currentLength += segmentLength + 1;
        }
      } else {
        // Ajouter le segment au chunk actuel
        if (currentChunk.trim()) {
          currentChunk += ' ' + segment;
          currentLength += segmentLength + 1;
        } else {
          currentChunk = segment;
          currentLength = segmentLength;
        }
      }
    }

    // Ajouter le dernier chunk s'il est assez long
    if (currentChunk.trim() && currentLength >= options.minChunkSize) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length >= options.minChunkSize);
  }

  // Découpage par caractères avec points de coupure intelligents
  private splitByCharacters(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      let endIndex = Math.min(startIndex + chunkSize, text.length);

      // Si on n'est pas à la fin du texte, chercher un point de coupure naturel
      if (endIndex < text.length) {
        // Chercher le dernier espace ou saut de ligne avant la limite
        const searchStart = Math.max(startIndex, endIndex - 100);
        for (let i = endIndex - 1; i >= searchStart; i--) {
          if (/[\s\n.!?]/.test(text[i])) {
            endIndex = i + 1;
            break;
          }
        }
      }

      const chunk = text.slice(startIndex, endIndex).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      startIndex = endIndex;
    }

    return chunks;
  }

  // Traitement complet d'un document : chunking + embedding
  async processDocument(
    content: string,
    sourceName: string,
    knowledgeBaseId: string,
    options: ChunkingOptions = DEFAULT_CHUNKING_OPTIONS,
    onProgress?: (processed: number, total: number, stage: string) => void
  ): Promise<DocumentChunk[]> {
    try {
      onProgress?.(0, 100, 'Découpage du texte...');
      
      // 1. Découper le texte en chunks
      const textChunks = this.chunkText(content, options);
      
      if (textChunks.length === 0) {
        throw new Error('Aucun chunk valide généré à partir du document');
      }

      onProgress?.(20, 100, 'Génération des embeddings...');

      // 2. Générer les embeddings pour chaque chunk
      const documentChunks: DocumentChunk[] = [];
      
      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];
        
        try {
          const embedding = await embeddingManager.generateEmbedding(chunk);
          
          // Calculer la position dans le texte original
          const startChar = content.indexOf(chunk.substring(0, 50));
          const endChar = startChar + chunk.length;

          const documentChunk: DocumentChunk = {
            id: `${knowledgeBaseId}_chunk_${i}_${Date.now()}`,
            content: chunk,
            embedding: embedding,
            metadata: {
              sourceId: knowledgeBaseId,
              sourceName: sourceName,
              chunkIndex: i,
              startChar: Math.max(0, startChar),
              endChar: Math.min(content.length, endChar),
              createdAt: new Date()
            }
          };

          documentChunks.push(documentChunk);

          // Mise à jour de la progression
          const progress = 20 + ((i + 1) / textChunks.length) * 70;
          onProgress?.(progress, 100, `Embedding ${i + 1}/${textChunks.length}...`);

        } catch (error) {
          console.warn(`Erreur lors du traitement du chunk ${i}:`, error);
          // Continuer avec les autres chunks
        }
      }

      onProgress?.(90, 100, 'Sauvegarde...');

      // 3. Sauvegarder dans IndexedDB
      await dbManager.saveChunks(documentChunks);

      onProgress?.(100, 100, 'Terminé !');

      return documentChunks;

    } catch (error) {
      console.error('Erreur lors du traitement du document:', error);
      throw error;
    }
  }

  // Créer une nouvelle knowledge base personnalisée
  async createKnowledgeBase(
    name: string,
    description: string,
    documents: Array<{ name: string; content: string }>,
    options: ChunkingOptions = DEFAULT_CHUNKING_OPTIONS,
    onProgress?: (overall: number, stage: string, detail?: string) => void
  ): Promise<KnowledgeBase> {
    const kbId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      onProgress?.(0, 'Initialisation...');

      // Créer la structure de base
      const knowledgeBase: KnowledgeBase = {
        id: kbId,
        name: name,
        description: description,
        type: 'custom',
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
        chunks: [],
        totalDocuments: documents.length,
        totalChunks: 0,
        sizeBytes: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      let allChunks: DocumentChunk[] = [];
      let totalSizeBytes = 0;

      // Traiter chaque document
      for (let docIndex = 0; docIndex < documents.length; docIndex++) {
        const doc = documents[docIndex];
        const docProgress = (docIndex / documents.length) * 90;

        onProgress?.(docProgress, `Document ${docIndex + 1}/${documents.length}`, doc.name);

        const chunks = await this.processDocument(
          doc.content,
          doc.name,
          kbId,
          options,
          (processed, total, stage) => {
            const subProgress = (processed / total) * (90 / documents.length);
            onProgress?.(docProgress + subProgress, stage, doc.name);
          }
        );

        allChunks.push(...chunks);
        totalSizeBytes += new Blob([doc.content]).size;
      }

      // Mettre à jour la knowledge base avec les statistiques finales
      knowledgeBase.chunks = allChunks;
      knowledgeBase.totalChunks = allChunks.length;
      knowledgeBase.sizeBytes = totalSizeBytes;

      onProgress?.(95, 'Sauvegarde de la knowledge base...');

      // Sauvegarder la knowledge base
      await dbManager.saveKnowledgeBase(knowledgeBase);

      onProgress?.(100, 'Terminé !');

      return knowledgeBase;

    } catch (error) {
      // Nettoyer en cas d'erreur
      try {
        await dbManager.deleteKnowledgeBase(kbId);
      } catch (cleanupError) {
        console.warn('Erreur lors du nettoyage:', cleanupError);
      }
      throw error;
    }
  }

  // Utilitaires de validation
  validateDocument(content: string): { valid: boolean; message?: string } {
    if (!content || content.trim().length === 0) {
      return { valid: false, message: 'Le document est vide' };
    }

    if (content.length < 100) {
      return { valid: false, message: 'Le document est trop court (minimum 100 caractères)' };
    }

    if (content.length > 10 * 1024 * 1024) { // 10MB
      return { valid: false, message: 'Le document est trop volumineux (maximum 10MB)' };
    }

    return { valid: true };
  }

  // Estimation du nombre de chunks
  estimateChunks(content: string, options: ChunkingOptions = DEFAULT_CHUNKING_OPTIONS): number {
    const cleanedText = this.cleanText(content);
    return Math.ceil(cleanedText.length / options.chunkSize);
  }
}

// Export de l'instance singleton
export const documentProcessor = DocumentProcessor.getInstance();