import React, { useState } from 'react';

export default function ReservationView({ wybranyKoncert, user, userEmail, onRequireAuth, setWybranyKoncert, wybraneMiejsca, toggleMiejsce, autoSelectSeat, kupBilety, wszystkieMiejsca, nazwaSali, timeLeft, odblokujMiejsca }) {
  const [trybZakupu, setTrybZakupu] = useState('plan'); // 'plan' | 'auto'

  const zajete = wybranyKoncert?.zajeteMiejsca || [];
  const zablokowane = wybranyKoncert?.zablokowaneMiejsca || {};
  const rzedyZTierami = Array.from(new Set(wszystkieMiejsca.map(m => m.rzad))).map(rzad => {
    const miejscaWRzedzie = wszystkieMiejsca.filter(m => m.rzad === rzad);
    const dostepne = miejscaWRzedzie.filter(m => !zajete.includes(m.id) && (!zablokowane[m.id] || zablokowane[m.id] === userEmail));
    const cena = Math.round(wybranyKoncert?.cenaBazowa * (miejscaWRzedzie[0]?.mnoznik || 1));
    return { rzad, cena, dostepne: dostepne.length, mnoznik: miejscaWRzedzie[0]?.mnoznik };
  });

  const suma = wybraneMiejsca.reduce((acc, id) => {
    const m = wszystkieMiejsca.find(item => item.id === id);
    return acc + (wybranyKoncert.cenaBazowa * (m?.mnoznik || 1));
  }, 0);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "05:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const rzedy = Array.from(new Set(wszystkieMiejsca.map(m => m.rzad)));
  const isHall5k = wszystkieMiejsca.length > 500;
  const grupujSekcje = () => {
    const vip = rzedy.filter(r => r.startsWith('VIP Pod Sceną'));
    const plyta = rzedy.filter(r => r.startsWith('Płyta'));
    const trybL = rzedy.filter(r => r.startsWith('Trybuna Lewa'));
    const trybP = rzedy.filter(r => r.startsWith('Trybuna Prawa'));
    const trybT = rzedy.filter(r => r.startsWith('Trybuna Tył'));
    return { vip, plyta, trybL, trybP, trybT, isArena: vip.length && (trybL.length || trybP.length) };
  };
  const sekcje = grupujSekcje();
  const renderSeat = (m) => {
    const zabl = wybranyKoncert?.zablokowaneMiejsca || {};
    const czyZajete = (wybranyKoncert?.zajeteMiejsca || []).includes(m.id);
    const czyZablokowaneInny = zabl[m.id] && zabl[m.id] !== userEmail;
    const czyWybrane = wybraneMiejsca.includes(m.id) || zabl[m.id] === userEmail;
    return (
      <button
        key={m.id}
        className={`seat-btn ${czyZajete ? 'occupied' : czyZablokowaneInny ? 'locked' : czyWybrane ? 'selected' : 'available'}`}
        onClick={() => {
          if (!user) onRequireAuth();
          else if (!czyZajete && !czyZablokowaneInny) toggleMiejsce(m.id);
        }}
        disabled={czyZajete || czyZablokowaneInny}
        title={czyZablokowaneInny ? 'To miejsce jest teraz w koszyku kogoś innego!' : ''}
      >
        {m.numer}
      </button>
    );
  };

  const handleBackClick = () => {
    odblokujMiejsca();
    setWybranyKoncert(null);
  };

  return (
    <div className="reservation-container">
      <div className="event-hero" style={{ backgroundImage: `url(${wybranyKoncert.image || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200'})` }}>
        <div className="hero-text">
          <button className="page-btn" style={{marginBottom: '20px'}} onClick={handleBackClick}>← Wróć do listy</button>
          <div style={{background: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', padding: '5px 15px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold'}}>
            ⏳ Pozostały czas: {formatTime(timeLeft)}
          </div>
          <h1 style={{fontSize: '3.5rem', margin: '15px 0', textShadow: '2px 2px 10px rgba(0,0,0,0.8)'}}>{wybranyKoncert.artysta}</h1>
          <p>{nazwaSali} | {wybranyKoncert.data}</p>
        </div>
      </div>

      <div className="booking-layout">
        <div className="seating-card">
          <div className="zakup-mode-toggle" style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              className={`page-btn ${trybZakupu === 'plan' ? 'active' : ''}`}
              onClick={() => setTrybZakupu('plan')}
              style={{ flex: 1, minWidth: '160px', background: trybZakupu === 'plan' ? 'var(--primary)' : 'rgba(255,255,255,0.08)', borderColor: trybZakupu === 'plan' ? 'var(--primary)' : undefined }}
            >
              🪑 Wybierz z planu miejsc
            </button>
            <button
              className={`page-btn ${trybZakupu === 'auto' ? 'active' : ''}`}
              onClick={() => setTrybZakupu('auto')}
              style={{ flex: 1, minWidth: '160px', background: trybZakupu === 'auto' ? 'var(--primary)' : 'rgba(255,255,255,0.08)', borderColor: trybZakupu === 'auto' ? 'var(--primary)' : undefined }}
            >
              ⚡ Automatyczny wybór (wybierz cenę)
            </button>
          </div>

          {trybZakupu === 'auto' ? (
            <div className="auto-select-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px 0', fontSize: '0.95rem' }}>
                Wybierz kategorię cenową – system przydzieli Ci pierwsze dostępne miejsce.
              </p>
              {rzedyZTierami.map(({ rzad, cena, dostepne }) => (
                <div
                  key={rzad}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '12px',
                    border: '1px solid var(--card-border)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{rzad}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {dostepne} {dostepne === 1 ? 'miejsce' : 'miejsc'} dostępnych
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--primary)' }}>{cena} PLN</span>
                    <button
                      className="btn-buy"
                      disabled={!user || dostepne === 0}
                      style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                      onClick={() => {
                        if (!user) onRequireAuth();
                        else autoSelectSeat(rzad);
                      }}
                    >
                      Dodaj
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={isHall5k ? 'hall-plan' : ''}>
          <div className="stage-container">
            <small style={{letterSpacing: '5px', color: '#64748b'}}>SCENA ({nazwaSali?.toUpperCase()})</small>
            <div className="stage-line"></div>
          </div>
          
          {sekcje.isArena ? (
            <>
              {(sekcje.vip.length > 0 || sekcje.plyta.length > 0) && (
                <div className="hall-plan-section">
                  {(sekcje.vip.length > 0) && (
                    <>
                      <div className="hall-plan-section-title">★ VIP Pod Sceną (1000 miejsc)</div>
                      {sekcje.vip.map(rzad => (
                        <div key={rzad} className="rzad-container">
                          <div className="rzad-label">{rzad.replace('VIP Pod Sceną ', '')}</div>
                          <div className="seats-row" style={{ flexWrap: 'wrap' }}>
                            {wszystkieMiejsca.filter(m => m.rzad === rzad).map(m => renderSeat(m))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {(sekcje.plyta.length > 0) && (
                    <>
                      <div className="hall-plan-section-title" style={{ marginTop: sekcje.vip.length ? '20px' : 0 }}>▣ Płyta Główna (2000 miejsc)</div>
                      {sekcje.plyta.map(rzad => (
                        <div key={rzad} className="rzad-container">
                          <div className="rzad-label">{rzad.replace('Płyta Główna ', '')}</div>
                          <div className="seats-row" style={{ flexWrap: 'wrap' }}>
                            {wszystkieMiejsca.filter(m => m.rzad === rzad).map(m => renderSeat(m))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
              {(sekcje.trybL.length > 0 || sekcje.trybP.length > 0 || sekcje.trybT.length > 0) && (
                <div className="hall-plan-section">
                  <div className="hall-plan-section-title">≡ Trybuny (2000 miejsc)</div>
                  <div className="hall-layout-grid" style={{ gridTemplateColumns: sekcje.trybT.length ? '1fr 1fr 1fr' : '1fr 1fr' }}>
                    {sekcje.trybL.length > 0 && (
                      <div>
                        <div className="rzad-label" style={{ marginBottom: 8 }}>Trybuna Lewa</div>
                        {sekcje.trybL.map(rzad => (
                          <div key={rzad} className="rzad-container">
                            <div className="rzad-label" style={{ width: 50 }}>{rzad.replace('Trybuna Lewa ', '')}</div>
                            <div className="seats-row" style={{ flexWrap: 'wrap' }}>
                              {wszystkieMiejsca.filter(m => m.rzad === rzad).map(m => renderSeat(m))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {sekcje.trybT.length > 0 && (
                      <div>
                        <div className="rzad-label" style={{ marginBottom: 8 }}>Trybuna Tył</div>
                        {sekcje.trybT.map(rzad => (
                          <div key={rzad} className="rzad-container">
                            <div className="rzad-label" style={{ width: 50 }}>{rzad.replace('Trybuna Tył ', '')}</div>
                            <div className="seats-row" style={{ flexWrap: 'wrap' }}>
                              {wszystkieMiejsca.filter(m => m.rzad === rzad).map(m => renderSeat(m))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {sekcje.trybP.length > 0 && (
                      <div>
                        <div className="rzad-label" style={{ marginBottom: 8 }}>Trybuna Prawa</div>
                        {sekcje.trybP.map(rzad => (
                          <div key={rzad} className="rzad-container">
                            <div className="rzad-label" style={{ width: 50 }}>{rzad.replace('Trybuna Prawa ', '')}</div>
                            <div className="seats-row" style={{ flexWrap: 'wrap' }}>
                              {wszystkieMiejsca.filter(m => m.rzad === rzad).map(m => renderSeat(m))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div style={{ marginTop: '40px', display: 'flex', gap: '20px', justifyContent: 'center', fontSize: '0.9rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '15px', height: '15px', background: '#1f2937', borderRadius: '3px' }}></div> Wolne</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '15px', height: '15px', background: 'var(--primary)', borderRadius: '3px' }}></div> Twój wybór</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '15px', height: '15px', background: '#f97316', borderRadius: '3px' }}></div> Przetwarzane</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '15px', height: '15px', background: '#000', borderRadius: '3px' }}></div> Sprzedane</span>
              </div>
            </>
          ) : (
            <>
              {rzedy.map(rzad => (
                <div key={rzad} className="rzad-container">
                  <div className="rzad-label">{rzad}</div>
                  <div className="seats-row" style={{ flexWrap: 'wrap' }}>
                    {wszystkieMiejsca.filter(m => m.rzad === rzad).map(m => renderSeat(m))}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '40px', display: 'flex', gap: '20px', justifyContent: 'center', fontSize: '0.9rem', color: '#94a3b8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '15px', height: '15px', background: '#1f2937', borderRadius: '3px' }}></div> Wolne</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '15px', height: '15px', background: 'var(--primary)', borderRadius: '3px' }}></div> Twój wybór</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '15px', height: '15px', background: '#f97316', borderRadius: '3px' }}></div> Przetwarzane</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '15px', height: '15px', background: '#000', borderRadius: '3px' }}></div> Sprzedane</span>
              </div>
            </>
          )}

        </div>
          )}

        </div>

        <div className="ticket-sidebar">
          <div className="digital-ticket">
            <div className="ticket-main">
              <div style={{color: '#3b82f6', fontWeight: '800', fontSize: '11px', marginBottom: '5px'}}>OFFICIAL TICKET</div>
              <h2 style={{margin: '0 0 20px 0'}}>{wybranyKoncert.artysta}</h2>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <div>
                  <small style={{color: '#64748b'}}>MIEJSCA</small>
                  <div style={{fontWeight: 'bold', fontSize: '1.2rem'}}>{wybraneMiejsca.length > 0 ? wybraneMiejsca.join(", ") : "---"}</div>
                </div>
                <div>
                  <small style={{color: '#64748b'}}>DATA</small>
                  <div style={{fontWeight: 'bold'}}>{wybranyKoncert.data}</div>
                </div>
              </div>
            </div>
            <div className="ticket-footer">
              <div style={{fontSize: '2.5rem', fontWeight: '800', marginBottom: '15px', color: '#000'}}>{Math.round(suma)} <span style={{fontSize: '1rem'}}>PLN</span></div>
              
              {/* NOWOŚĆ: Przycisk dostosowuje się do statusu logowania */}
              <button 
                className="btn-buy" 
                disabled={user && wybraneMiejsca.length === 0} 
                onClick={() => {
                  if (!user) onRequireAuth();
                  else kupBilety();
                }}
              >
                {user ? "ZAPŁAĆ TERAZ" : "ZALOGUJ SIĘ"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}