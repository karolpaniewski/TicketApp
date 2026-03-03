import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminDashboard({ koncerty, planySali }) {
  const [zamowienia, setZamowienia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'zamowienia'));
        setZamowienia(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const totalRevenue = zamowienia.reduce((s, z) => s + (z.koszt || 0), 0);
  const totalOrders = zamowienia.length;
  const totalTicketsSold = zamowienia.reduce((s, z) => s + (z.miejsca?.length || 0), 0);
  const lastOrders = [...zamowienia].sort((a, b) => new Date(b.dataZakupu || 0) - new Date(a.dataZakupu || 0)).slice(0, 8);

  const getStatsForKoncert = (k) => {
    const plan = planySali[k.planSali];
    const totalSeats = plan?.miejsca?.length || 0;
    const sold = k.zajeteMiejsca?.length || 0;
    const unsold = Math.max(0, totalSeats - sold);
    const fillPct = totalSeats > 0 ? Math.round((sold / totalSeats) * 100) : 0;
    const eventRevenue = zamowienia
      .filter(z => (z.koncertId === k.id_db) || (!z.koncertId && z.artysta === k.artysta))
      .reduce((s, z) => s + (z.koszt || 0), 0);
    return { totalSeats, sold, unsold, fillPct, eventRevenue };
  };

  if (loading) return <div className="admin-dashboard-loading">Ładowanie statystyk…</div>;

  return (
    <div className="admin-dashboard">
      <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>📊 Dashboard</h2>

      {/* Karty podsumowania globalnego */}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <span className="dashboard-card-label">Łączne zarobki</span>
          <span className="dashboard-card-value">{totalRevenue.toLocaleString('pl-PL')} PLN</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-label">Sprzedane bilety</span>
          <span className="dashboard-card-value">{totalTicketsSold}</span>
        </div>
        <div className="dashboard-card">
          <span className="dashboard-card-label">Liczba zamówień</span>
          <span className="dashboard-card-value">{totalOrders}</span>
        </div>
      </div>

      {/* Statystyki per wydarzenie */}
      <div className="seating-card" style={{ marginTop: '24px' }}>
        <h3>📋 Wydarzenia – sprzedaż</h3>
        <div className="dashboard-events-table">
          <div className="dashboard-events-header">
            <span>Wydarzenie</span>
            <span>Sprzedane</span>
            <span>Niesprzedane</span>
            <span>Zapełnienie</span>
            <span>Zarobki (PLN)</span>
          </div>
          {koncerty.map(k => {
            const stats = getStatsForKoncert(k);
            return (
              <div key={k.id_db} className="dashboard-events-row">
                <span><strong>{k.artysta}</strong><br /><small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{k.data}</small></span>
                <span>{stats.sold}</span>
                <span>{stats.unsold}</span>
                <span className="dashboard-fill-wrap">
                  <span className="dashboard-fill-bar">
                    <span className="dashboard-fill-fill" style={{ width: `${stats.fillPct}%` }} />
                  </span>
                  <span className="dashboard-fill-text">{stats.fillPct}%</span>
                </span>
                <span>{stats.eventRevenue.toLocaleString('pl-PL')}</span>
              </div>
            );
          })}
          {koncerty.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Brak wydarzeń w bazie.</p>}
        </div>
      </div>

      {/* Ostatnie zamówienia */}
      <div className="seating-card" style={{ marginTop: '24px' }}>
        <h3>🛒 Ostatnie zamówienia</h3>
        <div className="dashboard-orders">
          {lastOrders.map(z => (
            <div key={z.id} className="dashboard-order-item">
              <div>
                <strong>{z.artysta}</strong>
                <span className="dashboard-order-meta">{z.userEmail} · {z.miejsca?.length || 0} biletów</span>
              </div>
              <div className="dashboard-order-right">
                <span className="dashboard-order-cost">{z.koszt || 0} PLN</span>
                <small>{z.dataZakupu ? new Date(z.dataZakupu).toLocaleString('pl-PL') : '—'}</small>
              </div>
            </div>
          ))}
          {lastOrders.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Brak zamówień.</p>}
        </div>
      </div>
    </div>
  );
}
