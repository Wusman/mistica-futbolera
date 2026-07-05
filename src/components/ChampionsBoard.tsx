import { useEffect, useState } from 'react';
import { fetchChampions, sortChampions, type ChampionEntry } from '../lib/daily';
import { useT } from '../i18n';

/* ── Salón de campeones ── el palmarés del torneo del día: EL objetivo del
   que entra a jugar, tratado como joya (filete dorado, el 1º como rey).
   Solo lectura; el alta ocurre en la carta de campeón. Red en el shell:
   el core no se entera. */
export function ChampionsBoard() {
  const t = useT();
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [list, setList] = useState<ChampionEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchChampions()
      .then((l) => { if (!cancelled) { setList(sortChampions(l)); setState('ready'); } })
      .catch(() => { if (!cancelled) setState('error'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="champs">
      <div className="champs-head">
        <h2 className="champs-title">{t('daily.board')}</h2>
      </div>
      {state === 'loading' && <p className="champs-note">{t('daily.loading')}</p>}
      {state === 'error' && <p className="champs-note">{t('daily.boardError')}</p>}
      {state === 'ready' && list.length === 0 && <p className="champs-note">{t('daily.boardEmpty')}</p>}
      {state === 'ready' && list.length > 0 && (
        <ol className="champs-list">
          {list.slice(0, 10).map((c, i) => (
            <li key={`${c.name}:${c.at}`} className={`champs-row ${i === 0 ? 'champs-row--top' : ''}`}>
              <span className="champs-pos">{i + 1}</span>
              <span className="champs-name">{c.name}</span>
              <span className="champs-rec">
                {c.w ?? '–'}{t('rec.w')} {c.d ?? '–'}{t('rec.d')} {c.l ?? '–'}{t('rec.l')} · {c.gf ?? '–'}:{c.ga ?? '–'} · {c.avg ?? '–'}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}