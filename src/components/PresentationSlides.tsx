'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PresentationSlidesProps {
  onClose: () => void;
}

export default function PresentationSlides({ onClose }: PresentationSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    // Slide 1: Page de titre
    {
      type: 'title',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Chatbot WebGPU
          </h1>
          <p className="text-3xl mb-4 text-gray-700 dark:text-gray-300">
            Assistant IA Local et Privé
          </p>
          <div className="mt-12 space-y-4">
            <p className="text-2xl text-gray-600 dark:text-gray-400">Réalisé par :</p>
            <p className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
              Malcom CARLET
            </p>
            <p className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
              Georgios STEPHANOU
            </p>
          </div>
        </div>
      ),
    },
    // Slide 2: Contexte - La montée de l'IA
    {
      type: 'content',
      title: 'Contexte : La Montée en Puissance de l\'IA',
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">📈 Croissance Exponentielle</h3>
              <ul className="space-y-3 text-lg text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>ChatGPT : 100M utilisateurs en 2 mois</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>IA générative omniprésente</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Adoption massive dans tous les secteurs</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">⚠️ Problématique des Données</h3>
              <ul className="space-y-3 text-lg text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Données envoyées aux serveurs cloud</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Réutilisation pour l'entraînement</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Risques de confidentialité</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Schéma simplifié */}
          <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl mb-2">
                  👤
                </div>
                <p className="font-semibold">Utilisateur</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Données privées</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="text-4xl">➡️</div>
                <p className="text-xs text-gray-500 mt-1">Upload</p>
              </div>
              
              <div className="text-center">
                <div className="w-24 h-24 bg-purple-500 rounded-full flex items-center justify-center text-white text-4xl mb-2">
                  ☁️
                </div>
                <p className="font-semibold">Serveur Cloud</p>
                <p className="text-sm text-red-600 dark:text-red-400">Stockage + Entraînement</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="text-4xl">❌</div>
                <p className="text-xs text-red-500 mt-1">Risque</p>
              </div>
              
              <div className="text-center">
                <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white text-4xl mb-2">
                  🔓
                </div>
                <p className="font-semibold">Perte de contrôle</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Données exposées</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 3: Notre Solution
    {
      type: 'content',
      title: 'Notre Solution : IA 100% Locale',
      content: (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">
              ✅ Exécution Entièrement Côté Client
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Aucun serveur, aucune fuite de données, contrôle total
            </p>
          </div>

          {/* Schéma de notre solution */}
          <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center text-white text-5xl mb-2 shadow-lg">
                  👤
                </div>
                <p className="font-bold text-lg">Utilisateur</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Données privées</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="text-5xl">🔒</div>
                <p className="text-sm font-semibold text-green-600 mt-2">Chiffré localement</p>
              </div>
              
              <div className="text-center">
                <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center text-white text-5xl mb-2 shadow-lg">
                  💻
                </div>
                <p className="font-bold text-lg">Navigateur</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">WebGPU + WebLLM</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="text-5xl">✅</div>
                <p className="text-sm font-semibold text-green-600 mt-2">Tout reste local</p>
              </div>
              
              <div className="text-center">
                <div className="w-32 h-32 bg-purple-500 rounded-full flex items-center justify-center text-white text-5xl mb-2 shadow-lg">
                  🛡️
                </div>
                <p className="font-bold text-lg">Confidentialité</p>
                <p className="text-sm text-green-600 dark:text-green-400">100% garantie</p>
              </div>
            </div>
          </div>

          {/* Avantages */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
              <div className="text-3xl mb-2">🚀</div>
              <p className="font-semibold">Rapide</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">GPU local</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
              <div className="text-3xl mb-2">🔐</div>
              <p className="font-semibold">Privé</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Zéro serveur</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
              <div className="text-3xl mb-2">💰</div>
              <p className="font-semibold">Gratuit</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pas d'API</p>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 4: Technologies & Librairies
    {
      type: 'content',
      title: 'Technologies & Librairies Utilisées',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Colonne gauche */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-5 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                  🤖 IA & Inférence Locale
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span><strong>@mlc-ai/web-llm</strong> : Exécution des LLMs avec WebGPU</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span><strong>@xenova/transformers</strong> : Modèles d'embeddings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span><strong>WebGPU API</strong> : Accélération GPU native</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-5 rounded-lg border-l-4 border-green-500">
                <h3 className="text-xl font-bold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                  💾 Stockage & Persistance Client
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span><strong>IndexedDB API</strong> : Base de données locale</span>
                  </li>
                  <li className="pl-6 text-xs text-gray-600 dark:text-gray-400">
                    → Conversations & historique
                  </li>
                  <li className="pl-6 text-xs text-gray-600 dark:text-gray-400">
                    → Bases de connaissances & embeddings
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span><strong>Cache Storage API</strong> : Cache des modèles ML</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Colonne droite */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-5 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-xl font-bold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                  📄 Traitement de Documents
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <span><strong>Fetch API</strong> : Import Wikipedia & web</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <span><strong>Chunking intelligent</strong> : Découpage avec overlap</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <span><strong>Text extraction</strong> : Parsing de contenu</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-5 rounded-lg border-l-4 border-orange-500">
                <h3 className="text-xl font-bold text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-2">
                  🧮 Algorithmes & Calculs
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span><strong>Similarité cosinus</strong> : Recherche vectorielle</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span><strong>Citation extraction</strong> : Détection des sources</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span><strong>Vector search</strong> : Recherche sémantique rapide</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Framework support */}
          <div className="text-center bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Framework:</strong> Next.js 15 • React 19 • TypeScript • Tailwind CSS
            </p>
          </div>
        </div>
      ),
    },
    // Slide 5: Système RAG
    {
      type: 'content',
      title: 'Système RAG (Retrieval-Augmented Generation)',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-4">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Combiner <strong className="text-blue-600">recherche documentaire</strong> + <strong className="text-purple-600">génération IA</strong> pour des réponses précises et sourcées
            </p>
          </div>

          {/* Schéma du pipeline RAG */}
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg">
            {/* Partie 1: Indexation */}
            <div className="mb-8">
              <h4 className="text-center text-lg font-bold text-blue-600 dark:text-blue-400 mb-4">📚 Phase 1 : Indexation des Documents</h4>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="w-20 h-20 bg-blue-500 rounded-lg flex items-center justify-center text-white text-3xl mx-auto mb-2 shadow">
                    📄
                  </div>
                  <p className="text-sm font-semibold">Documents</p>
                  <p className="text-xs text-gray-500">Texte, Wikipedia</p>
                </div>
                
                <div className="text-3xl text-gray-400">→</div>
                
                <div className="text-center flex-1">
                  <div className="w-20 h-20 bg-purple-500 rounded-lg flex items-center justify-center text-white text-3xl mx-auto mb-2 shadow">
                    ✂️
                  </div>
                  <p className="text-sm font-semibold">Chunking</p>
                  <p className="text-xs text-gray-500">Découpage intelligent</p>
                </div>
                
                <div className="text-3xl text-gray-400">→</div>
                
                <div className="text-center flex-1">
                  <div className="w-20 h-20 bg-pink-500 rounded-lg flex items-center justify-center text-white text-3xl mx-auto mb-2 shadow">
                    🧬
                  </div>
                  <p className="text-sm font-semibold">Embeddings</p>
                  <p className="text-xs text-gray-500">Vecteurs 384D</p>
                </div>
                
                <div className="text-3xl text-gray-400">→</div>
                
                <div className="text-center flex-1">
                  <div className="w-20 h-20 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-3xl mx-auto mb-2 shadow">
                    💾
                  </div>
                  <p className="text-sm font-semibold">IndexedDB</p>
                  <p className="text-xs text-gray-500">Stockage local</p>
                </div>
              </div>
            </div>

            {/* Partie 2: Recherche & Génération */}
            <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-6">
              <h4 className="text-center text-lg font-bold text-green-600 dark:text-green-400 mb-4">💬 Phase 2 : Réponse à la Question</h4>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="w-20 h-20 bg-green-500 rounded-lg flex items-center justify-center text-white text-3xl mx-auto mb-2 shadow">
                    ❓
                  </div>
                  <p className="text-sm font-semibold">Question</p>
                  <p className="text-xs text-gray-500">Utilisateur</p>
                </div>
                
                <div className="text-3xl text-gray-400">→</div>
                
                <div className="text-center flex-1">
                  <div className="w-20 h-20 bg-teal-500 rounded-lg flex items-center justify-center text-white text-3xl mx-auto mb-2 shadow">
                    🔍
                  </div>
                  <p className="text-sm font-semibold">Recherche</p>
                  <p className="text-xs text-gray-500">Similarité cosinus</p>
                </div>
                
                <div className="text-3xl text-gray-400">→</div>
                
                <div className="text-center flex-1">
                  <div className="w-20 h-20 bg-yellow-500 rounded-lg flex items-center justify-center text-white text-3xl mx-auto mb-2 shadow">
                    📋
                  </div>
                  <p className="text-sm font-semibold">Contexte</p>
                  <p className="text-xs text-gray-500">Top K chunks</p>
                </div>
                
                <div className="text-3xl text-gray-400">→</div>
                
                <div className="text-center flex-1">
                  <div className="w-20 h-20 bg-red-500 rounded-lg flex items-center justify-center text-white text-3xl mx-auto mb-2 shadow">
                    🤖
                  </div>
                  <p className="text-sm font-semibold">LLM</p>
                  <p className="text-xs text-gray-500">Génération</p>
                </div>
                
                <div className="text-3xl text-gray-400">→</div>
                
                <div className="text-center flex-1">
                  <div className="w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center text-white text-3xl mx-auto mb-2 shadow">
                    ✅
                  </div>
                  <p className="text-sm font-semibold">Réponse</p>
                  <p className="text-xs text-gray-500">+ Citations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Avantages du RAG */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center border-t-4 border-green-500">
              <div className="text-3xl mb-2">🎯</div>
              <p className="font-semibold">Précision</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Réponses basées sur vos documents</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center border-t-4 border-blue-500">
              <div className="text-3xl mb-2">📚</div>
              <p className="font-semibold">Sources</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Traçabilité complète</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center border-t-4 border-purple-500">
              <div className="text-3xl mb-2">🔄</div>
              <p className="font-semibold">Actualisation</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Ajoutez vos propres données</p>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 6: Fonctionnalités Clés
    {
      type: 'content',
      title: 'Fonctionnalités Clés de la Plateforme',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-2xl shadow">
                  💬
                </div>
                <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300">Multi-Conversations</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">✓</span>
                  <span>Gestion de plusieurs discussions simultanées</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">✓</span>
                  <span>Historique complet sauvegardé localement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">✓</span>
                  <span>Renommage et suppression faciles</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white text-2xl shadow">
                  📚
                </div>
                <h3 className="text-xl font-bold text-purple-700 dark:text-purple-300">Knowledge Base</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">✓</span>
                  <span>Import de documents texte et fichiers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">✓</span>
                  <span>Intégration Wikipedia automatique</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">✓</span>
                  <span>Gestion de multiples bases de connaissances</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-6 rounded-xl shadow-lg border-l-4 border-green-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-2xl shadow">
                  🔍
                </div>
                <h3 className="text-xl font-bold text-green-700 dark:text-green-300">Recherche Sémantique</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Embeddings vectoriels 384 dimensions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Similarité cosinus pour le matching</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Réglage du seuil et nombre de résultats</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white text-2xl shadow">
                  📑
                </div>
                <h3 className="text-xl font-bold text-orange-700 dark:text-orange-300">Citations Précises</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">✓</span>
                  <span>Identification des sources utilisées</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">✓</span>
                  <span>Extraits exacts des passages référencés</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">✓</span>
                  <span>Traçabilité complète des réponses</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Highlight principal */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl shadow-2xl text-center">
            <div className="text-4xl mb-3">🔐</div>
            <h3 className="text-2xl font-bold mb-2">100% Local & Privé</h3>
            <p className="text-lg">
              Tous les modèles, données et calculs restent dans votre navigateur. 
              <strong> Zéro serveur, zéro fuite de données.</strong>
            </p>
          </div>
        </div>
      ),
    },
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="bg-white dark:bg-gray-900 w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-3 border-b dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Slide {currentSlide + 1} / {slides.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Fermer la présentation"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Slide Content */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden min-h-0">
          <div className="w-full max-w-7xl flex flex-col max-h-full">
            {slides[currentSlide].type === 'content' && (
              <h2 className="text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex-shrink-0">
                {slides[currentSlide].title}
              </h2>
            )}
            <div className="flex-1 overflow-auto">
              {slides[currentSlide].content}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center p-4 border-t dark:border-gray-700">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Précédent</span>
          </button>

          {/* Slide indicators */}
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                }`}
                aria-label={`Aller à la slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Suivant</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
