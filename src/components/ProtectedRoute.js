import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getValidatedJWT } from '../utils/jwtValidator';
import LoadingSpinner from '../utils/LoadingSpinner';

function ProtectedRoute({ children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      // Verifica localStorage primeiro (para compatibilidade)
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      if (isLoggedIn) {
        // Valida JWT dos cookies
        const result = await getValidatedJWT();
        
        if (result.valid) {
          setIsAuthenticated(true);
        } else {
          // JWT inválido, limpa autenticação
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('token');
          localStorage.removeItem('username');
        }
      }
      
      setIsValidating(false);
    };

    validateAuth();
  }, []);

  if (isValidating) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <LoadingSpinner size={40} color="#1976d2" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute; 