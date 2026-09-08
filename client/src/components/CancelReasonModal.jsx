import { useEffect, useId, useRef, useState } from 'react';
import './CancelReasonModal.css';

function CancelReasonModal({
  orderLabel = '',
  isSubmitting = false,
  onClose,
  onConfirm,
}) {
  const titleId = useId();
  const textareaRef = useRef(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = reason.trim();

    if (!trimmed) {
      setError('취소 사유를 입력해주세요.');
      return;
    }

    setError('');
    try {
      await onConfirm(trimmed);
    } catch (err) {
      setError(err?.message || '주문 취소에 실패했습니다.');
    }
  };

  return (
    <div
      className="cancel-reason-modal__overlay"
      role="presentation"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="cancel-reason-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="cancel-reason-modal__title">
          주문 취소
        </h2>
        <p className="cancel-reason-modal__desc">
          {orderLabel
            ? `주문번호 ${orderLabel}의 취소 사유를 입력해주세요.`
            : '취소 사유를 입력해주세요.'}
        </p>

        <form onSubmit={handleSubmit}>
          <label className="cancel-reason-modal__label" htmlFor="cancel-reason-input">
            취소 사유
          </label>
          <textarea
            id="cancel-reason-input"
            ref={textareaRef}
            className="cancel-reason-modal__textarea"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            rows={4}
            maxLength={500}
            placeholder="예: 사이즈 변경으로 재주문"
            disabled={isSubmitting}
          />
          <p className="cancel-reason-modal__count">{reason.length}/500</p>

          {error && (
            <p className="cancel-reason-modal__error" role="alert">
              {error}
            </p>
          )}

          <div className="cancel-reason-modal__actions">
            <button
              type="button"
              className="cancel-reason-modal__btn cancel-reason-modal__btn--ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              닫기
            </button>
            <button
              type="submit"
              className="cancel-reason-modal__btn cancel-reason-modal__btn--danger"
              disabled={isSubmitting}
            >
              {isSubmitting ? '취소 중...' : '주문 취소'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CancelReasonModal;
