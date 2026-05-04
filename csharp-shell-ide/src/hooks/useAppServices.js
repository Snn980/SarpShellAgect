// src/hooks/useAppServices.js
import { useMemo } from 'react';
import { PistonService } from '../services/PistonService';
import { GeminiService } from '../services/GeminiService';

export const useAppServices = () => {
  return useMemo(() => ({
    piston: new PistonService(),
    ai: new GeminiService({ mock: !import.meta.env.VITE_GEMINI_API_KEY }),
    terminal: {}, git: {}, nuget: {}, import: {}, linter: {}
  }), []);
};
