'use client';

export interface WikipediaArticle {
  title: string;
  extract: string;
  url: string;
  pageId: number;
  thumbnail?: string;
  fullContent?: string;
}

export interface WikipediaSearchResult {
  title: string;
  snippet: string;
  pageId: number;
}

class WikipediaService {
  private static instance: WikipediaService;
  private readonly baseUrl = 'https://fr.wikipedia.org/api/rest_v1';
  private readonly apiUrl = 'https://fr.wikipedia.org/w/api.php';

  static getInstance(): WikipediaService {
    if (!WikipediaService.instance) {
      WikipediaService.instance = new WikipediaService();
    }
    return WikipediaService.instance;
  }

  // Rechercher des articles par mots-clés
  async searchArticles(query: string, limit = 10): Promise<WikipediaSearchResult[]> {
    try {
      const url = new URL(this.apiUrl);
      url.searchParams.append('action', 'query');
      url.searchParams.append('list', 'search');
      url.searchParams.append('srsearch', query);
      url.searchParams.append('format', 'json');
      url.searchParams.append('origin', '*');
      url.searchParams.append('srlimit', limit.toString());

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!data.query?.search) {
        return [];
      }

      return data.query.search.map((result: any) => ({
        title: result.title,
        snippet: result.snippet.replace(/<[^>]*>/g, ''), // Supprimer les tags HTML
        pageId: result.pageid,
      }));
    } catch (error) {
      console.error('Erreur lors de la recherche Wikipedia:', error);
      return [];
    }
  }

  // Obtenir le contenu complet d'un article
  async getArticleContent(title: string): Promise<WikipediaArticle | null> {
    try {
      // Obtenir le contenu de l'article
      const contentUrl = new URL(this.apiUrl);
      contentUrl.searchParams.append('action', 'query');
      contentUrl.searchParams.append('format', 'json');
      contentUrl.searchParams.append('titles', title);
      contentUrl.searchParams.append('prop', 'extracts|pageimages|info');
      contentUrl.searchParams.append('exintro', 'false');
      contentUrl.searchParams.append('explaintext', 'true');
      contentUrl.searchParams.append('inprop', 'url');
      contentUrl.searchParams.append('origin', '*');

      const response = await fetch(contentUrl.toString());
      const data = await response.json();

      const pages = data.query?.pages;
      if (!pages) return null;

      const page = Object.values(pages)[0] as any;
      if (page.missing) return null;

      return {
        title: page.title,
        extract: page.extract || '',
        url: page.fullurl || `https://fr.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        pageId: page.pageid,
        thumbnail: page.thumbnail?.source,
        fullContent: page.extract || '',
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'article:', error);
      return null;
    }
  }

  // Obtenir un article par URL
  async getArticleFromUrl(url: string): Promise<WikipediaArticle | null> {
    try {
      // Extraire le titre de l'URL
      const urlParts = url.split('/');
      const title = decodeURIComponent(urlParts[urlParts.length - 1]);
      
      return await this.getArticleContent(title);
    } catch (error) {
      console.error('Erreur lors de l\'extraction depuis l\'URL:', error);
      return null;
    }
  }

  // Obtenir plusieurs articles par leurs titres
  async getMultipleArticles(titles: string[]): Promise<WikipediaArticle[]> {
    const articles: WikipediaArticle[] = [];
    
    // Traiter par batches de 5 pour éviter de surcharger l'API
    for (let i = 0; i < titles.length; i += 5) {
      const batch = titles.slice(i, i + 5);
      const promises = batch.map(title => this.getArticleContent(title));
      const results = await Promise.allSettled(promises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          articles.push(result.value);
        }
      });

      // Petite pause entre les batches
      if (i + 5 < titles.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return articles;
  }

  // Nettoyer le contenu pour une meilleure indexation
  cleanContent(content: string): string {
    // Supprimer les références et notes
    let cleaned = content.replace(/\[\d+\]/g, '');
    
    // Supprimer les caractères spéciaux excessifs
    cleaned = cleaned.replace(/\n\n+/g, '\n\n');
    
    // Supprimer les lignes très courtes (souvent des artefacts)
    cleaned = cleaned.split('\n')
      .filter(line => line.trim().length > 10 || line.trim() === '')
      .join('\n');
    
    return cleaned.trim();
  }

  // Diviser un article en chunks pour l'indexation
  splitIntoChunks(article: WikipediaArticle, chunkSize = 1000, overlap = 100): Array<{
    content: string;
    title: string;
    url: string;
    chunkIndex: number;
  }> {
    const cleanedContent = this.cleanContent(article.fullContent || article.extract);
    const chunks: Array<{
      content: string;
      title: string;
      url: string;
      chunkIndex: number;
    }> = [];

    if (cleanedContent.length <= chunkSize) {
      return [{
        content: cleanedContent,
        title: article.title,
        url: article.url,
        chunkIndex: 0,
      }];
    }

    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < cleanedContent.length) {
      let endIndex = Math.min(startIndex + chunkSize, cleanedContent.length);
      
      // Essayer de couper à la fin d'une phrase
      if (endIndex < cleanedContent.length) {
        const lastPeriod = cleanedContent.lastIndexOf('.', endIndex);
        const lastNewline = cleanedContent.lastIndexOf('\n', endIndex);
        const cutPoint = Math.max(lastPeriod, lastNewline);
        
        if (cutPoint > startIndex + chunkSize / 2) {
          endIndex = cutPoint + 1;
        }
      }

      const chunk = cleanedContent.slice(startIndex, endIndex).trim();
      
      if (chunk.length > 50) { // Ignorer les chunks trop petits
        chunks.push({
          content: chunk,
          title: article.title,
          url: article.url,
          chunkIndex,
        });
        chunkIndex++;
      }

      startIndex = Math.max(endIndex - overlap, startIndex + 1);
    }

    return chunks;
  }
}

export const wikipediaService = WikipediaService.getInstance();