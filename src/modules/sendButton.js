import React, { useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

const SendButton = ({ macro, micro }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  // Mock function to simulate API response
  const mockApiResponse = (macro, micro) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isCorrect = macro.toLowerCase() === "bio" && micro.toLowerCase() === "barco da bio";
        
        resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            guess_is_right: isCorrect
          })
        });
      }, 500);
    });
  };

  const handleSubmit = async () => {
    if (!macro || !micro) {
      alert('Por favor, selecione um macro e um micro antes de enviar.');
      return;
    }
    try {
      const response = process.env.NODE_ENV === 'development' 
        ? await mockApiResponse(macro, micro)
        : await fetch('/caca_api/daily/guess', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              macro,
              micro
            })
          });

      if (!response.ok) {
        throw new Error('Erro ao enviar resposta');
      }

      const data = await response.json();
      console.log('Resposta:', data);
      
      setSnackbarOpen(true);
      setSnackbarMessage(data.guess_is_right ? "Parabéns! Você acertou!" : "Tente novamente!");
      setSnackbarSeverity(data.guess_is_right ? "success" : "error");
      
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

  return (
    <>
      <button 
        onClick={handleSubmit}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? 'gray' : 'black',
          color: 'white',
          padding: '15px 30px',
          border: 'none',
          borderRadius: '5px',
          fontSize: '1.4rem',
          fontFamily: "'Winky Sans', Arial, sans-serif",
          cursor: isLoading ? 'not-allowed' : 'pointer',
          marginTop: '20px'
        }}
      >
        {isLoading ? 'Enviando...' : 'Enviar'}
      </button>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SendButton; 