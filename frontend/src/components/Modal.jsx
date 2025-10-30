import React from 'react';
import './Modal.css';

export default function Modal({ open, title, children, onClose, size }) {
  if (!open) return null;
  const sizeClass = size === 'large' ? 'large' : size === 'xl' ? 'xl' : '';
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-card ${sizeClass}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          {title && <h3 className="modal-title">{title}</h3>}
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
