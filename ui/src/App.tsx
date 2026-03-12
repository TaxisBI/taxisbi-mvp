import { useState } from 'react';
import VegaChart from './components/VegaChart';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const isDark = theme === 'dark';

  return (
    <div
      style={{
        padding: '32px 40px',
        maxWidth: 1320,
        margin: '0 auto',
        minHeight: '100vh',
        background: isDark ? '#0b1220' : '#f8fafc',
        color: isDark ? '#e5e7eb' : '#0f172a',
        transition: 'background-color 200ms ease, color 200ms ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          style={{
            border: '1px solid',
            borderColor: isDark ? '#334155' : '#cbd5e1',
            background: isDark ? '#111827' : '#ffffff',
            color: isDark ? '#e5e7eb' : '#0f172a',
            borderRadius: 8,
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {isDark ? 'Switch to Light' : 'Switch to Dark'}
        </button>
      </div>
      <h1 style={{ marginTop: 0, marginBottom: 20, textAlign: 'center' }}>AR Aging</h1>
      <VegaChart theme={theme} />
    </div>
  );
}

export default App;