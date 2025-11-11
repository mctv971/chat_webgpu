'use client';

import { KnowledgeBase, DocumentChunk } from '@/types/models';

interface DBSchema {
  knowledgeBases: {
    key: string;
    value: KnowledgeBase;
  };
  chunks: {
    key: string;
    value: DocumentChunk;
    indexes: { 'by-knowledge-base': string };
  };
}

class IndexedDBManager {
  private dbName = 'ChatbotKnowledgeDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store pour les knowledge bases
        if (!db.objectStoreNames.contains('knowledgeBases')) {
          const knowledgeStore = db.createObjectStore('knowledgeBases', { keyPath: 'id' });
          knowledgeStore.createIndex('by-type', 'type');
        }

        // Store pour les chunks
        if (!db.objectStoreNames.contains('chunks')) {
          const chunkStore = db.createObjectStore('chunks', { keyPath: 'id' });
          chunkStore.createIndex('by-knowledge-base', 'metadata.sourceId');
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database.');
    }
    return this.db;
  }

  // Knowledge Base operations
  async saveKnowledgeBase(kb: KnowledgeBase): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['knowledgeBases'], 'readwrite');
      const store = transaction.objectStore('knowledgeBases');
      
      const request = store.put(kb);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getKnowledgeBase(id: string): Promise<KnowledgeBase | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['knowledgeBases'], 'readonly');
      const store = transaction.objectStore('knowledgeBases');
      
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllKnowledgeBases(): Promise<KnowledgeBase[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['knowledgeBases'], 'readonly');
      const store = transaction.objectStore('knowledgeBases');
      
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteKnowledgeBase(id: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['knowledgeBases', 'chunks'], 'readwrite');
    
    // Supprimer la knowledge base
    const kbStore = transaction.objectStore('knowledgeBases');
    kbStore.delete(id);
    
    // Supprimer tous les chunks associés
    const chunkStore = transaction.objectStore('chunks');
    const index = chunkStore.index('by-knowledge-base');
    const request = index.getAllKeys(id);
    
    request.onsuccess = () => {
      const keys = request.result;
      keys.forEach((key: IDBValidKey) => {
        chunkStore.delete(key);
      });
    };

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Chunk operations
  async saveChunks(chunks: DocumentChunk[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chunks'], 'readwrite');
      const store = transaction.objectStore('chunks');
      
      chunks.forEach(chunk => {
        store.put(chunk);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getChunksByKnowledgeBase(knowledgeBaseId: string): Promise<DocumentChunk[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chunks'], 'readonly');
      const store = transaction.objectStore('chunks');
      const index = store.index('by-knowledge-base');
      
      const request = index.getAll(knowledgeBaseId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async searchChunks(query: string, knowledgeBaseId?: string): Promise<DocumentChunk[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chunks'], 'readonly');
      const store = transaction.objectStore('chunks');
      
      let request: IDBRequest;
      if (knowledgeBaseId) {
        const index = store.index('by-knowledge-base');
        request = index.getAll(knowledgeBaseId);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => {
        // Filtrage simple par texte (sera remplacé par recherche sémantique)
        const chunks = request.result as DocumentChunk[];
        const filteredChunks = chunks.filter(chunk => 
          chunk.content.toLowerCase().includes(query.toLowerCase())
        );
        resolve(filteredChunks);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Utilities
  async getDatabaseSize(): Promise<number> {
    const allKB = await this.getAllKnowledgeBases();
    return allKB.reduce((total, kb) => total + kb.sizeBytes, 0);
  }

  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['knowledgeBases', 'chunks'], 'readwrite');
      
      transaction.objectStore('knowledgeBases').clear();
      transaction.objectStore('chunks').clear();
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Instance singleton
export const dbManager = new IndexedDBManager();