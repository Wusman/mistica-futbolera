import { useEffect, useRef, useState } from 'react';
import { BRAND, WEB3FORMS_KEY } from '../config';
import { useT, useLocale } from '../i18n';

/* Modal de sugerencias: textarea → web3forms → mail de Wus. Sin cuentas ni
   datos del jugador (el mensaje es lo único que viaja). Capa shell pura. */
export function Feedback({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const [msg, setMsg] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const boxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    boxRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const send = () => {
    const message = msg.trim();
    if (message.length < 3 || state === 'sending' || state === 'done') return;
    setState('sending');
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `Sugerencia · ${BRAND}`,
        from_name: BRAND,
        message: `[${locale}] ${message}`,
        botcheck: '',
      }),
    })
      .then((r) => (r.ok ? setState('done') : setState('error')))
      .catch(() => setState('error'));
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-label={t('fb.title')} onClick={(e) => e.stopPropagation()}>
        <p className="arcade-title">{t('fb.title')}</p>
        {state !== 'done' ? (
          <>
            <textarea
              ref={boxRef}
              className="fb-box"
              value={msg}
              maxLength={1000}
              placeholder={t('fb.ph')}
              onChange={(e) => setMsg(e.target.value)}
            />
            {state === 'error' && <p className="board-note board-note--bad">{t('fb.error')}</p>}
            <div className="card-ctas">
              <button className="cta cta--ghost" onClick={onClose}>{t('fb.close')}</button>
              <button className="cta" disabled={state === 'sending' || msg.trim().length < 3} onClick={send}>
                {state === 'sending' ? '…' : t('fb.send')}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="match-note">{t('fb.sent')}</p>
            <button className="cta" onClick={onClose}>{t('fb.close')}</button>
          </>
        )}
      </div>
    </div>
  );
}