import React from 'react';

const SendButton = () => {
  return (
    <button 
      style={{
        backgroundColor: 'black',
        color: 'white',
        padding: '15px 30px',
        border: 'none',
        borderRadius: '5px',
        fontSize: '1.4rem',
        fontFamily: "'Winky Sans', Arial, sans-serif",
        cursor: 'pointer',
        marginTop: '20px'
      }}
    >
      Enviar
    </button>
  );
};

export default SendButton; 