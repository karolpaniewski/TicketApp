export default function Footer() {
  const popularneKategorie = [
    { nazwa: 'Muzyka', ikona: '🎵' },
    { nazwa: 'Teatr', ikona: '🎭' },
    { nazwa: 'Stand-up', ikona: '🎤' },
    { nazwa: 'Sport', ikona: '🏟️' },
    { nazwa: 'Festiwal', ikona: '🎪' }
  ];

  const popularneMiasta = ['Warszawa', 'Kraków', 'Wrocław', 'Gdańsk', 'Poznań', 'Łódź'];

  const linki = [
    { label: 'O nas', href: '#' },
    { label: 'Kontakt', href: '#' },
    { label: 'FAQ', href: '#' },
    { label: 'Regulamin', href: '#' },
    { label: 'Polityka prywatności', href: '#' }
  ];

  const socialMedia = [
    { nazwa: 'Facebook', ikona: '📘', href: '#' },
    { nazwa: 'Twitter', ikona: '🐦', href: '#' },
    { nazwa: 'Instagram', ikona: '📷', href: '#' }
  ];

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* O nas + Logo */}
          <div className="footer-col footer-brand">
            <div className="footer-logo">
              <span className="footer-logo-icon">🎫</span>
              <span>BiletyGo</span>
            </div>
            <p className="footer-desc">
              Kupuj bilety na koncerty, spektakle i wydarzenia sportowe. Bezpiecznie, szybko i wygodnie.
            </p>
          </div>

          {/* Popularne kategorie */}
          <div className="footer-col">
            <h4 className="footer-title">Popularne kategorie</h4>
            <ul className="footer-links">
              {popularneKategorie.map((k, i) => (
                <li key={i}><a href="#">{k.ikona} {k.nazwa}</a></li>
              ))}
            </ul>
          </div>

          {/* Popularne miasta */}
          <div className="footer-col">
            <h4 className="footer-title">Wydarzenia w miastach</h4>
            <ul className="footer-links">
              {popularneMiasta.map((m, i) => (
                <li key={i}><a href="#">{m}</a></li>
              ))}
            </ul>
          </div>

          {/* Linki */}
          <div className="footer-col">
            <h4 className="footer-title">Informacje</h4>
            <ul className="footer-links">
              {linki.map((l, i) => (
                <li key={i}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="footer-col footer-newsletter">
            <h4 className="footer-title">Newsletter</h4>
            <p>Bądź na bieżąco z promocjami i nowymi wydarzeniami.</p>
            <form className="footer-newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Twój adres e-mail" className="footer-input" />
              <button type="submit" className="footer-btn">Zapisz się</button>
            </form>
          </div>
        </div>

        {/* Social + Copyright */}
        <div className="footer-bottom">
          <div className="footer-social">
            {socialMedia.map((s, i) => (
              <a key={i} href={s.href} className="footer-social-link" title={s.nazwa}>
                {s.ikona}
              </a>
            ))}
          </div>
          <p className="footer-copyright">
            © {new Date().getFullYear()} BiletyGo. Wszelkie prawa zastrzeżone.
          </p>
        </div>
      </div>
    </footer>
  );
}
