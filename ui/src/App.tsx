import VegaChart from './components/VegaChart';

function App() {
  return (
    <div
      style={{
        padding: '32px 40px',
        maxWidth: 1320,
        margin: '0 auto',
      }}
    >
      <h1 style={{ marginTop: 0, marginBottom: 20, textAlign: 'center' }}>AR Aging</h1>
      <VegaChart />
    </div>
  );
}

export default App;