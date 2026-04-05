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

function PlayPage() {
  const navigate = useNavigate();
  const [macro, setMacro] = useState('');
  const [micro, setMicro] = useState('');
  const [pistaContent, setPistaContent] = useState('');
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
      } catch (error) {
        console.error('Error fetching pista:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPista();
  }, [navigate]);

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

        <Dropdown 
          macro={macro}
          setMacro={setMacro}
          micro={micro}
          setMicro={setMicro}
        />
        <SendButton
          macro={macro}
          micro={micro}
        />
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
