import { ChatMessage } from './models';

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  ragConfig: {
    enabled: boolean;
    selectedKnowledgeBaseId: string | null;
    selectedKnowledgeBaseName: string | null;
  };
  messageCount: number;
  lastMessage?: string; // Aperçu du dernier message
}

export interface ConversationState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
}

export interface CreateConversationOptions {
  title?: string;
  initialMessage?: string;
  ragEnabled?: boolean;
  knowledgeBaseId?: string;
  knowledgeBaseName?: string;
}

// Re-export des types existants pour éviter les conflits d'imports
export type { ChatMessage, ModelConfig, KnowledgeBase, RAGConfig, SearchResult } from './models';