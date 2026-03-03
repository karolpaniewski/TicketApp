import { jsPDF } from "jspdf";

export default function OrderHistory({ historia }) {
  if (historia.length === 0) return null;

  const generujPDF = (zamowienie) => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [150, 100] // Mały, zgrabny format biletu
    });

    // --- STYLIZACJA BILETU ---
    // Tło i obramowanie
    doc.setFillColor(26, 29, 33); // Ciemny kolor z naszej apki
    doc.rect(0, 0, 150, 100, 'F');
    doc.setDrawColor(59, 130, 246); // Niebieska ramka
    doc.setLineWidth(2);
    doc.rect(5, 5, 140, 90);

    // Nagłówek
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("BILET ELEKTRONICZNY", 75, 20, { align: "center" });
    
    doc.setDrawColor(255, 255, 255);
    doc.line(20, 25, 130, 25);

    // Dane koncertu
    doc.setFontSize(16);
    doc.text(`ARTYSTA: ${zamowienie.artysta}`, 20, 40);
    
    doc.setFontSize(12);
    doc.setTextColor(148, 163, 184);
    doc.text(`Miejsca: ${zamowienie.miejsca.join(", ")}`, 20, 55);
    doc.text(`Cena łączna: ${zamowienie.koszt} PLN`, 20, 65);
    
    // "Kod kreskowy" (symulacja)
    doc.setFillColor(255, 255, 255);
    for(let i=0; i<40; i++) {
        const width = Math.random() * 2;
        doc.rect(20 + (i*3), 75, width, 10, 'F');
    }

    doc.setFontSize(8);
    doc.text(`ID ZAMOWIENIA: #REZERWACJA-${Math.floor(Math.random()*10000)}`, 75, 90, { align: "center" });

    // Pobieranie pliku
    doc.save(`Bilet_${zamowienie.artysta}.pdf`);
  };

  return (
    <div className="card" style={{ marginTop: '40px', textAlign: 'left', border: '1px dashed #3b82f6' }}>
      <h3 style={{ color: '#3b82f6', marginBottom: '15px' }}>📜 Twoja Historia Zamówień</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {historia.map((zamowienie, index) => (
          <div key={index} className="summary-row" style={{ background: '#111418', padding: '15px', borderRadius: '12px' }}>
            <div>
              <strong style={{ fontSize: '16px' }}>{zamowienie.artysta}</strong>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Miejsca: {zamowienie.miejsca.join(', ')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: '5px' }}>{zamowienie.koszt} zł</div>
              <button 
                onClick={() => generujPDF(zamowienie)}
                className="sort-btn" 
                style={{ fontSize: '11px', padding: '5px 10px', borderColor: '#22c55e', color: '#22c55e' }}
              >
                📥 Pobierz PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}