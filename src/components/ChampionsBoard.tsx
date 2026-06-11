import { useEffect, useState } from 'react';
import { fetchChampions, sortChampions, type ChampionEntry } from '../lib/daily';
import { useT } from '../i18n';

/* Tabla arcade de campeones del torneo del día. Solo lectura; el alta ocurre
   en la carta de campeón. Red en el shell: el core no se entera. */
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
    <div className="board panel">
      <h2 className="step-title">🏆 {t('daily.board')}</h2>
      {state === 'loading' && <p className="board-note">{t('daily.loading')}</p>}
      {state === 'error' && <p className="board-note">{t('daily.boardError')}</p>}
      {state === 'ready' && list.length === 0 && <p className="board-note">{t('daily.boardEmpty')}</p>}
      {state === 'ready' && list.length > 0 && (
        <ol className="board-list">
          {list.slice(0, 10).map((c, i) => (
            <li key={`${c.name}:${c.at}`} className="board-row">
              <span className="board-pos">{i + 1}</span>
              <span className="board-name">{c.name}</span>
              <span className="board-rec">
                {c.w ?? '–'}{t('rec.w')} {c.d ?? '–'}{t('rec.d')} {c.l ?? '–'}{t('rec.l')} · {c.gf ?? '–'}:{c.ga ?? '–'} · {c.avg ?? '–'}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}