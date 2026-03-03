import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import PlanSaliEditor from './PlanSaliEditor';
import AdminDashboard from './AdminDashboard';

export default function AdminPanel({ koncerty, refreshData, planySali, refreshPlany, onBackToSite }) {
  const [tab, setTab] = useState('dashboard'); 
  const kategorie = ["🎵 Muzyka", "🎭 Teatr", "🎤 Stand-up", "🏟️ Sport", "🎪 Inne"];

  const [form, setForm] = useState({ 
    artysta: '', cenaBazowa: '', data: '', image: '', isPromoted: false, planSali: 'arena', kategoria: '🎵 Muzyka',
    ticketBg: '', ticketColor: '#fbcfe8' 
  });
  const [editingId, setEditingId] = useState(null); 

  // --- KREATOR PLANU SALI ---
  const [nazwaNowejSali, setNazwaNowejSali] = useState('');
  const [noweRzedy, setNoweRzedy] = useState([]);
  const [tempRzad, setTempRzad] = useState({ nazwa: '', mnoznik: 1.0, ilosc: 5 });
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [trybEdycjiPlanu, setTrybEdycjiPlanu] = useState('formularz');
  const [adminEmails, setAdminEmails] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  const loadAdminEmails = async () => {
    try {
      const snap = await getDoc(doc(db, 'config', 'admins'));
      if (snap.exists() && Array.isArray(snap.data().emails)) {
        setAdminEmails(snap.data().emails);
      } else {
        const def = ['admin@ticket.pl'];
        setAdminEmails(def);
        await setDoc(doc(db, 'config', 'admins'), { emails: def });
      }
    } catch (e) { console.error(e); }
    setLoadingAdmins(false);
  };

  useEffect(() => {
    if (tab === 'admins') loadAdminEmails();
  }, [tab]);

  const addAdmin = async () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;
    if (adminEmails.includes(email)) {
      alert('Ten adres jest już na liście.');
      return;
    }
    try {
      await setDoc(doc(db, 'config', 'admins'), { emails: [...adminEmails, email] }, { merge: true });
      setAdminEmails([...adminEmails, email]);
      setNewAdminEmail('');
      alert('✅ Administrator dodany.');
    } catch (e) { console.error(e); alert('Błąd zapisu.'); }
  };

  const removeAdmin = async (email) => {
    if (adminEmails.length <= 1) {
      alert('Musi pozostać co najmniej jeden administrator.');
      return;
    }
    if (!window.confirm(`Usunąć administratora: ${email}?`)) return;
    const next = adminEmails.filter(e => e !== email);
    try {
      await setDoc(doc(db, 'config', 'admins'), { emails: next });
      setAdminEmails(next);
      alert('✅ Usunięto.');
    } catch (e) { console.error(e); alert('Błąd.'); }
  };

  const handleKoncertSubmit = async (e) => {
    e.preventDefault();
    const dane = { ...form, cenaBazowa: Number(form.cenaBazowa) };
    
    try {
      if (editingId) {
        // Przy edycji zachowujemy istniejące rezerwacje
        const stary = koncerty.find(k => k.id_db === editingId);
        dane.zajeteMiejsca = stary?.zajeteMiejsca || [];
        dane.zablokowaneMiejsca = stary?.zablokowaneMiejsca || {};
        await updateDoc(doc(db, "koncerty", editingId), dane);
        alert("✅ Zmiany zapisane!");
      } else {
        // Nowy koncert
        dane.zajeteMiejsca = [];
        dane.zablokowaneMiejsca = {};
        await addDoc(collection(db, "koncerty"), dane);
        alert("✅ Koncert dodany!");
      }
      
      setForm({ artysta: '', cenaBazowa: '', data: '', image: '', isPromoted: false, planSali: 'arena', kategoria: '🎵 Muzyka', ticketBg: '', ticketColor: '#fbcfe8' });
      setEditingId(null);
      refreshData();
    } catch (err) { console.error(err); }
  };

  const startEdit = (k) => {
    setEditingId(k.id_db);
    setForm({
      artysta: k.artysta, cenaBazowa: k.cenaBazowa, data: k.data, 
      image: k.image || '', isPromoted: k.isPromoted || false, 
      planSali: k.planSali || 'arena', kategoria: k.kategoria || '🎵 Muzyka',
      ticketBg: k.ticketBg || '', ticketColor: k.ticketColor || '#fbcfe8'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dodajRzadDoKreatora = () => {
    if(!tempRzad.nazwa) return;
    setNoweRzedy([...noweRzedy, { ...tempRzad, id: Date.now() }]);
    setTempRzad({ nazwa: '', mnoznik: 1.0, ilosc: 5 });
  };

  const startEditPlan = (planId, plan, wizualny = false) => {
    setEditingPlanId(planId);
    setNazwaNowejSali(plan.nazwa);
    if (wizualny) {
      setTrybEdycjiPlanu('wizualny');
    } else {
      const grupowane = {};
      (plan.miejsca || []).forEach(m => {
        if (!grupowane[m.rzad]) grupowane[m.rzad] = { nazwa: m.rzad, mnoznik: m.mnoznik || 1, count: 0 };
        grupowane[m.rzad].count++;
      });
      setNoweRzedy(Object.values(grupowane).map((r, i) => ({ nazwa: r.nazwa, mnoznik: r.mnoznik, ilosc: r.count, id: Date.now() + i })));
      setTrybEdycjiPlanu('formularz');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const zapiszZEdytoraWizualnego = async (dane) => {
    const docId = editingPlanId || dane.nazwa.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try {
      await setDoc(doc(db, "planySali", docId), { nazwa: dane.nazwa, miejsca: dane.miejsca });
      alert(editingPlanId ? "✅ Plan zaktualizowany!" : "🎉 Plan sali utworzony!");
      anulujEdycjePlanu();
      await refreshPlany();
      if (!editingPlanId) setTab('koncerty');
    } catch (e) { console.error(e); }
  };

  const anulujEdycjePlanu = () => {
    setEditingPlanId(null);
    setNazwaNowejSali('');
    setNoweRzedy([]);
    setTempRzad({ nazwa: '', mnoznik: 1.0, ilosc: 5 });
    setTrybEdycjiPlanu('formularz');
  };

  const zapiszNowaSale = async () => {
    if(!nazwaNowejSali || noweRzedy.length === 0) return;
    let seatId = 1;
    const wygenerowaneMiejsca = [];
    noweRzedy.forEach(r => {
      for(let i=0; i<Number(r.ilosc); i++) {
        wygenerowaneMiejsca.push({ id: seatId++, rzad: r.nazwa, mnoznik: Number(r.mnoznik), numer: i + 1 });
      }
    });
    const docId = editingPlanId || nazwaNowejSali.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try {
      await setDoc(doc(db, "planySali", docId), { nazwa: nazwaNowejSali, miejsca: wygenerowaneMiejsca });
      alert(editingPlanId ? "✅ Plan sali zaktualizowany!" : "🎉 Sala utworzona!");
      anulujEdycjePlanu();
      await refreshPlany();
      if (!editingPlanId) setTab('koncerty');
    } catch (e) { console.error(e); }
  };

  const wbudowanePlany = ['arena', 'kameralna', 'hala5k'];
  const usunPlanSali = async (planId) => {
    if (wbudowanePlany.includes(planId)) {
      alert("Nie można usunąć wbudowanego planu. Edytuj go, aby zapisać zmiany.");
      return;
    }
    if (!window.confirm(`Usunąć plan sali "${planySali[planId]?.nazwa}"? Koncerty używające tej sali mogą przestać działać.`)) return;
    try {
      await deleteDoc(doc(db, "planySali", planId));
      alert("🗑️ Plan usunięty.");
      await refreshPlany();
      if (editingPlanId === planId) anulujEdycjePlanu();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="fade-in" style={{ width: '100%' }}>
      {onBackToSite && (
        <button className="page-btn" onClick={onBackToSite} style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.08)' }}>
          ← Wróć na stronę
        </button>
      )}
      {/* TABS */}
      <div className="admin-tabs">
        <button className="page-btn" onClick={() => setTab('dashboard')} style={{ background: tab === 'dashboard' ? 'var(--primary)' : 'rgba(255,255,255,0.08)', borderColor: tab === 'dashboard' ? 'var(--primary)' : undefined }}>📊 Dashboard</button>
        <button className="page-btn" onClick={() => setTab('koncerty')} style={{ background: tab === 'koncerty' ? 'var(--primary)' : 'rgba(255,255,255,0.08)', borderColor: tab === 'koncerty' ? 'var(--primary)' : undefined }}>🎤 Zarządzaj Wydarzeniami</button>
        <button className="page-btn" onClick={() => setTab('kreator')} style={{ background: tab === 'kreator' ? '#8b5cf6' : 'rgba(255,255,255,0.08)', borderColor: tab === 'kreator' ? '#8b5cf6' : undefined }}>🪑 Kreator Planów Sali</button>
        <button className="page-btn" onClick={() => setTab('admins')} style={{ background: tab === 'admins' ? '#10b981' : 'rgba(255,255,255,0.08)', borderColor: tab === 'admins' ? '#10b981' : undefined }}>👥 Administratorzy</button>
      </div>

      {tab === 'dashboard' ? (
        <AdminDashboard koncerty={koncerty} planySali={planySali} />
      ) : tab === 'admins' ? (
        <div className="seating-card">
          <h2>👥 Zarządzanie administratorami</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.95rem' }}>
            Użytkownicy z poniższymi adresami e-mail mają dostęp do panelu administratora.
          </p>
          <div className="admin-admins-add">
            <input type="email" placeholder="np. nowy.admin@example.com" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
            <button className="btn-buy" onClick={addAdmin} style={{ background: '#10b981' }}>Dodaj administratora</button>
          </div>
          {loadingAdmins ? <p style={{ color: 'var(--text-muted)' }}>Ładowanie…</p> : (
            <div className="admin-admins-list">
              {adminEmails.map(email => (
                <div key={email} className="admin-admin-row">
                  <span>{email}</span>
                  <button className="logout-btn" onClick={() => removeAdmin(email)} style={{ padding: '6px 12px' }} disabled={adminEmails.length <= 1}>Usuń</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === 'koncerty' ? (
        <>
          {/* FORMULARZ */}
          <div className="seating-card admin-form-card" style={{ marginBottom: '30px' }}>
             <h2>{editingId ? "✏️ Edytuj Koncert" : "🛠️ Dodaj Koncert"}</h2>
             <form onSubmit={handleKoncertSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="text" className="auth-input" placeholder="Artysta / Trasa" value={form.artysta} onChange={e => setForm({...form, artysta: e.target.value})} required />
                
                <div className="admin-form-row">
                  <select className="auth-input" value={form.planSali} onChange={e => setForm({...form, planSali: e.target.value})} style={{flex: 1}}>
                    {Object.entries(planySali).map(([id, plan]) => <option key={id} value={id}>Sala: {plan.nazwa}</option>)}
                  </select>
                  <select className="auth-input" value={form.kategoria} onChange={e => setForm({...form, kategoria: e.target.value})} style={{flex: 1}}>
                    {kategorie.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>

                <div className="admin-form-row">
                  <input type="number" className="auth-input" placeholder="Cena PLN" value={form.cenaBazowa} onChange={e => setForm({...form, cenaBazowa: e.target.value})} required style={{flex: 1}} />
                  <input type="date" className="auth-input" value={form.data} onChange={e => setForm({...form, data: e.target.value})} required style={{flex: 1}} />
                </div>

                <div className="admin-color-section">
                  <label className="pt-label">Personalizacja Biletu</label>
                  <input type="url" className="auth-input" placeholder="URL zdjęcia tła biletu (opcjonalnie)" value={form.ticketBg} onChange={e => setForm({...form, ticketBg: e.target.value})} style={{ marginBottom: '12px' }} />
                  <label className="pt-label">Kolor Passport</label>
                  <input type="color" className="auth-input" value={form.ticketColor} onChange={e => setForm({...form, ticketColor: e.target.value})} />
                </div>

                <button type="submit" className="btn-buy">{editingId ? "Zapisz zmiany" : "Opublikuj Wydarzenie"}</button>
                {editingId && <button type="button" className="logout-btn" onClick={() => {setEditingId(null); setForm({artysta:'', cenaBazowa:'', data:'', image:'', isPromoted:false, planSali:'arena', kategoria:'🎵 Muzyka', ticketBg:'', ticketColor:'#fbcfe8'})}}>Anuluj edycję</button>}
             </form>
          </div>

          {/* LISTA KONCERTÓW (PRZYWRÓCONA) */}
          <div className="seating-card">
            <h2>📋 Lista aktywnych koncertów</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {koncerty.map(k => (
                <div key={k.id_db} className="admin-concert-item">
                  <div>
                    <strong>{k.artysta}</strong>
                    <div className="admin-concert-meta">{k.data} | {k.kategoria} | {k.cenaBazowa} PLN</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="page-btn" onClick={() => startEdit(k)} style={{ padding: '5px 15px' }}>Edytuj</button>
                    <button className="logout-btn" onClick={() => { if(window.confirm("Usunąć?")) deleteDoc(doc(db, "koncerty", k.id_db)) }} style={{ padding: '5px 15px' }}>Usuń</button>
                  </div>
                </div>
              ))}
              {koncerty.length === 0 && <p style={{color: 'var(--text-muted)', textAlign: 'center'}}>Brak koncertów w bazie.</p>}
            </div>
          </div>
        </>
      ) : (
        /* KREATOR SAL */
        <>
          <div className="seating-card" style={{ marginBottom: '30px' }}>
            <h2>{editingPlanId ? "✏️ Edytuj Plan Sali" : "🪑 Nowy Plan Sali"}</h2>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button
                className={`page-btn ${trybEdycjiPlanu === 'formularz' ? 'active' : ''}`}
                onClick={() => setTrybEdycjiPlanu('formularz')}
                style={{ background: trybEdycjiPlanu === 'formularz' ? '#8b5cf6' : 'rgba(255,255,255,0.08)' }}
              >
                Formularz
              </button>
              <button
                className={`page-btn ${trybEdycjiPlanu === 'wizualny' ? 'active' : ''}`}
                onClick={() => setTrybEdycjiPlanu('wizualny')}
                style={{ background: trybEdycjiPlanu === 'wizualny' ? '#8b5cf6' : 'rgba(255,255,255,0.08)' }}
              >
                🎨 Edytor wizualny
              </button>
            </div>

            {trybEdycjiPlanu === 'wizualny' ? (
              <>
                <input type="text" className="auth-input" placeholder="Nazwa sali (np. Sala Konferencyjna)" value={nazwaNowejSali} onChange={e => setNazwaNowejSali(e.target.value)} style={{ marginBottom: '20px' }} />
                <PlanSaliEditor
                  plan={editingPlanId ? planySali[editingPlanId] : null}
                  nazwaSali={nazwaNowejSali}
                  onSave={zapiszZEdytoraWizualnego}
                  onCancel={anulujEdycjePlanu}
                />
              </>
            ) : (
              <>
            <input type="text" className="auth-input" placeholder="Nazwa sali (np. Sala Konferencyjna)" value={nazwaNowejSali} onChange={e => setNazwaNowejSali(e.target.value)} />
            
            <div className="admin-form-row" style={{ marginBottom: '20px' }}>
              <input type="text" className="auth-input" placeholder="Rząd (np. Parter)" value={tempRzad.nazwa} onChange={e => setTempRzad({...tempRzad, nazwa: e.target.value})} style={{flex: 2, marginBottom: 0}} />
              <input type="number" className="auth-input" placeholder="Miejsca" value={tempRzad.ilosc} onChange={e => setTempRzad({...tempRzad, ilosc: e.target.value})} style={{flex: 1, marginBottom: 0}} />
              <input type="number" step="0.1" className="auth-input" placeholder="Mnożnik ceny" value={tempRzad.mnoznik} onChange={e => setTempRzad({...tempRzad, mnoznik: parseFloat(e.target.value) || 1})} style={{flex: 1, marginBottom: 0}} title="Mnożnik ceny (np. 1.5 = 50% drożej)" />
              <button className="page-btn" onClick={dodajRzadDoKreatora}>Dodaj Rząd</button>
            </div>

            <div style={{background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', marginBottom: '20px'}}>
              {noweRzedy.map(r => (
                <div key={r.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 0'}}>
                  <span>{r.nazwa}: {r.ilosc} miejsc × {r.mnoznik}</span>
                  <button type="button" onClick={() => setNoweRzedy(noweRzedy.filter(x => x.id !== r.id))} style={{color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px'}}>Usuń</button>
                </div>
              ))}
              {noweRzedy.length === 0 && <p style={{color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem'}}>Dodaj rzędy powyżej.</p>}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn-buy" onClick={zapiszNowaSale} style={{background: '#10b981', flex: 1, minWidth: '200px'}}>
                {editingPlanId ? "Zapisz zmiany" : "Wygeneruj i Zapisz Salę"}
              </button>
              {editingPlanId && (
                <button type="button" className="logout-btn" onClick={anulujEdycjePlanu}>Anuluj edycję</button>
              )}
            </div>
              </>
            )}
          </div>

          <div className="seating-card">
            <h2>📋 Istniejące plany sal</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(planySali).map(([id, plan]) => (
                <div key={id} className="admin-concert-item">
                  <div>
                    <strong>{plan.nazwa}</strong>
                    <div className="admin-concert-meta">
                      {(plan.miejsca || []).length} miejsc · ID: {id}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className="page-btn" onClick={() => startEditPlan(id, plan)} style={{ padding: '5px 15px' }}>Edytuj</button>
                    <button className="page-btn" onClick={() => startEditPlan(id, plan, true)} style={{ padding: '5px 15px' }}>🎨 Edytor wizualny</button>
                    {!wbudowanePlany.includes(id) && (
                      <button className="logout-btn" onClick={() => usunPlanSali(id)} style={{ padding: '5px 15px' }}>Usuń</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}