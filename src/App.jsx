import { useState, useEffect } from 'react';
import { auth, db } from './firebase'; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, addDoc, getDoc, setDoc, query, where, onSnapshot } from 'firebase/firestore';
import './App.css';

import ConcertList from './components/ConcertList';
import ReservationView from './components/ReservationView';
import AuthView from './components/AuthView';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import ConcertSlider from './components/ConcertSlider';
import HotEvents from './components/HotEvents';
import Header from './components/Header';
import Footer from './components/Footer';

// Ta stała jest już tutaj, więc nie musimy jej importować z zewnątrz
const DOSTEPNE_KATEGORIE = ["🎵 Muzyka", "🎭 Teatr", "🎤 Stand-up", "🏟️ Sport", "🎪 Inne"];

const domyslnePlany = {
  arena: {
    nazwa: "Arena Główna",
    miejsca: [
      { id: 1, rzad: "VIP (Front)", mnoznik: 1.5, numer: 1 }, { id: 2, rzad: "VIP (Front)", mnoznik: 1.5, numer: 2 },
      { id: 3, rzad: "VIP (Front)", mnoznik: 1.5, numer: 3 }, { id: 4, rzad: "VIP (Front)", mnoznik: 1.5, numer: 4 },
      { id: 5, rzad: "Normalny", mnoznik: 1.0, numer: 5 }, { id: 6, rzad: "Normalny", mnoznik: 1.0, numer: 6 },
      { id: 7, rzad: "Normalny", mnoznik: 1.0, numer: 7 }, { id: 8, rzad: "Normalny", mnoznik: 1.0, numer: 8 },
      { id: 9, rzad: "Normalny", mnoznik: 1.0, numer: 9 }, { id: 10, rzad: "Normalny", mnoznik: 1.0, numer: 10 },
      { id: 11, rzad: "Tył (Eco)", mnoznik: 0.8, numer: 11 }, { id: 12, rzad: "Tył (Eco)", mnoznik: 0.8, numer: 12 },
      { id: 13, rzad: "Tył (Eco)", mnoznik: 0.8, numer: 13 }, { id: 14, rzad: "Tył (Eco)", mnoznik: 0.8, numer: 14 },
      { id: 15, rzad: "Tył (Eco)", mnoznik: 0.8, numer: 15 }
    ]
  },
  kameralna: {
    nazwa: "Sala Kameralna",
    miejsca: [
      { id: 1, rzad: "Premium", mnoznik: 2.0, numer: 1 }, { id: 2, rzad: "Premium", mnoznik: 2.0, numer: 2 },
      { id: 3, rzad: "Premium", mnoznik: 2.0, numer: 3 }, { id: 4, rzad: "Standard", mnoznik: 1.0, numer: 4 },
      { id: 5, rzad: "Standard", mnoznik: 1.0, numer: 5 }, { id: 6, rzad: "Standard", mnoznik: 1.0, numer: 6 },
      { id: 7, rzad: "Standard", mnoznik: 1.0, numer: 7 }, { id: 8, rzad: "Standard", mnoznik: 1.0, numer: 8 }
    ]
  },
  hala5k: {
    nazwa: "Hala 5000 – Tauron Arena",
    miejsca: (() => {
      const m = [];
      let id = 1;
      const add = (rzad, count, mnoznik) => {
        for (let i = 1; i <= count; i++) m.push({ id: id++, rzad, mnoznik, numer: i });
      };
      for (let r = 1; r <= 10; r++) add(`VIP Pod Sceną Rząd ${r}`, 100, 2.0);     // 1000
      for (let r = 1; r <= 40; r++) add(`Płyta Główna Rząd ${r}`, 50, 1.2);        // 2000
      for (let r = 1; r <= 20; r++) add(`Trybuna Lewa Rząd ${r}`, 50, 0.8);        // 1000
      for (let r = 1; r <= 20; r++) add(`Trybuna Prawa Rząd ${r}`, 50, 0.8);       // 1000
      return m;
    })()
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  
  const [koncerty, setKoncerty] = useState([]);
  const [planySali, setPlanySali] = useState(domyslnePlany);
  
  const [wybranyKoncert, setWybranyKoncert] = useState(null);
  const [wybraneMiejsca, setWybraneMiejsca] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');
  
  const [historiaZamowien, setHistoriaZamowien] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [obserwowaneIds, setObserwowaneIds] = useState([]);
  
  const [timeLeft, setTimeLeft] = useState(300);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminEmails, setAdminEmails] = useState(['admin@ticket.pl']);
  const [promotorEmails, setPromotorEmails] = useState([]);
  const itemsPerPage = 8;

  const kategorieZMenu = ["Wszystkie", ...DOSTEPNE_KATEGORIE];

  const fetchPlanySali = async () => {
    try {
      const q = await getDocs(collection(db, "planySali"));
      const pobrane = {};
      q.docs.forEach(doc => { pobrane[doc.id] = doc.data(); });
      setPlanySali({ ...domyslnePlany, ...pobrane });
    } catch (e) { console.error(e); }
  };

  const fetchZamowienia = async (userEmail) => {
    try {
      const q = query(collection(db, "zamowienia"), where("userEmail", "==", userEmail));
      const querySnapshot = await getDocs(q);
      const bilety = querySnapshot.docs.map(doc => doc.data());
      bilety.sort((a, b) => new Date(b.dataZakupu) - new Date(a.dataZakupu));
      setHistoriaZamowien(bilety);
    } catch (e) { console.error(e); }
  };

  const fetchObserwowane = async (uid) => {
    if (!uid) return;
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists() && Array.isArray(snap.data().obserwowaneIds)) {
        setObserwowaneIds(snap.data().obserwowaneIds);
      } else {
        setObserwowaneIds([]);
      }
    } catch (e) { console.error(e); }
  };

  const toggleObserwowane = async (koncertId) => {
    if (!user) return;
    const uid = user.uid;
    let next = obserwowaneIds.includes(koncertId)
      ? obserwowaneIds.filter(id => id !== koncertId)
      : [...obserwowaneIds, koncertId];
    setObserwowaneIds(next);
    try {
      await setDoc(doc(db, "users", uid), { obserwowaneIds: next }, { merge: true });
    } catch (e) { console.error(e); setObserwowaneIds(obserwowaneIds); }
  };

  const fetchAdminEmails = async () => {
    try {
      const snap = await getDoc(doc(db, "config", "admins"));
      if (snap.exists() && Array.isArray(snap.data().emails)) {
        setAdminEmails(snap.data().emails);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAdminEmails();
    const unsubAdmins = onSnapshot(doc(db, "config", "admins"), (snap) => {
      if (snap.exists() && Array.isArray(snap.data()?.emails)) {
        setAdminEmails(snap.data().emails);
      }
    });
    return () => unsubAdmins();
  }, []);

  useEffect(() => {
    const unsubPromotors = onSnapshot(doc(db, "config", "promotors"), (snap) => {
      if (snap.exists() && Array.isArray(snap.data()?.emails)) {
        setPromotorEmails(snap.data().emails);
      } else {
        setPromotorEmails([]);
      }
    });
    return () => unsubPromotors();
  }, []);

  const canAccessAdminPanel = user?.email && (adminEmails.includes(user.email) || promotorEmails.includes(user.email));
  const isPromotorOnly = canAccessAdminPanel && !adminEmails.includes(user?.email);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(u?.email && adminEmails.includes(u.email));
      if (u) {
        fetchZamowienia(u.email);
        fetchObserwowane(u.uid);
        setShowAuth(false);
      } else {
        setObserwowaneIds([]);
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, [adminEmails, promotorEmails]);

  const deduplicateKoncerty = (lista) => {
    const normalize = (artysta) => String(artysta || '').replace(/#\d+$/, '').trim().toLowerCase();
    const seen = new Set();
    return lista.filter(k => {
      const key = normalize(k.artysta);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  useEffect(() => {
    const unsubKoncerty = onSnapshot(collection(db, "koncerty"), (snapshot) => {
      const raw = snapshot.docs.map(d => ({ id_db: d.id, ...d.data() }));
      setKoncerty(deduplicateKoncerty(raw));
    });
    fetchPlanySali();
    return () => unsubKoncerty();
  }, []);

  const odblokujMiejsca = async () => {
    if (!wybranyKoncert || wybraneMiejsca.length === 0 || !user) return;
    try {
      const freshKoncert = koncerty.find(k => k.id_db === wybranyKoncert.id_db);
      if(freshKoncert) {
        const zablokowane = { ...(freshKoncert.zablokowaneMiejsca || {}) };
        wybraneMiejsca.forEach(id => delete zablokowane[id]);
        await updateDoc(doc(db, "koncerty", freshKoncert.id_db), { zablokowaneMiejsca: zablokowane });
      }
    } catch(e) { console.error(e); }
    setWybraneMiejsca([]);
  };

  useEffect(() => {
    let timer;
    if (wybranyKoncert && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && wybranyKoncert) {
      odblokujMiejsca();
      setWybranyKoncert(null);
      alert("⏳ Czas na rezerwację minął! Miejsca wróciły do puli.");
    }
    return () => clearInterval(timer);
  }, [wybranyKoncert, timeLeft]);

  // NOWOŚĆ: Pozwalamy każdemu (nawet niezalogowanym) wejść w wydarzenie!
  const handleSelectConcert = (k) => {
    setWybranyKoncert(k);
    setTimeLeft(300);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const autoSelectSeat = async (rzad) => {
    if (!user) return;
    const freshKoncert = koncerty.find(k => k.id_db === wybranyKoncert.id_db);
    if (!freshKoncert) return;
    const plan = planySali[freshKoncert.planSali]?.miejsca || planySali.arena.miejsca;
    const zajete = freshKoncert.zajeteMiejsca || [];
    const zablokowane = freshKoncert.zablokowaneMiejsca || {};
    const dostepne = plan.find(m => m.rzad === rzad && !zajete.includes(m.id) && (!zablokowane[m.id] || zablokowane[m.id] === user.email));
    if (dostepne) await toggleMiejsce(dostepne.id);
    else alert("Brak wolnych miejsc w tej kategorii cenowej.");
  };

  const toggleMiejsce = async (id) => {
    if(!user) return;
    const freshKoncert = koncerty.find(k => k.id_db === wybranyKoncert.id_db);
    if (!freshKoncert) return;

    const zablokowane = { ...(freshKoncert.zablokowaneMiejsca || {}) };
    const zajete = freshKoncert.zajeteMiejsca || [];

    if (zajete.includes(id)) return;

    const isLockedByMe = zablokowane[id] === user.email;
    const isLockedByOther = zablokowane[id] && zablokowane[id] !== user.email;

    if (isLockedByOther) {
      alert("⚠️ To miejsce jest właśnie rezerwowane przez kogoś innego!");
      return;
    }

    if (isLockedByMe) {
      delete zablokowane[id];
      setWybraneMiejsca(prev => prev.filter(m => m !== id));
    } else {
      zablokowane[id] = user.email;
      setWybraneMiejsca(prev => [...prev, id]);
    }
    await updateDoc(doc(db, "koncerty", freshKoncert.id_db), { zablokowaneMiejsca: zablokowane });
  };

  const kupBilety = async () => {
    if (wybraneMiejsca.length === 0 || !user) return;
    try {
      const freshKoncert = koncerty.find(k => k.id_db === wybranyKoncert.id_db);
      const uzytyPlan = planySali[freshKoncert.planSali] || planySali.arena;
      const suma = wybraneMiejsca.reduce((acc, id) => {
        const m = uzytyPlan.miejsca.find(item => item.id === id);
        return acc + (freshKoncert.cenaBazowa * (m?.mnoznik || 1));
      }, 0);

      const noweZajete = [...(freshKoncert.zajeteMiejsca || []), ...wybraneMiejsca];
      const zablokowane = { ...(freshKoncert.zablokowaneMiejsca || {}) };
      wybraneMiejsca.forEach(id => delete zablokowane[id]);

      await updateDoc(doc(db, "koncerty", freshKoncert.id_db), { 
        zajeteMiejsca: noweZajete, zablokowaneMiejsca: zablokowane 
      });
      
      const noweZamowienie = {
        userEmail: user.email, 
        koncertId: freshKoncert.id_db,
        artysta: freshKoncert.artysta,
        miejsca: wybraneMiejsca.map(id => uzytyPlan.miejsca.find(m => m.id === id).numer),
        koszt: Math.round(suma), 
        dataZakupu: new Date().toISOString(),
        ticketBg: freshKoncert.ticketBg || freshKoncert.image || '',
        ticketColor: freshKoncert.ticketColor || '#f8fafc'
      };
      
      await addDoc(collection(db, "zamowienia"), noweZamowienie);
      alert("✅ Transakcja udana! Bilet zapisany.");
      
      setWybranyKoncert(null); setWybraneMiejsca([]); fetchZamowienia(user.email); setShowProfile(true);
    } catch (e) { console.error(e); alert("❌ Błąd podczas zakupu."); }
  };

  const filtered = koncerty.filter(k => {
    const dopasowanieWyszukiwarki = k.artysta.toLowerCase().includes(searchQuery.toLowerCase());
    const dopasowanieKategorii = selectedCategory === 'Wszystkie' || (k.kategoria || '🎵 Muzyka') === selectedCategory;
    return dopasowanieWyszukiwarki && dopasowanieKategorii;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentConcerts = filtered.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);

  const aktualnyKoncertDoWidoku = wybranyKoncert ? koncerty.find(k => k.id_db === wybranyKoncert.id_db) : null;
  const planySaliZDomyslnymi = { ...domyslnePlany, ...planySali };

  if (loading) return <div className="app-wrapper"><h2 style={{color: '#94a3b8'}}>Ładowanie systemu...</h2></div>;

  const handleLogoClick = () => {
    setWybranyKoncert(null);
    setShowProfile(false);
  };

  return (
    <div className="app-wrapper">
      <Header
        user={user}
        isAdmin={isAdmin}
        isPromotorOnly={isPromotorOnly}
        canAccessAdminPanel={canAccessAdminPanel}
        showProfile={showProfile}
        showAdminPanel={showAdminPanel}
        onLogin={() => setShowAuth(true)}
        onLogout={() => signOut(auth)}
        onToggleProfile={() => { setShowProfile(!showProfile); setWybranyKoncert(null); setShowAdminPanel(false); }}
        onToggleAdminPanel={() => { setShowAdminPanel(!showAdminPanel); setShowProfile(false); setWybranyKoncert(null); }}
        onLogoClick={() => { handleLogoClick(); setShowAdminPanel(false); }}
      />

      <main className="app-main">
      <div className="container">
        {showAuth && !user ? (
          <AuthView onClose={() => setShowAuth(false)} />
        ) : showAdminPanel && canAccessAdminPanel && user ? (
          <AdminPanel 
            koncerty={koncerty} 
            refreshData={() => {}} 
            planySali={{ ...domyslnePlany, ...planySali }} 
            refreshPlany={fetchPlanySali}
            user={user}
            isAdmin={isAdmin}
            onBackToSite={() => setShowAdminPanel(false)}
          />
        ) : showProfile && user ? (
          <UserProfile 
            user={user} 
            historia={historiaZamowien} 
            onClose={() => setShowProfile(false)}
            koncerty={koncerty}
            obserwowaneIds={obserwowaneIds}
            toggleObserwowane={toggleObserwowane}
            onSelectConcert={(k) => { setShowProfile(false); handleSelectConcert(k); }}
          />
        ) : aktualnyKoncertDoWidoku ? (
          <ReservationView 
            wybranyKoncert={aktualnyKoncertDoWidoku} 
            user={user}
            userEmail={user?.email} 
            onRequireAuth={() => setShowAuth(true)}
            setWybranyKoncert={setWybranyKoncert} 
            wybraneMiejsca={wybraneMiejsca} 
            toggleMiejsce={toggleMiejsce} 
            autoSelectSeat={autoSelectSeat}
            kupBilety={kupBilety} 
            wszystkieMiejsca={planySaliZDomyslnymi[aktualnyKoncertDoWidoku.planSali]?.miejsca || planySaliZDomyslnymi.arena?.miejsca}
            nazwaSali={planySaliZDomyslnymi[aktualnyKoncertDoWidoku.planSali]?.nazwa || planySaliZDomyslnymi.arena?.nazwa}
            timeLeft={timeLeft} 
            odblokujMiejsca={odblokujMiejsca}
            koncerty={koncerty}
            obserwowaneIds={obserwowaneIds}
            toggleObserwowane={toggleObserwowane}
          />
        ) : (
          <div className="fade-in" style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            
            {searchQuery === '' && selectedCategory === 'Wszystkie' && koncerty.length > 0 && (
              <>
                <ConcertSlider 
                  koncerty={koncerty} 
                  onSelect={handleSelectConcert}
                  user={user}
                  obserwowaneIds={obserwowaneIds}
                  toggleObserwowane={toggleObserwowane}
                  onRequireAuth={() => setShowAuth(true)}
                />
                <HotEvents koncerty={koncerty} onSelect={handleSelectConcert} />
              </>
            )}
            
            <div className="search-box" style={{ width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
              <h1 className="main-title">Przeglądaj Wydarzenia</h1>
              <input type="text" className="search-input" placeholder="🔍 Szukaj artysty, trasy lub drużyny..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
              <div className="category-filters">
                {kategorieZMenu.map(kat => (
                  <button key={kat} className={`filter-btn ${selectedCategory === kat ? 'active' : ''}`} onClick={() => { setSelectedCategory(kat); setCurrentPage(1); }}>{kat}</button>
                ))}
              </div>
            </div>

            <ConcertList 
              koncerty={currentConcerts} 
              setWybranyKoncert={handleSelectConcert} 
              setWybraneMiejsca={setWybraneMiejsca}
              user={user}
              obserwowaneIds={obserwowaneIds}
              toggleObserwowane={toggleObserwowane}
              onRequireAuth={() => setShowAuth(true)}
            />
            
            {totalPages > 1 && (
              <div style={{display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '50px', marginBottom: '40px'}}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="page-btn">Poprzednia</button>
                <span style={{alignSelf: 'center', fontWeight: 'bold'}}>{currentPage} / {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="page-btn">Następna</button>
              </div>
            )}
            
          </div>
        )}
      </div>
      </main>

      <Footer />
    </div>
  );
}