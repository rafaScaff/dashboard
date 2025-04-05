import React from 'react';
import PropTypes from 'prop-types';

const Pista = ({ type, content }) => {
  if (type === 'string') {
    return (
      <h2 
        style={{
          color: 'black', 
          fontFamily: "'Roboto', Arial, sans-serif", 
          fontSize: '1.5rem'
        }}
      >
        {content}
      </h2>
    );
  }

  if (type === 'image') {
    return (
      <img 
        src={content.startsWith('data:image') ? content : `data:image/jpeg;base64,${content}`}
        alt="Pista"
        style={{
          maxWidth: '100%',
          height: 'auto',
          marginTop: '1rem',
          marginBottom: '1rem'
        }}
      />
    );
  }

  return null;
};

Pista.propTypes = {
  type: PropTypes.oneOf(['string', 'image']).isRequired,
  content: PropTypes.string.isRequired
};

export default Pista; 