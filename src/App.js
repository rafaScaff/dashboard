import './App.css';
import Dropdown from './modules/dropdowns';
import SendButton from './modules/sendButton';
import Pista from './modules/pista';
import { useState, useEffect } from 'react';
import treasureChest from './images/treasure-chest.png';

function App() {
  const [macro, setMacro] = useState('');
  const [micro, setMicro] = useState('');
  const [pistaContent, setPistaContent] = useState('');

  // Mock function to simulate API response
  const mockPistaResponse = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            content: "Conto duas historias de vingança que se entrelaçam. Todo perseguidor não encontra uma saída"
          })
        });
      }, 500);
    });
  };

  useEffect(() => {
    const fetchPista = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/caca_api/daily_pista`);
        const data = await response.json();
        setPistaContent(data.content);
      } catch (error) {
        console.error('Error fetching pista:', error);
      }
    };

    fetchPista();
  }, []);

  return (
    <div className="App">
      <header className="App-header" style={{backgroundColor: 'yellow'}}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <img 
          src={treasureChest} 
          alt="Treasure Chest" 
          style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px' }}
        />
      </div>
        <div >
        <h1 style={{color: 'black', fontFamily: "Winky Sans", fontSize: '3rem'}}>CAÇA DIÁRIO</h1>
        <Pista 
          type="string" 
          content={pistaContent}
        />
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
      </header>
    </div>
  );
}

export default App;
