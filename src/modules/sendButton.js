import React, { useState } from 'react';

const SendButton = ({ macro, micro }) => {
  const [isLoading, setIsLoading] = useState(false);

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
      
      // Mostra feedback para o usuário
      alert(data.guess_is_right ? "Parabéns! Você acertou!" : "Tente novamente!");
      
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao enviar resposta. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
  );
};

export default SendButton; 