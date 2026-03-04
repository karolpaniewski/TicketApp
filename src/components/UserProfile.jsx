import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import OrderHistory from './OrderHistory';

export default function UserProfile({ user, historia, onClose, koncerty, obserwowaneIds, toggleObserwowane, onSelectConcert }) {
  const [isGenerating, setIsGenerating] = useState(null);

  const dataDolaczenia = user?.metadata?.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString() 
    : "Brak danych";

  const generujPDF = async (biletId, biletDane) => {
    setIsGenerating(biletId);
    const ticketElement = document.getElementById(`ticket-pdf-${biletId}`);
    if (ticketElement) {
      try {
        const canvas = await html2canvas(ticketElement, { scale: 2, useCORS: true, backgroundColor: biletDane.ticketColor || '#fbcfe8' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [264, 92] });
        pdf.addImage(imgData, 'PNG', 0, 0, 264, 92);
        pdf.save(`Bilet_${biletDane.artysta.replace(/\s+/g, '_')}.pdf`);
      } catch (error) {
        console.error(error); alert("Wystąpił problem z generowaniem biletu.");
      }
    }
    setIsGenerating(null);
  };

  const obserwowaneKoncerty = (koncerty || []).filter(k => (obserwowaneIds || []).includes(k.id_db));

  return (
    <div className="fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 className="main-title" style={{ margin: 0 }}>Mój Profil</h1>
        <button className="page-btn" onClick={onClose}>← Wróć do wydarzeń</button>
      </div>

      {obserwowaneKoncerty.length > 0 && (
        <div style={{ width: '100%', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom: '20px' }}>
            ⭐ Obserwowane wydarzenia ({obserwowaneKoncerty.length})
          </h2>
          <div className="concert-grid">
            {obserwowaneKoncerty.map(k => (
              <div key={k.id_db} className="concert-card" onClick={() => onSelectConcert?.(k)}>
                <button
                  className="concert-observe-btn active"
                  onClick={(e) => { e.stopPropagation(); toggleObserwowane?.(k.id_db); }}
                  title="Usuń z obserwowanych"
                >★</button>
                <img src={k.image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800'} alt={k.artysta} className="concert-image" />
                <div className="concert-info">
                  <div className="concert-meta">📅 {k.data}</div>
                  <h3>{k.artysta}</h3>
                  <div className="price-tag">{k.cenaBazowa} PLN</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ width: '100%', textAlign: 'left', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '2rem', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
          🎟️ Twój Portfel Biletów ({(historia || []).length})
        </h2>
      </div>
      
      {(!historia || historia.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', width: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}>
          <h3>Nie masz jeszcze żadnych biletów.</h3>
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {historia.map((bilet, index) => (
            <div key={index} style={{ position: 'relative' }}>
              
              {/* NOWY, PIĘKNY WIDOK BILETU W PROFILU */}
              <div className="passport-ticket" style={{ backgroundColor: bilet.ticketColor || '#f8fafc' }}>
                
                {/* Tło przenikające */}
                <div className="pt-bg" style={{ backgroundImage: `url(${bilet.ticketBg || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200'})` }}></div>
                
                <div className="pt-content">
                  <div className="pt-info">
                    <div>
                      <div style={{ color: '#3b82f6', fontWeight: '900', fontSize: '12px', letterSpacing: '2px', marginBottom: '15px', textTransform: 'uppercase' }}>
                        OFFICIAL E-TICKET PASSPORT
                      </div>
                      <h3 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: '900', margin: '0 0 30px 0', lineHeight: '1.1' }}>
                        {bilet.artysta}
                      </h3>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                      <div>
                        <span className="pt-label">TWOJE MIEJSCA</span>
                        <div className="pt-value">{(bilet.miejsca || []).join(", ")}</div>
                      </div>
                      <div>
                        <span className="pt-label">ZAKUPIONO</span>
                        <div className="pt-value">{bilet.dataZakupu ? new Date(bilet.dataZakupu).toLocaleDateString() : 'Brak'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-right">
                    <div className="pt-qr-box">
                      <QRCodeSVG value={`TICKET-${user?.email}-${index}`} size={90} />
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '20px' }}>
                      <div style={{ fontSize: '2rem', fontWeight: '900', lineHeight: '1' }}>{bilet.koszt} PLN</div>
                      <button 
                        onClick={() => generujPDF(index, bilet)}
                        className="btn-buy"
                        disabled={isGenerating === index}
                        style={{ padding: '10px 20px', fontSize: '0.9rem', marginTop: '10px', borderRadius: '10px' }}
                      >
                        {isGenerating === index ? '⏳...' : '🖨️ POBIERZ PDF'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* UKRYTY SZABLON DO DRUKU PDF (Nadal tu jest, by generować dokument do druku) */}
              <div className="ticket-print-wrapper">
                <div id={`ticket-pdf-${index}`} className="fan-ticket" style={{ backgroundColor: bilet.ticketColor || '#fbcfe8' }}>
                  <div className="fan-ticket-watermark">WZÓR</div>
                  <div className="fan-ticket-bg" style={{ backgroundImage: `url(${bilet.ticketBg || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200'})` }}></div>

                  <div className="fan-ticket-left">
                    <div className="fan-barcode-container">
                      <QRCodeSVG value={`TICKET-${user?.email}-${index}`} size={40} />
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>0132054785001206</span>
                    </div>

                    <div>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 15px 0' }}>Fan Ticket is here!</h2>
                      <div style={{ fontSize: '0.9rem', lineHeight: '1.5', fontWeight: '600' }}>
                        <p style={{ margin: '0' }}>Miejsce Imprezy</p>
                        <p style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: '800' }}>Hala Główna - TicketSystem</p>
                        <p style={{ margin: '0' }}>Miejsca:</p>
                        <p style={{ margin: '0 0 15px 0', fontSize: '1.2rem', fontWeight: '800' }}>Siedzenia: {(bilet.miejsca || []).join(", ")}</p>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>
                        {bilet.koszt},00 PLN <span style={{ fontSize: '0.6rem', fontWeight: 'normal' }}>zawiera 8% VAT</span>
                      </div>
                    </div>
                  </div>

                  <div className="fan-ticket-middle">
                    <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>OFFICIAL EVENT TICKET</span>
                    <h1 className="fan-title">{bilet.artysta}</h1>
                  </div>

                  <div className="fan-ticket-right" style={{ backgroundColor: bilet.ticketColor || '#fbcfe8' }}>
                    <QRCodeSVG value={`VERIFY-${index}`} size={70} />
                    <div className="fan-ticket-right-text">🎫 KONTROLA BILETÓW</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center' }}>0000000001<br/>1310301555</div>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {historia && historia.length > 0 && (
        <div style={{ width: '100%', marginTop: '50px' }}>
          <OrderHistory historia={historia} />
        </div>
      )}
    </div>
  );
}