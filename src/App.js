import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Dropdown from './modules/dropdowns';
import SendButton from './modules/sendButton';
import Pista from './modules/pista';
import { useState, useEffect } from 'react';
import treasureChest from './images/treasure-chest.png';
import Login from './pages/Login';
import Register from './pages/Register';
import Maquininha from './pages/Maquininha';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './utils/LoadingSpinner';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function Ranking({ refreshTrigger }) {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const now = new Date();
  const seasonLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_URL}/caca_api/ranking`, {
          headers: { 'Authorization': `${localStorage.getItem('token')}` }
        });
        if (response.status === 403) {
          localStorage.clear();
          navigate('/login');
          return;
        }
        const data = await response.json();
        setRanking(data);
      } catch (error) {
        console.error('Error fetching ranking:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRanking();
  }, [navigate, refreshTrigger]);

  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '32px auto 0', padding: '0 16px' }}>
      <h2 style={{ color: 'black', fontFamily: "'Winky Sans', Arial, sans-serif", fontSize: '1.6rem', textAlign: 'center', marginBottom: '4px' }}>
        Ranking
      </h2>
      <p style={{ color: '#555', fontFamily: 'Arial, sans-serif', fontSize: '0.9rem', textAlign: 'center', marginBottom: '16px' }}>
        Temporada: {seasonLabel}
      </p>
      {isLoading ? (
        <LoadingSpinner />
      ) : ranking.length === 0 ? (
        <p style={{ color: '#555', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>Nenhuma pontuação ainda.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif', fontSize: '1rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid black' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'black' }}>#</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'black' }}>Jogador</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'black' }}>Pontos</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row) => (
              <tr key={row.username} style={{ borderBottom: '1px solid rgba(0,0,0,0.15)' }}>
                <td style={{ padding: '6px 8px', color: 'black' }}>{row.position}</td>
                <td style={{ padding: '6px 8px', color: 'black', fontWeight: row.position === 1 ? 'bold' : 'normal' }}>
                  {row.position === 1 ? '🥇 ' : row.position === 2 ? '🥈 ' : row.position === 3 ? '🥉 ' : ''}{row.username}
                </td>
                <td style={{ padding: '6px 8px', color: 'black', textAlign: 'right' }}>{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PlayPage() {
  const navigate = useNavigate();
  const [macro, setMacro] = useState('');
  const [micro, setMicro] = useState('');
  const [pistaContent, setPistaContent] = useState('');
  const [hasMicro, setHasMicro] = useState(true);
  const [alreadySolved, setAlreadySolved] = useState(false);
  const [rankingRefresh, setRankingRefresh] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPista = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_URL}/caca_api/daily_pista`, {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });

        if (response.status === 403) {
          localStorage.clear();
          navigate('/login');
          return;
        }

        const data = await response.json();
        setPistaContent(data.content);
        setHasMicro(data.has_micro);
        setAlreadySolved(data.already_solved);
      } catch (error) {
        console.error('Error fetching pista:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPista();
  }, [navigate]);

  const handleSolved = () => {
    setAlreadySolved(true);
    setRankingRefresh(r => r + 1);
  };

  return (
    <div className="App">
      <header className="App-header" style={{backgroundColor: 'yellow', position: 'relative'}}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <img
            src={treasureChest}
            alt="Treasure Chest"
            style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px' }}
          />
        </div>
        <div>
          <h1 style={{color: 'black', fontFamily: "Winky Sans", fontSize: '3rem'}}>CAÇA DIÁRIO</h1>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <Pista
              type="string"
              content={pistaContent}
            />
          )}
        </div>

        {alreadySolved ? (
          <p style={{ color: 'black', fontFamily: "'Winky Sans', Arial, sans-serif", fontSize: '1.4rem', marginTop: '20px', textAlign: 'center' }}>
            Você já acertou a pista de hoje, volte novamente amanhã
          </p>
        ) : (
          <>
            <Dropdown
              macro={macro}
              setMacro={setMacro}
              micro={micro}
              setMicro={setMicro}
              hasMicro={hasMicro}
            />
            <SendButton
              macro={macro}
              micro={micro}
              hasMicro={hasMicro}
              onSolved={handleSolved}
            />
          </>
        )}

        <Ranking refreshTrigger={rankingRefresh} />

        <button
          onClick={() => { localStorage.clear(); navigate('/login'); }}
          title="Logout"
          style={{ position: 'absolute', top: 12, right: 16, background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 4, display: 'flex', alignItems: 'center', gap: 4, color: '#333', fontSize: '0.75rem' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </header>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/play"
          element={
            <ProtectedRoute>
              <PlayPage />
            </ProtectedRoute>
          }
        />
        <Route path="/maquininha" element={<ProtectedRoute><Maquininha /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
