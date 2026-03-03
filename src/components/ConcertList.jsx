import React from 'react';

export default function ConcertList({ koncerty, setWybranyKoncert, setWybraneMiejsca }) {
  const defaultImg = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80";

  if (koncerty.length === 0) {
    return <p style={{textAlign: 'center', color: '#94a3b8', width: '100%', marginTop: '40px'}}>Brak wydarzeń pasujących do Twoich kryteriów.</p>;
  }

  return (
    <div className="concert-grid">
      {koncerty.map(k => (
        <div key={k.id_db} className="concert-card" onClick={() => {
          setWybranyKoncert(k);
          setWybraneMiejsca([]);
        }}>
          {/* NOWOŚĆ: Etykieta kategorii */}
          <div className="category-badge">{k.kategoria || '🎵 Muzyka'}</div>
          
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