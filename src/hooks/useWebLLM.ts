'use client';

import { useState, useCallback, useRef } from 'react';
import * as webllm from '@mlc-ai/web-llm';
import { ModelConfig, ModelState, ChatMessage } from '@/types/models';

export const useWebLLM = () => {
  const [modelState, setModelState] = useState<ModelState>({
    isLoading: false,
    isReady: false,
    progress: 0,
    error: null,
    currentModel: null
  });

  const engineRef = useRef<webllm.MLCEngine | null>(null);

  const initModel = useCallback(async (model: ModelConfig) => {
    try {
      setModelState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        progress: 0
      }));

      // Créer une nouvelle instance du moteur avec callback de progression
      const engine = new webllm.MLCEngine();
      
      // Configurer le callback de progression
      engine.setInitProgressCallback((progress: webllm.InitProgressReport) => {
        setModelState(prev => ({
          ...prev,
          progress: progress.progress * 100
        }));
      });

      // Initialiser le modèle
      await engine.reload(model.webllmId);
      
      engineRef.current = engine;

      setModelState(prev => ({
        ...prev,
        isLoading: false,
        isReady: true,
        progress: 100,
        currentModel: model
      }));

      console.log(`Modèle ${model.name} chargé avec succès !`);
      
    } catch (error) {
      console.error('Erreur lors du chargement du modèle:', error);
      setModelState(prev => ({
        ...prev,
        isLoading: false,
        isReady: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }));
    }
  }, []);

  const generateResponse = useCallback(async (
    messages: ChatMessage[],
    onUpdate?: (partialResponse: string) => void
  ): Promise<string> => {
    if (!engineRef.current || !modelState.isReady) {
      throw new Error('Le modèle n\'est pas prêt');
    }

    try {
      // Convertir les messages au format WebLLM
      const webllmMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      let fullResponse = '';
      
      // Génération avec streaming si callback fourni
      if (onUpdate) {
        const completion = await engineRef.current.chat.completions.create({
          messages: webllmMessages,
          stream: true,
          max_tokens: 1024,
          temperature: 0.5,
        });

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content || '';
          fullResponse += delta;
          onUpdate(fullResponse);
        }
      } else {
        // Génération simple sans streaming
        const completion = await engineRef.current.chat.completions.create({
          messages: webllmMessages,
          stream: false,
          max_tokens: 1024,
          temperature: 0.5,
        });

        fullResponse = completion.choices[0]?.message?.content || '';
      }

      return fullResponse;
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      throw error;
    }
  }, [modelState.isReady]);

  const unloadModel = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.unload();
      engineRef.current = null;
    }
    
    setModelState({
      isLoading: false,
      isReady: false,
      progress: 0,
      error: null,
      currentModel: null
    });
  }, []);

  return {
    modelState,
    initModel,
    generateResponse,
    unloadModel
  };
};