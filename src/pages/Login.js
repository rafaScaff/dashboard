import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import LoadingSpinner from '../utils/LoadingSpinner';
import { getValidatedJWT, clearJWT, setJWT, validateJWT } from '../utils/jwtValidator';

function Login() {
  const [jwtToken, setJwtToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const navigate = useNavigate();

  // Verifica JWT ao carregar o componente
  useEffect(() => {
    const checkJWT = async () => {
      setIsValidating(true);
      const result = await getValidatedJWT();
      
      if (result.valid) {
        // JWT válido encontrado, salva informações e redireciona
        localStorage.setItem('token', 'jwt_authenticated');
        localStorage.setItem('username', result.payload.username || 'user');
        localStorage.setItem('isLoggedIn', 'true');
        navigate('/maquininha');
      } else {
        // JWT inválido ou não encontrado, limpa cookies e localStorage
        clearJWT();
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('isLoggedIn');
        setIsValidating(false);
      }
    };

    checkJWT();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      let tokenToValidate = jwtToken.trim();
      
      // Se não há token no campo, tenta pegar dos cookies
      if (!tokenToValidate) {
        const cookieResult = await getValidatedJWT();
        if (cookieResult.valid) {
          // JWT válido já está nos cookies, redireciona
          localStorage.setItem('token', 'jwt_authenticated');
          localStorage.setItem('username', cookieResult.payload.username || 'user');
          localStorage.setItem('isLoggedIn', 'true');
          navigate('/maquininha');
          return;
        } else {
          setError('Por favor, insira um token JWT válido.');
          setIsLoading(false);
          return;
        }
      }

      // Valida o token fornecido
      const result = await validateJWT(tokenToValidate);
      
      if (!result.valid) {
        setError(result.error || 'Token JWT inválido. Verifique se o token está correto.');
        setIsLoading(false);
        return;
      }

      // Token válido, salva nos cookies
      setJWT(tokenToValidate);
      setSuccess('Token JWT salvo com sucesso! Redirecionando...');
      
      // Salva informações no localStorage
      localStorage.setItem('token', 'jwt_authenticated');
      localStorage.setItem('username', result.payload.username || 'user');
      localStorage.setItem('isLoggedIn', 'true');
      
      // Redireciona após um pequeno delay
      setTimeout(() => {
        navigate('/maquininha');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Ocorreu um erro ao validar o token');
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="login-container" style={{ padding: '10px 20px' }}>
        <div className="login-box" style={{ margin: '40px auto', maxWidth: '400px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
          <LoadingSpinner size={40} color="#1976d2" />
          <p style={{ marginTop: '20px' }}>Validando token JWT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container" style={{ padding: '10px 20px' }}>
      <div className="login-box" style={{ margin: '40px auto', maxWidth: '500px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '10px' }}>Autenticação JWT</h2>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Cole seu token JWT abaixo para fazer login. O token será salvo nos cookies automaticamente.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label htmlFor="jwt-token" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Token JWT
            </label>
            <textarea
              id="jwt-token"
              value={jwtToken}
              onChange={(e) => setJwtToken(e.target.value)}
              placeholder="Cole seu token JWT aqui..."
              required
              disabled={isLoading}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>
          {error && (
            <p className="error-message" style={{ 
              color: 'red', 
              marginBottom: '10px', 
              fontSize: '14px',
              padding: '10px',
              background: '#ffe6e6',
              borderRadius: '4px',
              border: '1px solid #ff9999'
            }}>
              {error}
            </p>
          )}
          {success && (
            <p className="success-message" style={{ 
              color: 'green', 
              marginBottom: '10px', 
              fontSize: '14px',
              padding: '10px',
              background: '#e6ffe6',
              borderRadius: '4px',
              border: '1px solid #99ff99'
            }}>
              {success}
            </p>
          )}
          <button 
            type="submit" 
            disabled={isLoading || !jwtToken.trim()} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px',
              minWidth: '120px',
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              fontWeight: '500',
              backgroundColor: isLoading || !jwtToken.trim() ? '#ccc' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || !jwtToken.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size={20} color="white" />
                Validando...
              </>
            ) : (
              'Validar e Salvar Token'
            )}
          </button>
        </form>
        <div className="register-section" style={{ marginTop: '20px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
            Não tem um token JWT? Gere um usando o script:
          </p>
          <code style={{ 
            fontSize: '11px', 
            background: '#f5f5f5', 
            padding: '8px 12px', 
            borderRadius: '4px',
            display: 'inline-block',
            fontFamily: 'monospace'
          }}>
            node keys/generate_token.js &lt;username&gt;
          </code>
        </div>
      </div>
    </div>
  );
}

export default Login; 