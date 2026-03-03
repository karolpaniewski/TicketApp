import { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function AuthView({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isAdminMode) {
        await signInWithEmailAndPassword(auth, "admin@ticket.pl", password);
      } else if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("🎉 Konto założone! Możesz się teraz zalogować.");
        setIsRegister(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      alert("❌ Błąd: " + err.message);
    }
  };

  return (
    <div className="auth-view-wrapper">
      <div className="auth-card" style={{ position: 'relative' }}>
        
        {/* NOWOŚĆ: Przycisk powrotu do strony głównej dla gościa */}
        {onClose && (
          <button 
            onClick={onClose} 
            className="page-btn"
            style={{ position: 'absolute', top: '20px', left: '20px', padding: '8px 15px', fontSize: '0.85rem' }}
          >
            ← Wróć
          </button>
        )}

        <h2 className="main-title" style={{ fontSize: '2.5rem', marginBottom: '10px', marginTop: '30px', background: isAdminMode ? 'linear-gradient(to right, #ef4444, #f87171)' : '', WebkitBackgroundClip: isAdminMode ? 'text' : '', WebkitTextFillColor: isAdminMode ? 'transparent' : '' }}>
          {isAdminMode ? "🔐 Panel Admina" : isRegister ? "Załóż konto" : "Witaj ponownie"}
        </h2>
        
        <p style={{ color: '#94a3b8', marginBottom: '30px', textAlign: 'center' }}>
          {isAdminMode 
            ? "Wprowadź hasło dostępowe dla personelu zarządzającego." 
            : "Zaloguj się, aby zarezerwować najlepsze miejsca."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isAdminMode && (
            <input 
              type="email" className="search-input" placeholder="Adres e-mail"
              value={email} onChange={e => setEmail(e.target.value)} required 
              style={{ marginBottom: '0' }}
            />
          )}
          
          <input 
            type="password" className="search-input" placeholder="Hasło (min. 6 znaków)"
            value={password} onChange={e => setPassword(e.target.value)} required 
            style={{ marginBottom: '10px' }}
          />
          
          <button type="submit" className="btn-buy" style={{ padding: '15px', background: isAdminMode ? 'linear-gradient(to right, #ef4444, #b91c1c)' : '' }}>
            {isAdminMode ? "Zaloguj do Panelu" : isRegister ? "Zarejestruj się" : "Zaloguj się"}
          </button>
        </form>

        {!isAdminMode && (
          <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: '#3b82f6', marginTop: '20px', cursor: 'pointer', width: '100%' }}>
            {isRegister ? "Masz już konto? Zaloguj się" : "Nie masz konta? Załóż je tutaj"}
          </button>
        )}

        <hr style={{ border: '0', borderTop: '1px solid #1f2937', margin: '25px 0' }} />

        <button 
          onClick={() => { setIsAdminMode(!isAdminMode); setPassword(''); setIsRegister(false); }}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', width: '100%', fontSize: '0.9rem' }}
        >
          {isAdminMode ? "← Wróć do logowania klienta" : "Logowanie dla personelu (Admin)"}
        </button>
      </div>
    </div>
  );
}