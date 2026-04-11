import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import LoadingSpinner from '../utils/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const SendButton = ({ macro, micro, hasMicro, onSolved }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [timeoutActive, setTimeoutActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const TIMEOUT_DURATION = 60;

  useEffect(() => {
    let timer;
    if (timeoutActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimeoutActive(false);
    }
    return () => clearInterval(timer);
  }, [timeoutActive, timeLeft]);

  const handleSubmit = async () => {
    if (!macro) {
      alert('Por favor, selecione um macro antes de enviar.');
      return;
    }
    try {
      setIsLoading(true);
      const payload = micro ? { macro, micro } : { macro };
      const response = await fetch(`${process.env.REACT_APP_API_URL}/caca_api/daily_pista/guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 403) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      if (response.status === 409) {
        setSnackbarOpen(true);
        setSnackbarMessage('Você já acertou o caça de hoje!');
        setSnackbarSeverity('info');
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao enviar resposta');
      }

      const data = await response.json();
      console.log('Resposta:', data);
      
      if (data.guess_result) {
        onSolved();
        return;
      }

      setSnackbarOpen(true);
      setSnackbarMessage("Tente novamente!");
      setSnackbarSeverity("error");
      setTimeoutActive(true);
      setTimeLeft(TIMEOUT_DURATION);
      
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao enviar resposta. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const isButtonDisabled = isLoading || timeoutActive;

  return (
    <>
      <button 
        onClick={handleSubmit}
        disabled={isButtonDisabled}
        style={{
          backgroundColor: isButtonDisabled ? 'gray' : 'black',
          color: 'white',
          padding: '15px 30px',
          border: 'none',
          borderRadius: '5px',
          fontSize: '1.4rem',
          fontFamily: "'Winky Sans', Arial, sans-serif",
          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
          marginTop: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          minWidth: '120px'
        }}
      >
        {isLoading ? (
          <LoadingSpinner size={20} color="white" />
        ) : timeoutActive ? (
          `Tente novamente em ${timeLeft}s`
        ) : (
          'Enviar'
        )}
      </button>
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ 
            width: '400px',
            fontSize: '1.2rem',
            '& .MuiAlert-message': {
              fontSize: '1.2rem',
            },
            '& .MuiAlert-icon': {
              fontSize: '2rem'
            }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SendButton; 