import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Group, Text } from 'react-konva';

const SEAT_SIZE = 24;
const SEAT_SPACING = 4;
const ROW_GAP = 8;
const SCENA_HEIGHT = 60;
const KATEGORIE_CENOWE = [
  { mnoznik: 0.6, nazwa: 'Eco', kolor: '#64748b' },
  { mnoznik: 0.8, nazwa: 'Standard', kolor: '#94a3b8' },
  { mnoznik: 1.0, nazwa: 'Normal', kolor: '#3b82f6' },
  { mnoznik: 1.2, nazwa: 'Premium', kolor: '#8b5cf6' },
  { mnoznik: 1.5, nazwa: 'VIP', kolor: '#f59e0b' },
  { mnoznik: 2.0, nazwa: 'Platynowy', kolor: '#eab308' },
];

function miejscaDoEdytora(miejsca) {
  const grupowane = {};
  (miejsca || []).forEach(m => {
    if (!grupowane[m.rzad]) grupowane[m.rzad] = { nazwa: m.rzad, mnoznik: m.mnoznik || 1, seats: [] };
    grupowane[m.rzad].seats.push({ id: m.id, mnoznik: m.mnoznik || 1 });
  });
  return {
    scena: { width: 400, height: SCENA_HEIGHT },
    rzedy: Object.values(grupowane).map((r, i) => ({
      id: `row-${i}-${Date.now()}`,
      nazwa: r.nazwa,
      y: SCENA_HEIGHT + 50 + i * (SEAT_SIZE + ROW_GAP + 28),
      mnoznik: r.mnoznik,
      seats: r.seats.map(s => ({ id: s.id, mnoznik: s.mnoznik })),
    })),
  };
}

function edytorDoMiejsc(rzedy) {
  const miejsca = [];
  let globalId = 1;
  const posortowane = [...rzedy].sort((a, b) => a.y - b.y);
  posortowane.forEach(r => {
    r.seats.forEach((s, idx) => {
      miejsca.push({
        id: globalId++,
        rzad: r.nazwa,
        mnoznik: s.mnoznik,
        numer: idx + 1,
      });
    });
  });
  return miejsca;
}

export default function PlanSaliEditor({ plan, nazwaSali, onSave, onCancel }) {
  const initial = plan?.miejsca?.length
    ? miejscaDoEdytora(plan.miejsca)
    : { scena: { width: 400, height: SCENA_HEIGHT }, rzedy: [] };
  const [scena, setScena] = useState(initial.scena);
  const [rzedy, setRzedy] = useState(initial.rzedy);
  const [wybranyRzad, setWybranyRzad] = useState(null);
  const [wybraneMiejsce, setWybraneMiejsce] = useState(null);
  const [nowyNazwaRzedu, setNowyNazwaRzedu] = useState('Rząd 1');
  const [nowyMnoznikRzedu, setNowyMnoznikRzedu] = useState(1.0);
  const [dragAdd, setDragAdd] = useState({ active: false, rowId: null, startX: 0, currentX: 0 });
  const stageRef = useRef(null);
  const dragRef = useRef({ startX: 0, currentX: 0, rowId: null });
  const rzedyRef = useRef(rzedy);
  rzedyRef.current = rzedy;

  useEffect(() => {
    if (!dragAdd.active || !dragAdd.rowId) return;
    dragRef.current = { startX: dragAdd.startX, currentX: dragAdd.startX, rowId: dragAdd.rowId };
    const onMove = (e) => {
      dragRef.current.currentX = e.clientX;
      setDragAdd(d => ({ ...d, currentX: e.clientX }));
    };
    const onUp = () => {
      const { startX, currentX, rowId } = dragRef.current;
      const delta = currentX - startX;
      const ile = Math.max(0, Math.floor(delta / (SEAT_SIZE + SEAT_SPACING)));
      if (ile > 0) {
        const rzad = rzedyRef.current.find(r => r.id === rowId);
        if (rzad) {
          const nowe = Array.from({ length: ile }, () => ({ id: Date.now() + Math.random(), mnoznik: rzad.mnoznik }));
          setRzedy(rzedyRef.current.map(r => (r.id === rowId ? { ...r, seats: [...r.seats, ...nowe] } : r)));
        }
      }
      setDragAdd({ active: false, rowId: null, startX: 0, currentX: 0 });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragAdd.active]);

  const dodajRzad = () => {
    const lastY = rzedy.length > 0 ? Math.max(...rzedy.map(r => r.y)) + SEAT_SIZE + ROW_GAP + 25 : SCENA_HEIGHT + 50;
    setRzedy([
      ...rzedy,
      {
        id: `row-${Date.now()}`,
        nazwa: nowyNazwaRzedu || `Rząd ${rzedy.length + 1}`,
        y: lastY,
        mnoznik: nowyMnoznikRzedu,
        seats: [{ id: Date.now(), mnoznik: nowyMnoznikRzedu }],
      },
    ]);
    setNowyNazwaRzedu(`Rząd ${rzedy.length + 2}`);
  };

  const dodajMiejsce = (rowId) => {
    setRzedy(
      rzedy.map(r =>
        r.id === rowId
          ? { ...r, seats: [...r.seats, { id: Date.now() + Math.random(), mnoznik: r.mnoznik }] }
          : r
      )
    );
  };

  const usunMiejsce = (rowId, seatIdx) => {
    setRzedy(
      rzedy.map(r =>
        r.id === rowId ? { ...r, seats: r.seats.filter((_, i) => i !== seatIdx) } : r
      )
    );
    setWybraneMiejsce(null);
  };

  const usunRzad = (rowId) => {
    setRzedy(rzedy.filter(r => r.id !== rowId));
    setWybranyRzad(null);
  };

  const ustawMnoznikMiejsca = (rowId, seatIdx, mnoznik) => {
    setRzedy(
      rzedy.map(r =>
        r.id === rowId
          ? { ...r, seats: r.seats.map((s, i) => (i === seatIdx ? { ...s, mnoznik } : s)) }
          : r
      )
    );
    setWybraneMiejsce(wybraneMiejsce ? { ...wybraneMiejsce, mnoznik } : null);
  };

  const ustawMnoznikRzedu = (rowId, mnoznik) => {
    setRzedy(
      rzedy.map(r =>
        r.id === rowId ? { ...r, mnoznik, seats: r.seats.map(s => ({ ...s, mnoznik })) } : r
      )
    );
  };

  const zmienNazweRzedu = (rowId, nazwa) => {
    setRzedy(rzedy.map(r => (r.id === rowId ? { ...r, nazwa } : r)));
  };

  const handleDragEndRzad = (rowId, e) => {
    const y = e.target.y();
    setRzedy(rzedy.map(r => (r.id === rowId ? { ...r, y } : r)));
  };

  const startDragAdd = (rowId, e) => {
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
      e.evt.preventDefault();
    }
    setDragAdd({ active: true, rowId, startX: e.evt.clientX, currentX: e.evt.clientX });
  };

  const handleZapisz = () => {
    if (!nazwaSali?.trim()) {
      alert('Wpisz nazwę sali.');
      return;
    }
    const miejsca = edytorDoMiejsc(rzedy); // sortowane po y (kolejność wizualna)
    if (miejsca.length === 0) {
      alert('Dodaj przynajmniej jedno miejsce.');
      return;
    }
    onSave({ nazwa: nazwaSali.trim(), miejsca });
  };

  const canvasW = 800;
  const canvasH = Math.max(550, rzedy.length * (SEAT_SIZE + ROW_GAP + 32) + SCENA_HEIGHT + 120);

  return (
    <div className="plan-editor">
      <div className="plan-editor-toolbar">
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Scena:</span>
          <input type="number" className="auth-input" placeholder="Szer." value={scena.width} onChange={e => setScena(s => ({ ...s, width: Math.max(100, parseInt(e.target.value) || 100) }))} style={{ width: '70px', marginBottom: 0 }} />
          <input type="number" className="auth-input" placeholder="Wys." value={scena.height} onChange={e => setScena(s => ({ ...s, height: Math.max(40, parseInt(e.target.value) || 60) }))} style={{ width: '70px', marginBottom: 0 }} />
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="auth-input"
            placeholder="Nazwa nowego rzędu"
            value={nowyNazwaRzedu}
            onChange={e => setNowyNazwaRzedu(e.target.value)}
            style={{ width: '150px', marginBottom: 0 }}
          />
          <select
            className="auth-input"
            value={nowyMnoznikRzedu}
            onChange={e => setNowyMnoznikRzedu(parseFloat(e.target.value))}
            style={{ width: '120px', marginBottom: 0 }}
          >
            {KATEGORIE_CENOWE.map(k => (
              <option key={k.mnoznik} value={k.mnoznik}>{k.nazwa} (×{k.mnoznik})</option>
            ))}
          </select>
          <button className="page-btn" onClick={dodajRzad}>+ Dodaj rząd</button>
        </div>
        {wybranyRzad && (
          <div className="plan-editor-selection" style={{ marginTop: '12px' }}>
            <strong>Wybrany rząd: {wybranyRzad.nazwa}</strong>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="auth-input"
                value={wybranyRzad.nazwa}
                onChange={e => zmienNazweRzedu(wybranyRzad.id, e.target.value)}
                style={{ width: '120px', marginBottom: 0 }}
              />
              <select
                className="auth-input"
                value={wybranyRzad.mnoznik}
                onChange={e => ustawMnoznikRzedu(wybranyRzad.id, parseFloat(e.target.value))}
                style={{ width: '100px', marginBottom: 0 }}
              >
                {KATEGORIE_CENOWE.map(k => (
                  <option key={k.mnoznik} value={k.mnoznik}>×{k.mnoznik}</option>
                ))}
              </select>
              <button className="page-btn" onClick={() => dodajMiejsce(wybranyRzad.id)}>+ Miejsce</button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>lub przeciągnij w prawo w strefie po miejscach</span>
              <button className="logout-btn" onClick={() => usunRzad(wybranyRzad.id)}>Usuń rząd</button>
            </div>
          </div>
        )}
        {wybraneMiejsce && (
          <div className="plan-editor-selection" style={{ marginTop: '12px' }}>
            <strong>Wybrane miejsce (mnożnik)</strong>
            <select
              className="auth-input"
              value={wybraneMiejsce.mnoznik}
              onChange={e => ustawMnoznikMiejsca(wybraneMiejsce.rowId, wybraneMiejsce.seatIdx, parseFloat(e.target.value))}
              style={{ width: '140px', marginTop: '6px', marginBottom: 0 }}
            >
              {KATEGORIE_CENOWE.map(k => (
                <option key={k.mnoznik} value={k.mnoznik}>{k.nazwa} ×{k.mnoznik}</option>
              ))}
            </select>
            <button className="logout-btn" style={{ marginLeft: '8px' }} onClick={() => usunMiejsce(wybraneMiejsce.rowId, wybraneMiejsce.seatIdx)}>Usuń miejsce</button>
          </div>
        )}
      </div>

      <div className="plan-editor-canvas-wrap" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '20px', overflow: 'auto', maxHeight: '70vh' }}>
        <Stage width={canvasW} height={canvasH} ref={stageRef}>
          <Layer>
            <Rect x={(canvasW - scena.width) / 2} y={20} width={scena.width} height={scena.height} fill="#1e3a5f" stroke="#3b82f6" strokeWidth={2} cornerRadius={8} />
            <Text text="SCENA" x={(canvasW - scena.width) / 2 + scena.width / 2 - 30} y={20 + scena.height / 2 - 10} fontSize={16} fill="#94a3b8" listening={false} />
            {rzedy.map(rzad => (
              <Group
                key={rzad.id}
                y={rzad.y}
                draggable
                onDragEnd={e => handleDragEndRzad(rzad.id, e)}
                onClick={() => { setWybranyRzad(rzad); setWybraneMiejsce(null); }}
                onTap={() => { setWybranyRzad(rzad); setWybraneMiejsce(null); }}
              >
                <Rect x={0} y={-18} width={120} height={16} fill="transparent" listening={false} />
                <Text x={0} y={-18} text={`${rzad.nazwa} (×${rzad.mnoznik})`} fontSize={11} fill="#94a3b8" listening={false} />
                {rzad.seats.map((seat, idx) => {
                  const kategoria = KATEGORIE_CENOWE.find(k => k.mnoznik === seat.mnoznik) || KATEGORIE_CENOWE[2];
                  const isSelected = wybraneMiejsce?.rowId === rzad.id && wybraneMiejsce?.seatIdx === idx;
                  return (
                    <Rect
                      key={seat.id}
                      x={150 + idx * (SEAT_SIZE + SEAT_SPACING)}
                      y={0}
                      width={SEAT_SIZE}
                      height={SEAT_SIZE}
                      fill={kategoria.kolor}
                      stroke={isSelected ? '#fff' : '#374151'}
                      strokeWidth={isSelected ? 3 : 1}
                      cornerRadius={4}
                      onClick={e => { e.cancelBubble = true; setWybraneMiejsce({ rowId: rzad.id, seatIdx: idx, ...seat }); setWybranyRzad(null); }}
                      onTap={e => { e.cancelBubble = true; setWybraneMiejsce({ rowId: rzad.id, seatIdx: idx, ...seat }); setWybranyRzad(null); }}
                    />
                  );
                })}
                <Rect
                  x={150 + rzad.seats.length * (SEAT_SIZE + SEAT_SPACING)}
                  y={0}
                  width={100}
                  height={SEAT_SIZE}
                  fill={dragAdd.active && dragAdd.rowId === rzad.id ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.15)'}
                  stroke="#3b82f6"
                  strokeWidth={1}
                  cornerRadius={4}
                  onMouseDown={e => startDragAdd(rzad.id, e)}
                />
                {dragAdd.active && dragAdd.rowId === rzad.id && (
                  <Text
                    x={150 + rzad.seats.length * (SEAT_SIZE + SEAT_SPACING) + 10}
                    y={SEAT_SIZE / 2 - 6}
                    text={`+${Math.max(0, Math.floor((dragAdd.currentX - dragAdd.startX) / (SEAT_SIZE + SEAT_SPACING)))}`}
                    fontSize={12}
                    fill="#fff"
                    listening={false}
                  />
                )}
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
        <button className="btn-buy" onClick={handleZapisz} style={{ background: '#10b981' }}>Zapisz plan</button>
        <button className="logout-btn" onClick={onCancel}>Anuluj</button>
      </div>
    </div>
  );
}
