import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const DEFAULT_BG = 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200';
const PRESET_COLORS = ['#fbcfe8', '#dbeafe', '#dcfce7', '#fef3c7', '#e0e7ff', '#fce7f3', '#ccfbf1', '#fef9c3'];

export default function TicketEditor({ ticketBg, ticketColor, artysta, onChange, placeholderArtysta }) {
  const bg = ticketBg?.trim() || DEFAULT_BG;
  const color = ticketColor || '#fbcfe8';
  const displayArtysta = artysta?.trim() || placeholderArtysta || 'Nazwa Artysty / Wydarzenia';

  return (
    <div className="ticket-editor">
      <h3 className="ticket-editor-title">🎨 Wizualny edytor biletu</h3>
      <p className="ticket-editor-desc">Podgląd na żywo – zmiany zapisują się przy publikacji wydarzenia.</p>

      <div className="ticket-editor-layout">
        <div className="ticket-editor-controls">
          <div className="ticket-editor-field">
            <label>URL zdjęcia tła</label>
            <input
              type="url"
              placeholder="https://..."
              value={ticketBg || ''}
              onChange={e => onChange({ ticketBg: e.target.value })}
            />
          </div>
          <div className="ticket-editor-field">
            <label>Kolor biletu</label>
            <div className="ticket-editor-color-row">
              <input
                type="color"
                value={color}
                onChange={e => onChange({ ticketColor: e.target.value })}
                className="ticket-editor-color-input"
              />
              <input
                type="text"
                value={color}
                onChange={e => onChange({ ticketColor: e.target.value })}
                className="ticket-editor-color-hex"
              />
            </div>
          </div>
          <div className="ticket-editor-presets">
            <span>Presety:</span>
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                className={`ticket-editor-preset ${color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => onChange({ ticketColor: c })}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="ticket-editor-preview">
          <span className="ticket-editor-preview-label">Podgląd</span>
          <div className="passport-ticket ticket-editor-preview-ticket" style={{ backgroundColor: color }}>
            <div className="pt-bg" style={{ backgroundImage: `url(${bg})` }} />
            <div className="pt-content">
              <div className="pt-info">
                <div>
                  <div className="pt-header-text">OFFICIAL E-TICKET PASSPORT</div>
                  <h3 className="pt-artysta-preview">{displayArtysta}</h3>
                </div>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div>
                    <span className="pt-label">TWOJE MIEJSCA</span>
                    <div className="pt-value">12, 13</div>
                  </div>
                  <div>
                    <span className="pt-label">ZAKUPIONO</span>
                    <div className="pt-value">—</div>
                  </div>
                </div>
              </div>
              <div className="pt-right">
                <div className="pt-qr-box">
                  <QRCodeSVG value="TICKET-PREVIEW" size={70} />
                </div>
                <div className="pt-value" style={{ marginTop: 12 }}>150 PLN</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
