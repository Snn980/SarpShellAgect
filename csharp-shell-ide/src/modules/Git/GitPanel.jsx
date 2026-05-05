// src/modules/Git/GitPanel.jsx
import React, { useState } from 'react';

export function GitPanel({ services, currentFile }) {
  const [commitMessage, setCommitMessage] = useState('');
  const [branch, setBranch] = useState('main');
  const [status, setStatus] = useState('Ready');

  const git = services?.git || {};

  const handleInit = () => {
    git.init?.();
    setStatus('Git repository initialized ✅');
  };

  const handleStage = () => {
    git.stage?.(currentFile?.name || 'Program.cs');
    setStatus('Changes staged ✅');
  };

  const handleCommit = () => {
    if (!commitMessage.trim()) {
      setStatus('Commit mesajı girin!');
      return;
    }
    git.commit?.(commitMessage);
    setStatus(`Commit yapıldı: ${commitMessage}`);
    setCommitMessage('');
  };

  const handlePush = () => {
    git.push?.();
    setStatus('Pushed to remote (simülasyon)');
  };

  return (
    <div style={{
      height: '100%',
      padding: '20px',
      background: '#1e1e1e',
      color: '#d4d4d4',
      overflow: 'auto'
    }}>
      <h2>🔀 Git Kontrol Paneli</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>
        Mevcut dosya: <strong>{currentFile?.name || 'Untitled.cs'}</strong>
      </p>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleInit} style={btnStyle}>Initialize Git</button>
        <button onClick={handleStage} style={btnStyle}>Stage Current File</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit mesajı yazın..."
          style={{
            width: '100%',
            padding: '10px',
            background: '#252526',
            border: '1px solid #3c3c3c',
            color: '#fff',
            borderRadius: '4px',
            marginBottom: '10px'
          }}
        />
        <button onClick={handleCommit} style={btnStyle}>Commit</button>
      </div>

      <div>
        <button onClick={handlePush} style={btnStyle}>Push to Remote</button>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '15px',
        background: '#252526',
        borderRadius: '6px',
        fontFamily: 'monospace'
      }}>
        <strong>Status:</strong> {status}
      </div>

      <div style={{ marginTop: '20px', color: '#666', fontSize: '0.9rem' }}>
        Not: Bu şu anda simülasyon modundadır. Gerçek Git entegrasyonu daha sonra eklenecektir.
      </div>
    </div>
  );
}

const btnStyle = {
  padding: '10px 16px',
  marginRight: '10px',
  background: '#007acc',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  marginBottom: '10px'
};
