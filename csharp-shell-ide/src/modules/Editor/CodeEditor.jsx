/**
 * @file CodeEditor.jsx
 */
import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { SNIPPETS } from '../../constants/snippets.js';

// Test için varsayılan C# kodu (Piston ve Gemini testine uygun)
const DEFAULT_CS_CODE = `using System;
using System.Collections.Generic;
using System.Linq;

class Program {
    static void Main() {
        // Piston API Testi
        Console.WriteLine("🚀 SarpShell C# Engine Aktif!");
        
        var numbers = new List<int> { 1, 2, 3, 4, 5 };
        var query = numbers.Where(n => n > 2).Sum();
        
        Console.WriteLine($"LINQ Test Sonucu (Sum > 2): {query}");
        Console.WriteLine("------------------------------------");
        
        // Gemini API etkileşimi için buraya yorum bırakabilirsin
        // TODO: Agent panelinden bu kodu optimize etmesini isteyin.
    }
}`;

export function CodeEditor({ code, onChange, settings, isMobile }) {
  const editorRef = useRef(null);

  // Eğer kod boşsa varsayılan test kodunu yükle
  const currentVal = code || DEFAULT_CS_CODE;

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const insertAtCursor = (text) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const selection = editor.getSelection();
      editor.executeEdits("source", [{
        range: selection,
        text: text,
        forceMoveMarkers: true
      }]);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ flex: 1 }}>
        <Editor
          height="100%"
          language="csharp"
          theme={settings.theme === 'dark' ? 'vs-dark' : 'light'}
          value={currentVal}
          onChange={(v) => onChange(v || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: settings.fontSize,
            minimap: { enabled: !isMobile },
            wordWrap: 'on',
            automaticLayout: true,
            padding: { top: 10 }
          }}
        />
      </div>

      {!isMobile && (
        <aside style={{ width: '160px', background: '#252526', borderLeft: '1px solid #333', overflowY: 'auto' }}>
          <div style={{ padding: '10px', fontSize: '11px', color: '#858585', borderBottom: '1px solid #333' }}>📋 SNIPPETS</div>
          {SNIPPETS.map(s => (
            <button key={s.label} onClick={() => onChange(s.code)} style={{ width: '100%', padding: '8px', background: 'none', border: 'none', color: '#9CDCFE', cursor: 'pointer', textAlign: 'left', fontSize: '12px', borderBottom: '1px solid #2d2d2d' }}>
              {s.label}
            </button>
          ))}
        </aside>
      )}

      {isMobile && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', background: '#1e1e1e', padding: '5px', gap: '5px', overflowX: 'auto', zIndex: 100 }}>
          {['{', '}', '(', ')', ';', '=>', '"'].map(sym => (
            <button key={sym} onClick={() => insertAtCursor(sym)} style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px' }}>{sym}</button>
          ))}
        </div>
      )}
    </div>
  );
}
