import React from 'react';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`px-3 py-2 border border-gray-300 rounded-md ${props.className || ''}`} />
);