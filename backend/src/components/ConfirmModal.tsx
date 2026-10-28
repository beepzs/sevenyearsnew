import React, { useEffect, useRef } from 'react';

export interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  icon?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmModalProps {
  state: ConfirmState | null;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ state, onClose }) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state?.isOpen) {
      // Auto focus confirm button for keyboard quick confirm
      setTimeout(() => confirmBtnRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (state.onCancel) state.onCancel();
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [state, onClose]);

  if (!state || !state.isOpen) return null;

  const isDanger = state.isDanger !== false;
  const icon = state.icon || (isDanger ? '🗑️' : '❓');
  const confirmText = state.confirmText || (isDanger ? 'Delete' : 'Confirm');
  const cancelText = state.cancelText || 'Cancel';

  const handleConfirm = () => {
    state.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (state.onCancel) state.onCancel();
    onClose();
  };

  return (
    <div className="confirm-modal-backdrop" onClick={handleCancel}>
      <div
        className="confirm-modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-modal-body">
          <div className={`confirm-modal-icon ${isDanger ? 'confirm-modal-icon--danger' : 'confirm-modal-icon--info'}`}>
            <span>{icon}</span>
          </div>

          <h3 id="confirm-modal-title" className="confirm-modal-title">
            {state.title}
          </h3>

          <p className="confirm-modal-message">
            {state.message}
          </p>
        </div>

        <div className="confirm-modal-footer">
          <button
            type="button"
            className="btn btn--outline"
            onClick={handleCancel}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={`btn ${isDanger ? 'btn--danger' : 'btn--primary'}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
