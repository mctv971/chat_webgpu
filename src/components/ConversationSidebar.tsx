import React, { useState } from 'react';
import { Conversation } from '../types/conversation';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  isLoading?: boolean;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filteredConversations = conversations.filter(conversation =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const saveTitle = (id: string) => {
    if (editingTitle.trim() && editingTitle !== conversations.find(c => c.id === id)?.title) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      saveTitle(id);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onNewConversation}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle conversation
        </button>
        
        {/* Search */}
        <div className="mt-3 relative">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
          />
          <svg
            className="w-4 h-4 text-gray-600 dark:text-gray-300 absolute left-3 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-700 dark:text-gray-300">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            Chargement...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-700 dark:text-gray-300">
            {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                  currentConversation?.id === conversation.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingId === conversation.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => saveTitle(conversation.id)}
                        onKeyDown={(e) => handleKeyPress(e, conversation.id)}
                        className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-blue-500 rounded px-1 py-0.5 w-full"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h3 
                        className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(conversation);
                        }}
                        title="Cliquer pour renommer"
                      >
                        {conversation.title}
                      </h3>
                    )}
                    {conversation.lastMessage && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        textOverflow: 'ellipsis'
                      }}>
                        {conversation.lastMessage}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(conversation.updatedAt)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {conversation.messages.length} messages
                      </span>
                      {conversation.ragConfig.enabled && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                          RAG
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    {editingId !== conversation.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(conversation);
                        }}
                        className="p-1 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 mr-1"
                        title="Renommer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                      className="p-1 text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
                      title="Supprimer la conversation"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};