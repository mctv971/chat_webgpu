export interface ModelConfig {
  id: string;
  name: string;
  size: string;
  speed: "Ultra-rapide" | "Très rapide" | "Rapide" | "Moyen" | "Lent";
  quality: "Basique" | "Bon" | "Excellent" | "Exceptionnel";
  description: string;
  minRAM: number; // GB requis
  mobile: boolean;
  webllmId: string; // ID utilisé par WebLLM
}

// Types pour Knowledge Management et RAG
export interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    sourceId: string;
    sourceName: string;
    chunkIndex: number;
    startChar: number;
    endChar: number;
    createdAt: Date;
  };
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  type: "custom" | "predefined";
  color: string;
  chunks: DocumentChunk[];
  totalDocuments: number;
  totalChunks: number;
  sizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PredefinedKnowledge {
  id: string;
  name: string;
  description: string;
  size: string;
  chunks: number;
  downloadUrl: string;
  version: string;
  tags: string[];
  verified: boolean;
}

export interface EmbeddingModel {
  id: string;
  name: string;
  size: string;
  dimensions: number;
  maxTokens: number;
  language: string[];
  downloadUrl: string;
}

export interface RAGConfig {
  enabled: boolean;
  selectedKnowledgeBase: string | null;
  similarityThreshold: number;
  maxResults: number;
  useReranking: boolean;
  contextLength: number;
}

export interface SearchResult {
  chunk: DocumentChunk;
  similarity: number;
  relevance: number;
  usedInResponse?: boolean; // Indique si ce chunk a été utilisé dans la réponse
  citations?: Citation[]; // Citations précises extraites
}

export interface Citation {
  text: string; // Le texte exact cité
  startIndex: number; // Position dans le chunk
  endIndex: number; // Position de fin dans le chunk
  confidence: number; // Confiance que ce passage a été utilisé (0-1)
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "llama-3.2-1b",
    name: "Llama 3.2 – 1B",
    size: "~2.5GB",
    speed: "Rapide",
    quality: "Bon",
    description: "Petit Llama, adapté au RAG très simple ou local search.",
    minRAM: 4,
    mobile: true,
    webllmId: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
  },
  {
    id: "phi-3.5-3.8b",
    name: "Phi-3.5 – 3.8B",
    size: "~5.5GB",
    speed: "Rapide",
    quality: "Excellent",
    description: "Un des meilleurs modèles <4B pour du vrai RAG sérieux.",
    minRAM: 8,
    mobile: false,
    webllmId: "Phi-3.5-mini-instruct-q4f16_1-MLC",
  },
  {
    id: "qwen2.5-3b",
    name: "Qwen 2.5 – 3B",
    size: "~6GB",
    speed: "Très rapide",
    quality: "Excellent",
    description: "Très bon grounding, excellent sur RAG multi-chunks.",
    minRAM: 8,
    mobile: false,
    webllmId: "Qwen2.5-3B-Instruct-q4f16_1-MLC",
  },
  {
    id: "llama-3.1-8b",
    name: "Llama 3.1 – 8B",
    size: "~12GB",
    speed: "Lent",
    quality: "Excellent",
    description: "Pour du RAG avancé avec contexte large. Très fiable.",
    minRAM: 12,
    mobile: false,
    webllmId: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
  },
];

// Modèles d'embedding disponibles
export const AVAILABLE_EMBEDDING_MODELS: EmbeddingModel[] = [
  {
    id: "all-minilm-l6-v2",
    name: "all-MiniLM-L6-v2",
    size: "~90MB",
    dimensions: 384,
    maxTokens: 256,
    language: ["en", "fr"],
    downloadUrl: "https://huggingface.co/Xenova/all-MiniLM-L6-v2",
  },
  {
    id: "all-minilm-l12-v2",
    name: "all-MiniLM-L12-v2",
    size: "~120MB",
    dimensions: 384,
    maxTokens: 256,
    language: ["en", "fr"],
    downloadUrl: "https://huggingface.co/Xenova/all-MiniLM-L12-v2",
  },
];

// Knowledge bases pré-définies disponibles au téléchargement
export const PREDEFINED_KNOWLEDGE_BASES: PredefinedKnowledge[] = [
  {
    id: "wikipedia-fr-science",
    name: "Wikipedia France - Sciences",
    description:
      "Articles Wikipedia français sur les sciences, physique, chimie, biologie",
    size: "~150MB",
    chunks: 12000,
    downloadUrl: "/knowledge/wikipedia-fr-science.json.gz",
    version: "2024.11",
    tags: ["science", "physique", "chimie", "biologie", "français"],
    verified: true,
  },
  {
    id: "wikipedia-fr-history",
    name: "Wikipedia France - Histoire",
    description:
      "Articles Wikipedia français sur l'histoire mondiale et française",
    size: "~200MB",
    chunks: 18000,
    downloadUrl: "/knowledge/wikipedia-fr-history.json.gz",
    version: "2024.11",
    tags: ["histoire", "france", "monde", "français"],
    verified: true,
  },
  {
    id: "wikipedia-en-tech",
    name: "Wikipedia English - Technology",
    description:
      "English Wikipedia articles about programming, AI, web development",
    size: "~120MB",
    chunks: 9500,
    downloadUrl: "/knowledge/wikipedia-en-tech.json.gz",
    version: "2024.11",
    tags: ["technology", "programming", "ai", "web", "english"],
    verified: true,
  },
];

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  ragContext?: SearchResult[]; // Contexte RAG utilisé pour cette réponse
}

export interface ModelState {
  isLoading: boolean;
  isReady: boolean;
  progress: number;
  error: string | null;
  currentModel: ModelConfig | null;
}
