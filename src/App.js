import './App.css';
import Dropdown from './modules/dropdowns';
import SendButton from './modules/sendButton';
import Pista from './modules/pista';
import { useState } from 'react';
import treasureChest from './images/treasure-chest.png';

function App() {
  const [macro, setMacro] = useState('');
  const [micro, setMicro] = useState('');

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
          content="Conto duas historias de vingança que se entrelaçam. Todo perseguidor não encontra uma saída"
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
