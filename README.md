# 🤖 Chatbot WebGPU - Assistant IA Local avec RAG

Un chatbot intelligent fonctionnant **100% en local** dans le navigateur, propulsé par WebGPU et doté d'un système RAG (Retrieval-Augmented Generation) avancé pour exploiter vos propres bases de connaissances.

## 🌐 Démo en Ligne

**👉 [Essayer la démo maintenant](https://chat-webgpu.onrender.com/) 👈**

Testez directement l'application sans installation !

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.0.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![WebLLM](https://img.shields.io/badge/WebLLM-0.2.79-green)

## ✨ Fonctionnalités Principales

### 🧠 **Intelligence Artificielle Locale**
- **Modèles IA** s'exécutant directement dans le navigateur via WebGPU
- **Aucun serveur externe** - Confidentialité totale
- **4 modèles optimisés** de 1B à 8B paramètres
- **Streaming en temps réel** des réponses

### 💾 **Système de Conversations**
- **Gestion multi-conversations** avec historique persistant
- **Renommage à la volée** en cliquant sur le titre
- **Stockage local** via IndexedDB
- **Recherche** dans l'historique des conversations

### 📚 **RAG (Retrieval-Augmented Generation)**
- **Bases de connaissances personnalisées** 
- **Import multi-sources** : fichiers TXT, Wikipedia
- **Embeddings locaux** avec Transformers.js
- **Recherche sémantique** intelligent
- **Affichage des sources** utilisées dans les réponses

### 🌐 **Import de Connaissances**
- **Wikipedia français** : Recherche et import d'articles complets
- **Fichiers texte** : Support .txt avec validation
- **Chunking intelligent** avec options configurables
- **Métadonnées enrichies** (taille, nombre de chunks, date)

---

## 🛠️ Technologies Utilisées

### **Frontend & Framework**
- **Next.js 16.0.1** - Framework React avec App Router
- **React 19.2.0** - Interface utilisateur réactive
- **TypeScript 5.x** - Typage statique
- **Tailwind CSS 4.x** - Styling avec mode sombre
- **React Compiler** - Optimisations automatiques

### **Intelligence Artificielle**
- **WebLLM (@mlc-ai/web-llm)** - Modèles LLM dans le navigateur
- **Transformers.js (@xenova/transformers)** - Modèles d'embedding
- **WebGPU** - Accélération GPU native
- **SharedArrayBuffer** - Performance optimisée

### **Stockage & Données**
- **IndexedDB** - Base de données locale du navigateur
- **JSON** - Sérialisation des données
- **Blob Storage** - Gestion des gros volumes

---

## 🤖 Modèles d'IA Disponibles

### **Modèles de Chat (WebLLM)**

| Modèle | Taille | RAM Min | Vitesse | Qualité | Mobile | Description |
|--------|--------|---------|---------|---------|---------|-------------|
| **Llama 3.2 1B** | ~2.5GB | 4GB | Rapide | Bon | ✅ | Petit Llama, adapté au RAG très simple ou local search |
| **Phi-3.5 3.8B** | ~5.5GB | 8GB | Rapide | Excellent | ❌ | Un des meilleurs modèles <4B pour du vrai RAG sérieux |
| **Qwen 2.5 3B** | ~6GB | 8GB | Très rapide | Excellent | ❌ | Très bon grounding, excellent sur RAG multi-chunks |
| **Llama 3.1 8B** | ~12GB | 12GB | Lent | Excellent | ❌ | Pour du RAG avancé avec contexte large. Très fiable |

### **Modèles d'Embedding (Transformers.js)**

| Modèle | Taille | Dimensions | Langues | Usage |
|--------|--------|------------|---------|-------|
| **all-MiniLM-L6-v2** | ~90MB | 384D | EN/FR | Rapide, qualité correcte |
| **all-MiniLM-L12-v2** | ~120MB | 384D | EN/FR | Plus lent, meilleure qualité |

---

## 🏗️ Architecture du Système

### **Structure des Composants**

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Interface principale
│   ├── layout.tsx               # Layout global
│   └── api/extract-text/        # API extraction de texte
├── components/                   # Composants React
│   ├── ConversationSidebar.tsx  # Gestion conversations
│   ├── KnowledgeManager.tsx     # Gestion des bases de données
│   ├── ModelSelector.tsx        # Sélection de modèle
│   ├── RAGControls.tsx         # Contrôles RAG
│   └── WikipediaImporter.tsx   # Import Wikipedia
├── hooks/                       # React Hooks
│   ├── useWebLLM.ts            # Gestion modèles WebLLM
│   ├── useConversations.ts     # Gestion conversations
│   └── useKnowledgeBase.ts     # Gestion bases de connaissances
├── lib/                         # Bibliothèques utilitaires
│   ├── embedding.ts            # Gestion embeddings
│   ├── rag.ts                  # Système RAG
│   ├── documentProcessor.ts    # Traitement documents
│   ├── conversationStorage.ts  # Stockage conversations
│   ├── indexedDB.ts           # Base de données locale
│   └── wikipediaService.ts    # Service Wikipedia
└── types/                      # Définitions TypeScript
    ├── models.ts              # Types modèles IA
    └── conversation.ts        # Types conversations
```

---

## 📊 Fonctionnement du RAG

### **Pipeline de Traitement des Documents**

1. **📥 Import de Sources**
   - Upload de fichiers .txt
   - Recherche et import d'articles Wikipedia
   - Validation du contenu

2. **✂️ Chunking Intelligent**
   ```typescript
   interface ChunkingOptions {
     chunkSize: 512,        // Taille des chunks
     chunkOverlap: 50,      // Chevauchement
     splitOn: 'sentence',   // Découpage par phrase
     minChunkSize: 100,     // Taille minimale
     maxChunkSize: 1000     // Taille maximale
   }
   ```

3. **🧮 Génération d'Embeddings**
   - Modèle all-MiniLM-L6-v2 (384 dimensions)
   - Calcul local avec Transformers.js
   - Stockage dans IndexedDB

4. **🔍 Recherche Sémantique**
   ```typescript
   // Recherche par similarité cosinus
   const results = await ragManager.search(
     query,
     knowledgeBase,
     {
       maxResults: 5,
       threshold: 0.7
     }
   );
   ```

5. **💬 Augmentation du Context**
   - Injection des chunks pertinents
   - Enrichissement du prompt utilisateur
   - Génération de réponse contextualisée

### **Exemple de Workflow RAG**

```typescript
// 1. Question utilisateur
const userQuery = "Comment fonctionne l'intelligence artificielle ?"

// 2. Recherche dans la base de connaissances
const relevantChunks = await ragManager.search(userQuery, knowledgeBase)

// 3. Construction du context enrichi
const contextualPrompt = `
Contexte : ${relevantChunks.map(c => c.content).join('\n')}

Question : ${userQuery}
`

// 4. Génération avec le modèle LLM
const response = await engine.generateResponse(contextualPrompt)
```

---

## ⚙️ Configuration & Optimisations

### **Next.js Configuration**

```typescript
// next.config.ts
const nextConfig = {
  // Support WebAssembly pour WebLLM
  webpack: (config) => ({
    ...config,
    experiments: {
      asyncWebAssembly: true,
      layers: true
    }
  }),
  
  // Headers COOP/COEP pour SharedArrayBuffer
  headers: async () => [{
    source: '/:path*',
    headers: [
      { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }
    ]
  }]
}
```

### **Optimisations Performance**

- **Quantization Q4** pour les modèles LLM (4x plus petit)
- **Chunking adaptatif** selon la taille du document
- **Cache des embeddings** pour éviter les recalculs
- **Lazy loading** des composants lourds
- **IndexedDB avec index** pour les recherches rapides

---

## 🚀 Installation & Utilisation

### **Prérequis**
- **Navigateur compatible WebGPU** (Chrome/Edge 113+, Firefox Nightly)
- **RAM minimum** : 4GB pour les petits modèles, 8GB recommandé
- **Connexion internet** uniquement pour le téléchargement initial des modèles

### **Installation**

```bash
# Cloner le repository
git clone <repository-url>
cd chatbot-webgpu

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Ou build pour production
npm run build
npm start
```

### **Première Utilisation**

1. **🔧 Sélectionner un modèle IA**
   - Cliquer sur "Sélectionner un modèle" dans le header
   - Choisir selon votre RAM disponible
   - Attendre le téléchargement (une seule fois)

2. **📚 Créer une base de connaissances (optionnel)**
   - Aller dans l'onglet "Knowledge"
   - Charger un modèle d'embedding
   - Importer des fichiers ou articles Wikipedia
   - Attendre le traitement

3. **💬 Commencer à chatter**
   - Revenir à l'onglet "Chat"
   - Activer le RAG si vous avez des bases de connaissances
   - Poser vos questions !

---

## 🎯 Cas d'Usage

### **📖 Assistant Documentation**
- Import de documentation technique
- Réponses précises basées sur vos docs
- Sources citées automatiquement

### **🎓 Tuteur Personnalisé**
- Import de cours et supports
- Explications contextualisées
- Apprentissage adapté à vos contenus

### **🔍 Analyseur de Corpus**
- Traitement de gros volumes de texte
- Recherche sémantique avancée
- Synthèses et résumés intelligents

### **🌐 Explorateur Wikipedia**
- Import d'articles complets
- Base de connaissances thématique
- Questions-réponses factuelles

---

## 📈 Métriques & Performances

### **Tailles de Modèles**
- **Llama 3.2 1B** : ~2.5GB (compact et efficace)
- **Phi-3.5 3.8B** : ~5.5GB (recommandé pour RAG)
- **Qwen 2.5 3B** : ~6GB (excellente qualité/vitesse)
- **Llama 3.1 8B** : ~12GB (RAG avancé)
- **Embeddings** : ~90-120MB

### **Performance Type**
- **Première génération** : 2-5 secondes (selon modèle)
- **Générations suivantes** : 0.5-2 secondes
- **Recherche RAG** : <100ms pour 1000 chunks
- **Import Wikipedia** : 1-5 secondes par article

### **Limites Techniques**
- **Context window** : 2048-4096 tokens selon le modèle
- **Chunks par requête** : 3-5 recommandé
- **Taille max document** : 10MB par fichier
- **Storage browser** : Limité par IndexedDB (~50-100GB)

---

## 🔧 API & Extensibilité

### **Services Principaux**

```typescript
// WebLLM Engine
const { initModel, generateResponse } = useWebLLM()

// Knowledge Management
const { createKnowledgeBase, deleteKnowledgeBase } = useKnowledgeBase()

// RAG System
const results = await ragManager.search(query, knowledgeBase)

// Wikipedia Service
const article = await wikipediaService.getArticleContent(title)
```

### **Types TypeScript**

```typescript
interface KnowledgeBase {
  id: string
  name: string
  description: string
  chunks: DocumentChunk[]
  totalDocuments: number
  totalChunks: number
  sizeBytes: number
  createdAt: Date
}

interface DocumentChunk {
  id: string
  content: string
  embedding: number[]
  metadata: {
    sourceName: string
    chunkIndex: number
    startChar: number
    endChar: number
  }
}
```

---

## 🛡️ Sécurité & Confidentialité

### **🔒 100% Local**
- **Aucune donnée envoyée** vers des serveurs externes
- **Modèles s'exécutent** entièrement dans le navigateur
- **Stockage local** via IndexedDB sécurisé

### **🛠️ Contrôle Total**
- **Code source ouvert** et auditable
- **Pas de télémétrie** ou tracking
- **Modèles offline** après téléchargement initial

### **⚡ Performance WebGPU**
- **Accélération GPU native** pour l'inférence
- **Optimisations WASM** pour les calculs
- **Memory mapping** efficace

---

## 🔮 Roadmap & Extensions Futures

### **🎯 Fonctionnalités Prévues**
- [ ] Support formats additionnels (PDF, DOCX, EPUB)
- [ ] Import depuis URLs web avec scraping
- [ ] Transcription vidéos YouTube (Whisper local)
- [ ] Modèles d'embedding multilingues
- [ ] Export/Import des bases de connaissances
- [ ] API REST pour intégrations externes

### **🚀 Optimisations Techniques**
- [ ] Quantization INT8 pour modèles plus légers
- [ ] Worker threads pour embeddings
- [ ] Progressive loading des gros modèles
- [ ] Compression avancée des chunks
- [ ] Cache intelligent multi-sessions

---

## 📋 Dépendances

### **Production**
```json
{
  "@mlc-ai/web-llm": "^0.2.79",      // Moteur LLM WebGPU
  "@xenova/transformers": "^2.17.2",  // Embeddings & NLP
  "next": "16.0.1",                   // Framework React
  "react": "19.2.0",                  // UI Library
  "formidable": "^3.5.4",            // Upload de fichiers
  "lucide-react": "^0.555.0",        // Icônes
  "mammoth": "^1.11.0",              // Parsing DOCX
  "pdf-parse": "^2.4.5"              // Parsing PDF
}
```

### **Développement**
```json
{
  "typescript": "^5",                 // Typage statique
  "tailwindcss": "^4",               // CSS Framework
  "eslint": "^9",                    // Linting
  "babel-plugin-react-compiler": "1.0.0" // Optimisations React
}
```

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- 🐛 Signaler des bugs
- 💡 Proposer de nouvelles fonctionnalités  
- 🔧 Soumettre des Pull Requests
- 📖 Améliorer la documentation

---

## 📞 Support

Pour toute question ou problème :
- 📧 **Issues GitHub** : Problèmes techniques
- 💬 **Discussions** : Questions générales
- 📚 **Wiki** : Documentation complète

---

**Développé avec ❤️ pour une IA accessible et respectueuse de la vie privée**
