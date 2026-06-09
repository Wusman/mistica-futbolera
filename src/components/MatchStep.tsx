import { type Attitude, type Rival } from '../lib/engine';
import { useT } from '../i18n';

interface Props {
  rival: Rival;
  gf1: number;
  ga1: number;
  onDecide: (a: Attitude) => void;
}

export function MatchStep({ rival, gf1, ga1, onDecide }: Props) {
  const t = useT();
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