import React, { useEffect, useCallback } from 'react';

export interface ModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSave?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  children: React.ReactNode;
  maxWidth?: string;
  icon?: React.ReactNode;
  isSaving?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  subtitle,
  onClose,
  onSave,
  saveLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  children,
  maxWidth = '680px',
  icon,
  isSaving = false
}) => {
  // ESC key listener to close modal smoothly
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="modal-window"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-content">
            <h3 className="modal-title">
              {icon && <span style={{ marginRight: '0.45rem', display: 'inline-flex', verticalAlign: 'middle' }}>{icon}</span>}
              {title}
            </h3>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close (Esc)"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">{children}</div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn--outline"
            onClick={onClose}
            disabled={isSaving}
          >
            {cancelLabel}
          </button>
          {onSave && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '13px',
                      height: '13px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.35)',
                      borderTopColor: '#ffffff',
                      animation: 'spin 0.6s linear infinite',
                      marginRight: '0.4rem',
                      verticalAlign: 'middle'
                    }}
                  />
                  Saving...
                </>
              ) : (
                saveLabel
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
