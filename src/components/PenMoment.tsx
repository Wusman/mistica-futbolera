import { type PenAim } from '../lib/engine';
import { useT } from '../i18n';
import { GoalScene, type PenResolution } from './GoalScene';

interface Props {
  min: number;
  mine: boolean;               // penal a tu favor (pateás) vs en contra (atajás)
  res: PenResolution | null;
  oppName: string;
  onPen: (aim: PenAim) => void;
}

/* Momento de penal en jugada (compartido por 1er y 2do tiempo): chyron del
   minuto, escena del arco y la decisión de palo/estirada. Presentación pura. */
export function PenMoment({ min, mine, res, oppName, onPen }: Props) {
  const t = useT();

  const resultText = res
    ? mine
      ? (res.scored ? (res.dive === res.aim ? t('pens.golazo') : t('pens.goal')) : res.dive === res.aim ? t('pens.saved') : t('pens.out'))
      : (res.scored ? (res.dive === res.aim ? t('pens.unstoppable') : t('pens.oppGoal', { opp: oppName })) : res.dive === res.aim ? t('pens.youSaved') : t('pens.oppOut'))
    : '';
  const resultGood = res ? (mine ? res.scored : !res.scored) : false;

  const aims: { key: PenAim; label: string }[] = [
    { key: 'L', label: t('pens.left') },
    { key: 'C', label: t('pens.center') },
    { key: 'R', label: t('pens.right') },
  ];

  return (
    <>
      <p className="match-tag">{min}&rsquo; · {t('mpen.tag')}</p>
      <p className="ticker-half pen-turn">{mine ? t('mpen.you') : t('mpen.opp')}</p>

      <GoalScene
        res={res}
        showAnim={!!res}
        keeperYou={!mine}
        resultText={resultText}
        resultGood={resultGood}
        animKey={`mpen:${min}`}
      />

      {!res && (
        <>
          <p className="match-note">{mine ? t('pens.aim') : t('pens.dive')}</p>
          <div className="pen-aims">
            {aims.map((a) => (
              <button key={a.key} className="att-btn pen-aim" onClick={() => onPen(a.key)}>
                <b>{a.label}</b>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}