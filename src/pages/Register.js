import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setShowPopup(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!username || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/caca_api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.status === 409) {
        setError('Este nome de usuário já está em uso');
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao registrar usuário');
      }

      setShowSuccessPopup(true);
    } catch (err) {
      setError(err.message || 'Ocorreu um erro ao tentar registrar');
    }
  };

  const handleSuccessPopupClose = () => {
    setShowSuccessPopup(false);
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="register-container" style={{ padding: '10px 20px' }}>
      {showPopup && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          zIndex: 1000,
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center'
        }}>
          <span style={{ 
            fontSize: '3rem',
            display: 'block',
            marginBottom: '15px'
          }}>🚨</span>
          <p style={{ 
            fontSize: '1.2rem',
            fontWeight: 'bold',
            margin: '0',
            color: '#333'
          }}>ATENÇÂO!!! NÃO EXISTE NENHUM TRATAMENTO PARA A SENHA COLOCADA, OU SEJA EU CONSIGO VER A SUA SENHA! NÃO UTILIZE NENHUMA SENHA PADRÃO</p>
          <button 
            onClick={() => setShowPopup(false)}
            style={{
              marginTop: '20px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>
        </div>
      )}

      {showSuccessPopup && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          zIndex: 1000,
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center'
        }}>
          <span style={{ 
            fontSize: '3rem',
            display: 'block',
            marginBottom: '15px'
          }}>✅</span>
          <p style={{ 
            fontSize: '1.2rem',
            fontWeight: 'bold',
            margin: '0',
            color: '#333'
          }}>Usuário registrado com sucesso!</p>
          <button 
            onClick={handleSuccessPopupClose}
            style={{
              marginTop: '20px',
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Ir para Login
          </button>
        </div>
      )}

      <div className="register-box" style={{ margin: '40px auto', maxWidth: '400px', width: '100%', boxSizing: 'border-box' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
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
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit">Register</button>
        </form>
        <div className="login-section">
          <p>Já tem uma conta?</p>
          <button onClick={handleLogin} className="login-button">
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register; 