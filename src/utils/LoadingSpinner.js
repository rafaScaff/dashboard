import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 50, color = '#3498db' }) => {
  return (
    <div 
      className="loading-spinner" 
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `5px solid #f3f3f3`,
        borderTop: `5px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '20px auto'
      }} 
    />
  );
};

export default LoadingSpinner; 