import { useState } from 'react';

export default function LoginView({ onLogin }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAdminMode) {
      if (password === "admin123") {
        onLogin("Administrator", true); // Przekazuje informację, że to admin
      } else {
        alert("❌ Błędne hasło admina!");
      }
    } else {
      if (name.trim().length >= 3) {
        onLogin(name, false); // Przekazuje informację, że to zwykły user
      } else {
        alert("❌ Imię musi mieć min. 3 znaki.");
      }
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '100px auto', textAlign: 'center' }}>
      <h2 className="title">{isAdminMode ? "🔐 Panel Admina" : "👋 Witaj!"}</h2>
      <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
        {isAdminMode ? "Podaj hasło dostępowe" : "Wpisz swoje imię, aby zacząć"}
      </p>

      <form onSubmit={handleSubmit}>
        {!isAdminMode ? (
          <input 
            type="text" className="search-input" placeholder="Twoje imię..."
            value={name} onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: '20px', textAlign: 'center' }}
          />
        ) : (
          <input 
            type="password" className="search-input" placeholder="Hasło..."
            value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: '20px', textAlign: 'center' }}
          />
        )}
        
        <button type="submit" className="btn-blue">
          {isAdminMode ? "Zaloguj do Panelu" : "Wejdź do systemu"}
        </button>
      </form>

      <hr style={{ border: '0', borderTop: '1px solid #334155', margin: '20px 0' }} />

      <button 
        onClick={() => setIsAdminMode(!isAdminMode)}
        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
      >
        {isAdminMode ? "Wróć do logowania klienta" : "Logowanie dla personelu (Admin)"}
      </button>
    </div>
  );
}