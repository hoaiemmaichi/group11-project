import React from 'react';
import './Modal.css';

export default function Modal({ open, title, message, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {title && <h3 className="modal-title">{title}</h3>}
        <div className="modal-body">{message}</div>
        <div className="modal-actions">
          <button className="btn cancel" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
