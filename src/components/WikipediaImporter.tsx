import React, { useState } from 'react';
import { wikipediaService, WikipediaSearchResult, WikipediaArticle } from '../lib/wikipediaService';

interface WikipediaImporterProps {
  onImport: (articles: Array<{ title: string; content: string }>) => void;
  isImporting?: boolean;
}

export const WikipediaImporter: React.FC<WikipediaImporterProps> = ({
  onImport,
  isImporting = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WikipediaSearchResult[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set());
  const [urlInput, setUrlInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'url'>('search');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await wikipediaService.searchArticles(searchQuery, 15);
      setSearchResults(results);
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleArticleSelection = (pageId: number) => {
    const newSelection = new Set(selectedArticles);
    if (newSelection.has(pageId)) {
      newSelection.delete(pageId);
    } else {
      newSelection.add(pageId);
    }
    setSelectedArticles(newSelection);
  };

  const handleImportSelected = async () => {
    if (selectedArticles.size === 0) return;

    const selectedResults = searchResults.filter(result => selectedArticles.has(result.pageId));
    const titles = selectedResults.map(result => result.title);
    
    try {
      const articles = await wikipediaService.getMultipleArticles(titles);
      
      // Transformer les articles au format attendu
      const formattedArticles = articles.map(article => ({
        title: article.title,
        content: article.fullContent || article.extract
      }));
      
      onImport(formattedArticles);
      
      // Reset après import
      setSelectedArticles(new Set());
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'importation des articles');
    }
  };

  const handleImportFromUrl = async () => {
    if (!urlInput.trim()) return;

    try {
      const article = await wikipediaService.getArticleFromUrl(urlInput);
      if (article) {
        const formattedArticle = {
          title: article.title,
          content: article.fullContent || article.extract
        };
        
        onImport([formattedArticle]);
        setUrlInput('');
        alert('Article importé avec succès !');
      } else {
        alert('Impossible de récupérer l\'article depuis cette URL');
      }
    } catch (error) {
      console.error('Erreur lors de l\'import par URL:', error);
      alert('Erreur lors de l\'importation');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zM3.6 9.6h3.6c.6 0 1.2.6 1.2 1.2v2.4c0 .6-.6 1.2-1.2 1.2H3.6c-.6 0-1.2-.6-1.2-1.2v-2.4c0-.6.6-1.2 1.2-1.2zm16.8 0c.6 0 1.2.6 1.2 1.2v2.4c0 .6-.6 1.2-1.2 1.2h-3.6c-.6 0-1.2-.6-1.2-1.2v-2.4c0-.6.6-1.2 1.2-1.2h3.6zM10.8 3.6h2.4c.6 0 1.2.6 1.2 1.2v3.6c0 .6-.6 1.2-1.2 1.2h-2.4c-.6 0-1.2-.6-1.2-1.2V4.8c0-.6.6-1.2 1.2-1.2zm0 12h2.4c.6 0 1.2.6 1.2 1.2v3.6c0 .6-.6 1.2-1.2 1.2h-2.4c-.6 0-1.2-.6-1.2-1.2v-3.6c0-.6.6-1.2 1.2-1.2z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Importer depuis Wikipédia</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Enrichissez votre base de connaissances avec des articles Wikipédia</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex mb-6 border-b border-gray-200 dark:border-gray-600">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'search'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
          }`}
        >
          Recherche par mots-clés
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'url'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
          }`}
        >
          Import par URL
        </button>
      </div>

      {activeTab === 'search' ? (
        <div>
          {/* Recherche */}
          <div className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Rechercher des articles (ex: 'Intelligence artificielle', 'Histoire de France'...)"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
                Rechercher
              </button>
            </div>
          </div>

          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Résultats de recherche ({searchResults.length})
                </h4>
                {selectedArticles.size > 0 && (
                  <button
                    onClick={handleImportSelected}
                    disabled={isImporting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {isImporting ? (
                      <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    )}
                    Importer {selectedArticles.size} article{selectedArticles.size > 1 ? 's' : ''}
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-3">
                {searchResults.map((result) => (
                  <div
                    key={result.pageId}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedArticles.has(result.pageId)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => toggleArticleSelection(result.pageId)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedArticles.has(result.pageId)}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{result.title}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{result.snippet}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Import par URL */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL de l'article Wikipédia
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://fr.wikipedia.org/wiki/..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
              />
              <button
                onClick={handleImportFromUrl}
                disabled={isImporting || !urlInput.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isImporting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                )}
                Importer
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Copiez-collez l'URL complète d'un article Wikipédia français
            </p>
          </div>
        </div>
      )}
    </div>
  );
};