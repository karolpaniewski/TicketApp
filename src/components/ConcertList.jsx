import React from 'react';

export default function ConcertList({ koncerty, setWybranyKoncert, setWybraneMiejsca, user, obserwowaneIds, toggleObserwowane, onRequireAuth }) {
  const defaultImg = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80";

  if (koncerty.length === 0) {
    return <p style={{textAlign: 'center', color: '#94a3b8', width: '100%', marginTop: '40px'}}>Brak wydarzeń pasujących do Twoich kryteriów.</p>;
  }

  const handleObserve = (e, k) => {
    e.stopPropagation();
    if (!user) { onRequireAuth?.(); return; }
    toggleObserwowane(k.id_db);
  };

  return (
    <div className="concert-grid">
      {koncerty.map(k => (
        <div key={k.id_db} className="concert-card" onClick={() => {
          setWybranyKoncert(k);
          setWybraneMiejsca([]);
        }}>
          <div className="category-badge">{k.kategoria || '🎵 Muzyka'}</div>
          {user && (
            <button
              className={`concert-observe-btn ${obserwowaneIds?.includes(k.id_db) ? 'active' : ''}`}
              onClick={(e) => handleObserve(e, k)}
              title={obserwowaneIds?.includes(k.id_db) ? 'Usuń z obserwowanych' : 'Dodaj do obserwowanych'}
              aria-label="Obserwuj"
            >
              {obserwowaneIds?.includes(k.id_db) ? '★' : '☆'}
            </button>
          )}
          <img src={k.image || defaultImg} alt={k.artysta} className="concert-image" />
          <div className="concert-info">
            <div className="concert-meta">📅 {k.data}</div>
            <h3>{k.artysta}</h3>
            <div className="price-tag">{k.cenaBazowa} PLN</div>
          </div>
        </div>
      ))}
    </div>
  );
}