// src/hooks/useAppServices.js
import { useMemo } from 'react';
import { PistonService } from '../services/PistonService';
import { GeminiService } from '../services/GeminiService';

export const useAppServices = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  return useMemo(() => ({
    // İsmi 'piston' yapıyoruz (Hata buradan kaynaklanıyor)
    piston: new PistonService(),
    // İsmi 'ai' yapıyoruz
    ai: new GeminiService({ 
      apiKey: apiKey, 
      mock: !apiKey 
    }),
    nuget: {},
    git: {}
  }), [apiKey]);
};
