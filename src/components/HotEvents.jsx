import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const DNI_WSKAZNIK = 30;
const defaultImg = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80';

export default function HotEvents({ koncerty, onSelect }) {
  const [zamowienia, setZamowienia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'zamowienia'));
        setZamowienia(snap.docs.map(d => d.data()));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const hotList = useMemo(() => {
    const od = new Date();
    od.setDate(od.getDate() - DNI_WSKAZNIK);
    const cutoff = od.toISOString();

    const byKoncert = {};
    zamowienia
      .filter(z => (z.dataZakupu || '') >= cutoff)
      .forEach(z => {
        const id = z.koncertId || z.artysta;
        if (!id) return;
        const tickets = (z.miejsca || []).length;
        byKoncert[id] = (byKoncert[id] || 0) + tickets;
      });

    const sorted = Object.entries(byKoncert)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const result = [];
    const koncertyMap = new Map((koncerty || []).map(k => [k.id_db, k]));
    const byArtysta = new Map((koncerty || []).map(k => [k.artysta, k]));

    for (let i = 0; i < sorted.length; i++) {
      const [id, count] = sorted[i];
      const rank = sorted.length - i;
      let koncert = koncertyMap.get(id) || byArtysta.get(id);
      if (!koncert && typeof id === 'string' && id.includes('@')) continue;
      if (!koncert) {
        koncert = (koncerty || []).find(k => k.artysta === id);
      }
      if (koncert) {
        result.push({ koncert, count, rank });
      }
    }

    return result;
  }, [zamowienia, koncerty]);

  if (loading || hotList.length === 0) return null;

  return (
    <div className="hot-events">
      <h2 className="hot-events-title">🔥 Najgorętsze wydarzenia (ostatnie {DNI_WSKAZNIK} dni)</h2>
      <p className="hot-events-subtitle">Wydarzenia z największą sprzedażą biletów</p>
      <div className="hot-events-list">
        {hotList.map(({ koncert, count, rank }) => (
          <button
            key={koncert.id_db}
            className="hot-event-card"
            onClick={() => onSelect(koncert)}
          >
            <span className="hot-event-rank">#{rank}</span>
            <img src={koncert.image || defaultImg} alt={koncert.artysta} className="hot-event-img" />
            <div className="hot-event-info">
              <strong>{koncert.artysta}</strong>
              <span>📅 {koncert.data}</span>
              <span className="hot-event-price">{koncert.cenaBazowa} PLN</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
