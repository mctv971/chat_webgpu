import { useState, useEffect, useCallback } from 'react';
import { Conversation, ConversationState, CreateConversationOptions, ChatMessage } from '../types/conversation';
import { 
  conversationStorage, 
  createNewConversation, 
  generateConversationTitle 
} from '../lib/conversationStorage';

export const useConversations = () => {
  const [state, setState] = useState<ConversationState>({
    conversations: [],
    currentConversation: null,
    isLoading: true,
    error: null,
  });

  // Initialize storage and load conversations
  useEffect(() => {
    const initStorage = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        await conversationStorage.init();
        const conversations = await conversationStorage.getAllConversations();
        
        setState(prev => ({
          ...prev,
          conversations,
          isLoading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize conversations',
          isLoading: false,
        }));
      }
    };

    initStorage();
  }, []);

  // Create new conversation
  const createConversation = useCallback(async (options: CreateConversationOptions = {}): Promise<string> => {
    try {
      const newConversation = createNewConversation(options);
      
      await conversationStorage.saveConversation(newConversation);
      
      setState(prev => ({
        ...prev,
        conversations: [newConversation, ...prev.conversations],
        currentConversation: newConversation,
      }));

      return newConversation.id;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create conversation',
      }));
      throw error;
    }
  }, []);

  // Load conversation
  const loadConversation = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const conversation = await conversationStorage.getConversation(id);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      setState(prev => ({
        ...prev,
        currentConversation: conversation,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load conversation',
        isLoading: false,
      }));
    }
  }, []);

  // Add message to current conversation
  const addMessageToConversation = useCallback(async (message: ChatMessage) => {
    setState(prev => {
      if (!prev.currentConversation) {
        throw new Error('No current conversation');
      }

      const updatedMessages = [...prev.currentConversation.messages, message];
      const lastMessage = message.role === 'user' ? message.content : prev.currentConversation.lastMessage;
      
      // Update title if this is the first user message
      let title = prev.currentConversation.title;
      if (prev.currentConversation.messages.length === 0 && message.role === 'user') {
        title = generateConversationTitle(message.content);
      }

      const updatedConversation: Conversation = {
        ...prev.currentConversation,
        messages: updatedMessages,
        updatedAt: new Date(),
        messageCount: updatedMessages.length,
        lastMessage,
        title,
      };

      // Save to storage asynchronously
      conversationStorage.saveConversation(updatedConversation).catch(console.error);

      return {
        ...prev,
        currentConversation: updatedConversation,
        conversations: prev.conversations.map(conv => 
          conv.id === updatedConversation.id ? updatedConversation : conv
        ),
      };
    });
  }, []);

  // Update conversation RAG config
  const updateConversationRAGConfig = useCallback(async (
    ragEnabled: boolean, 
    knowledgeBaseId: string | null = null, 
    knowledgeBaseName: string | null = null
  ) => {
    if (!state.currentConversation) {
      throw new Error('No current conversation');
    }

    try {
      const updatedConversation: Conversation = {
        ...state.currentConversation,
        ragConfig: {
          enabled: ragEnabled,
          selectedKnowledgeBaseId: knowledgeBaseId,
          selectedKnowledgeBaseName: knowledgeBaseName,
        },
        updatedAt: new Date(),
      };

      await conversationStorage.saveConversation(updatedConversation);

      setState(prev => ({
        ...prev,
        currentConversation: updatedConversation,
        conversations: prev.conversations.map(conv => 
          conv.id === updatedConversation.id ? updatedConversation : conv
        ),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update RAG config',
      }));
      throw error;
    }
  }, [state.currentConversation]);

  // Delete conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      await conversationStorage.deleteConversation(id);
      
      setState(prev => ({
        ...prev,
        conversations: prev.conversations.filter(conv => conv.id !== id),
        currentConversation: prev.currentConversation?.id === id ? null : prev.currentConversation,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete conversation',
      }));
      throw error;
    }
  }, []);

  // Rename conversation
  const renameConversation = useCallback(async (id: string, newTitle: string) => {
    try {
      await conversationStorage.updateConversation(id, { title: newTitle });
      
      setState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv => 
          conv.id === id ? { ...conv, title: newTitle, updatedAt: new Date() } : conv
        ),
        currentConversation: prev.currentConversation?.id === id 
          ? { ...prev.currentConversation, title: newTitle, updatedAt: new Date() }
          : prev.currentConversation,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to rename conversation',
      }));
      throw error;
    }
  }, []);

  // Search conversations
  const searchConversations = useCallback(async (query: string): Promise<Conversation[]> => {
    try {
      return await conversationStorage.searchConversations(query);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to search conversations',
      }));
      return [];
    }
  }, []);

  // Clear current conversation
  const clearCurrentConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentConversation: null,
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    conversations: state.conversations,
    currentConversation: state.currentConversation,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    createConversation,
    loadConversation,
    addMessageToConversation,
    updateConversationRAGConfig,
    deleteConversation,
    renameConversation,
    searchConversations,
    clearCurrentConversation,
    clearError,
  };
};