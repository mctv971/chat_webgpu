import { Conversation, CreateConversationOptions } from '../types/conversation';

const DB_NAME = 'ChatbotConversationsDB';
const DB_VERSION = 1;
const CONVERSATIONS_STORE = 'conversations';

class ConversationStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create conversations store
        if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
          const conversationsStore = db.createObjectStore(CONVERSATIONS_STORE, { 
            keyPath: 'id' 
          });
          conversationsStore.createIndex('createdAt', 'createdAt', { unique: false });
          conversationsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          conversationsStore.createIndex('title', 'title', { unique: false });
        }
      };
    });
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONVERSATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(CONVERSATIONS_STORE);
      
      const request = store.put(conversation);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save conversation'));
    });
  }

  async getConversation(id: string): Promise<Conversation | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONVERSATIONS_STORE], 'readonly');
      const store = transaction.objectStore(CONVERSATIONS_STORE);
      
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get conversation'));
    });
  }

  async getAllConversations(): Promise<Conversation[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONVERSATIONS_STORE], 'readonly');
      const store = transaction.objectStore(CONVERSATIONS_STORE);
      const index = store.index('updatedAt');
      
      const request = index.openCursor(null, 'prev'); // Plus récents en premier
      const conversations: Conversation[] = [];
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          conversations.push(cursor.value);
          cursor.continue();
        } else {
          resolve(conversations);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get conversations'));
    });
  }

  async deleteConversation(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONVERSATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(CONVERSATIONS_STORE);
      
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete conversation'));
    });
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    const conversation = await this.getConversation(id);
    if (!conversation) throw new Error('Conversation not found');

    const updatedConversation: Conversation = {
      ...conversation,
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveConversation(updatedConversation);
  }

  async searchConversations(query: string): Promise<Conversation[]> {
    const allConversations = await this.getAllConversations();
    const lowerQuery = query.toLowerCase();

    return allConversations.filter(conversation => 
      conversation.title.toLowerCase().includes(lowerQuery) ||
      conversation.lastMessage?.toLowerCase().includes(lowerQuery) ||
      conversation.messages.some(msg => 
        msg.content.toLowerCase().includes(lowerQuery)
      )
    );
  }
}

// Service singleton
export const conversationStorage = new ConversationStorage();

// Helper functions
export const generateConversationId = (): string => {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateConversationTitle = (firstMessage: string): string => {
  const maxLength = 50;
  const cleaned = firstMessage.replace(/\n+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  return cleaned.substring(0, maxLength - 3) + '...';
};

export const createNewConversation = (options: CreateConversationOptions = {}): Conversation => {
  const now = new Date();
  const id = generateConversationId();
  
  return {
    id,
    title: options.title || 'Nouvelle conversation',
    messages: [],
    createdAt: now,
    updatedAt: now,
    ragConfig: {
      enabled: options.ragEnabled || false,
      selectedKnowledgeBaseId: options.knowledgeBaseId || null,
      selectedKnowledgeBaseName: options.knowledgeBaseName || null,
    },
    messageCount: 0,
    lastMessage: options.initialMessage,
  };
};