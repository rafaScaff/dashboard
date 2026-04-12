import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Dropdown from './modules/dropdowns';
import SendButton from './modules/sendButton';
import Pista from './modules/pista';
import { useState, useEffect } from 'react';
import cecacinhalogo from './images/cecacinhalogo.png';
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
  const [pistaDate, setPistaDate] = useState('');
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
        if (data.start_date) {
          const d = new Date(data.start_date);
          const dd = String(d.getUTCDate()).padStart(2, '0');
          const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
          const yyyy = d.getUTCFullYear();
          setPistaDate(`${dd}/${mm}/${yyyy}`);
        }
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
    <div className="play-page">

      <div className="play-top-left">
        {pistaDate && (
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#333', fontFamily: 'Arial, sans-serif' }}>
            Pista do dia {pistaDate}
          </span>
        )}
        <button
          onClick={() => { localStorage.clear(); navigate('/login'); }}
          title="Logout"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', gap: 6, color: '#000', fontSize: '0.95rem', fontWeight: 600 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>

      <div className="play-wrapper">
        <img src={cecacinhalogo} alt="Cecacinha" className="play-logo" />
        <div className="play-card">
          <h1 style={{ color: 'black', fontFamily: 'Winky Sans', fontSize: '2.4rem', marginBottom: '0.5rem' }}>CAÇA DIÁRIO</h1>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <Pista type="string" content={pistaContent} />
          )}
          {alreadySolved ? (
            <p style={{ color: 'black', fontFamily: "'Winky Sans', Arial, sans-serif", fontSize: '1.2rem', marginTop: '20px' }}>
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
        </div>
      </div>

      <Ranking refreshTrigger={rankingRefresh} />

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
