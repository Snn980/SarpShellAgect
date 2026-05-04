import { useState, useCallback } from 'react';

/**
 * 📁 Çoklu dosya state yönetimi + çalıştırma mantığı
 * SRP: Sadece dosya state'inden sorumlu
 */
export const useFileState = (services) => {
  const [files, setFiles] = useState([
    { id: 'main', name: 'Program.cs', content: '// Kod buraya...', language: 'csharp' }
  ]);
  const [activeFileId, setActiveFileId] = useState('main');

  const activeFile = files.find(f => f.id === activeFileId);

  const updateFile = useCallback((fileId, updates) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, ...updates, modified: true } : f
    ));
  }, []);

  const runCode = useCallback(async (fileId = activeFileId) => {
    const file = files.find(f => f.id === fileId);
    if (!file) throw new Error('Dosya bulunamadı');
    
    return await services.piston.execute(file.content, file.language);
  }, [files, activeFileId, services]);

  return {
    files, activeFile, activeFileId,
    setActiveFileId, updateFile, runCode,
    addFile: (name, language, content = '') => {
      const id = `${name}-${Date.now()}`;
      setFiles(prev => [...prev, { id, name, content, language }]);
      return id;
    }
  };
};