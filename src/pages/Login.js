import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) {
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/play');
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="login-container" style={{ padding: '10px 20px' }}>
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '5px',
        border: '2px solid black',
        borderRadius: '8px'
      }}>
        <img 
          src={require('../images/work-in-progress.png')}
          alt="Work in Progress"
          style={{ 
            maxWidth: '150px',
            height: 'auto'
          }}
        />
        <p style={{ 
          fontSize: '1.2rem',
          fontWeight: 'bold',
          margin: '0',
          color: '#333'
        }}>Olá, a tela de login ainda está em desenvolvimento, por enquanto utilize qualquer username e password para entrar</p>
      </div>
      <div className="login-box" style={{ margin: '40px auto', maxWidth: '400px', width: '100%', boxSizing: 'border-box' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group" >
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>
        <div className="register-section">
          <p>Não tem uma conta?</p>
          <button onClick={handleRegister} className="register-button">
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login; 