import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/caca_api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.status === 401) {
        setError('Credenciais inválidas');
        return;
      }

      if (response.status === 404) {
        setError('Usuário não encontrado');
        return;
      }

      if (response.status === 403) {
        setError('Usuário desativado');
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao fazer login');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', username);
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/play');
    } catch (err) {
      setError(err.message || 'Ocorreu um erro ao tentar fazer login');
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="login-container" style={{ padding: '10px 20px' }}>
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
          {error && <p className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
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