import React, { useState, useEffect } from 'react';

export default function ConcertSlider({ koncerty, onSelect }) {
  const [current, setCurrent] = useState(0);

  // LOGIKA: Najpierw szukamy tych specjalnie promowanych przez Admina.
  // Jeśli Admin nie zaznaczył żadnego, pokazujemy po prostu 3 pierwsze z bazy jako zapas.
  const activelyPromoted = koncerty ? koncerty.filter(k => k.isPromoted) : [];
  const promoted = activelyPromoted.length > 0 ? activelyPromoted.slice(0, 5) : (koncerty ? koncerty.slice(0, 3) : []);

  useEffect(() => {
    if (promoted.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prev) => {
        if (prev >= promoted.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [promoted.length]);

  if (promoted.length === 0) return null;

  const safeCurrent = current >= promoted.length ? 0 : current;

  return (
    <div className="slider-container" style={{ backgroundColor: '#111827' }}>
      {promoted.map((k, index) => (
        <div 
          key={k.id_db || index} 
          className={`slide ${index === safeCurrent ? 'active' : ''}`}
          style={{ backgroundImage: `url(${k.image || 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&w=1200'})` }}
        >
          <div className="slide-content">
            <span style={{ background: '#ef4444', color: '#fff', padding: '5px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '15px', display: 'inline-block' }}>
              🔥 Polecane Wydarzenie
            </span>
            <h2 className="slide-title">{k.artysta}</h2>
            <p style={{ fontSize: '1.2rem', color: '#e2e8f0', marginBottom: '25px', textShadow: '1px 1px 5px rgba(0,0,0,0.8)' }}>
              📅 {k.data} | 📍 Arena Główna
            </p>
            <button className="slide-btn" onClick={() => onSelect(k)}>
              Kup Bilet - {k.cenaBazowa} PLN
            </button>
          </div>
        </div>
      ))}

      {promoted.length > 1 && (
        <div className="slider-dots">
          {promoted.map((_, index) => (
            <div 
              key={index} 
              className={`dot ${index === safeCurrent ? 'active' : ''}`}
              onClick={() => setCurrent(index)}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}