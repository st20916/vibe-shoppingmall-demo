import { useEffect, useId } from 'react';
import './CancelReasonViewModal.css';

function CancelReasonViewModal({ orderLabel = '', reason = '', onClose }) {
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="cancel-reason-view-modal__overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="cancel-reason-view-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="cancel-reason-view-modal__title">
          취소 사유
        </h2>
        <p className="cancel-reason-view-modal__desc">
          {orderLabel ? `주문번호 ${orderLabel}` : ''}
        </p>
        <p className="cancel-reason-view-modal__body">{reason}</p>

        <div className="cancel-reason-view-modal__actions">
          <button
            type="button"
            className="cancel-reason-view-modal__btn"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelReasonViewModal;
