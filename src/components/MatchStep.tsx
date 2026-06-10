import { useState } from 'react';
import { type Attitude, type Rival, type TickerEvent } from '../lib/engine';
import { useT } from '../i18n';
import { MatchTicker } from './MatchTicker';

interface Props {
  rival: Rival;
  gf1: number;
  ga1: number;
  ev1: TickerEvent[];
  onDecide: (a: Attitude) => void;
}

export function MatchStep({ rival, gf1, ga1, ev1, onDecide }: Props) {
  const t = useT();

  /* Relato del primer tiempo: corre 0' → 45' y recién ahí se decide. */
  const [live, setLive] = useState(true);

  if (live) {
    return (
      <section className="match">
        <MatchTicker
          from={0}
          to={45}
          events={ev1}
          oppName={rival.name}
          halfLabel={t('ticker.first')}
          endLabel={t('ticker.ht')}
          onDone={() => setLive(false)}
        />
      </section>
    );
  }

  const lead = gf1 - ga1;
  const note = lead > 0 ? t('match.lead.win') : lead < 0 ? t('match.lead.lose') : t('match.lead.draw');

  const options: { key: Attitude; label: string; note: string }[] = [
    { key: 'def', label: t('att.def.t'), note: t('att.def.d') },
    { key: 'eq', label: t('att.eq.t'), note: t('att.eq.d') },
    { key: 'off', label: t('att.off.t'), note: t('att.off.d') },
  ];

  return (
    <section className="match">
      <p className="match-tag">{t('match.halftime')}</p>

      <div className="scoreline">
        <span className="score">{gf1}</span>
        <span className="score-sep">–</span>
        <span className="score score--away">{ga1}</span>
      </div>

      <div className="scout">
        <span className="scout-name">{rival.name} · {rival.edition}</span>
        <div className="scout-bars">
          <span>{t('match.attackRival')} <b>{rival.atk}</b></span>
          <span>{t('match.defenseRival')} <b>{rival.def}</b></span>
        </div>
      </div>

      <p className="match-note">{note}</p>

      <div className="attitudes">
        {options.map((o) => (
          <button key={o.key} className="att-btn" onClick={() => onDecide(o.key)}>
            <b>{o.label}</b>
            <span>{o.note}</span>
          </button>
        ))}
      </div>
    </section>
  );
}