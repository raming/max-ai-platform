import React from 'react';

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={`px-3 py-2 border border-gray-300 rounded-md ${props.className || ''}`} />
);