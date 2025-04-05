import './App.css';
import Dropdown from './modules/dropdowns';
import SendButton from './modules/sendButton';
import Pista from './modules/pista';

function App() {


  return (
    <div className="App">
      <header className="App-header" style={{backgroundColor: 'yellow'}}>
        <div >
        <h1 style={{color: 'black', fontFamily: "Winky Sans", fontSize: '3rem'}}>CAÇA DIÁRIO</h1>
        <Pista 
          type="string" 
          content="Conto duas historias de vingança que se entrelaçam. Todo perseguidor não encontra uma saída"
        />

        </div>

      <Dropdown />
      <SendButton />
      </header>
    </div>
  );
}

export default App;
