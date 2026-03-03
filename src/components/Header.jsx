export default function Header({ user, isAdmin, showProfile, showAdminPanel, onLogin, onLogout, onToggleProfile, onToggleAdminPanel, onLogoClick }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="header-logo" onClick={onLogoClick}>
          <span className="header-logo-icon">🎫</span>
          <span className="header-logo-text">BiletyGo</span>
        </button>

        <nav className="header-nav">
          <a href="#" onClick={(e) => { e.preventDefault(); onLogoClick(); }}>Strona główna</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onLogoClick(); }}>Wydarzenia</a>
          {isAdmin && user && <span className="header-badge">Admin</span>}
        </nav>

        <div className="header-auth">
          {user ? (
            <div className="header-user">
              <div className="header-avatar">
                {isAdmin ? '⚙️' : user.email[0].toUpperCase()}
              </div>
              <div className="header-user-info">
                <span className="header-user-label">Zalogowano</span>
                <span className="header-user-email">{user.email}</span>
              </div>
              <button className="header-btn header-btn-secondary" onClick={onToggleProfile}>
                {showProfile ? '← Wróć' : '👤 Profil'}
              </button>
              {isAdmin && (
                <button className="header-btn header-btn-secondary" onClick={onToggleAdminPanel} style={{ background: showAdminPanel ? 'var(--primary)' : undefined }}>
                  {showAdminPanel ? '← Strona' : '⚙️ Panel Admina'}
                </button>
              )}
              <button className="header-btn header-btn-outline" onClick={onLogout}>
                Wyloguj
              </button>
            </div>
          ) : (
            <button className="header-btn header-btn-primary" onClick={onLogin}>
              Zaloguj się
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
