import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Download, QrCode } from 'lucide-react';
import { generateStickersPDF, StickerConfig } from './utils/pdfGenerator';
import QRCode from 'qrcode';

function App() {
  const [config, setConfig] = useState<StickerConfig>({
    headerText: 'Własność Hufca Trzebinia',
    themeColor: '#006600', // ZHP_GREEN approximate
    totalStickers: 12,
    startId: 1,
    baseUrl: 'https://forms.office.com/Pages/ResponsePage.aspx?id=Ho024XU55kyJPfw1H9RNzSxpBz6AyaJNo0NTIfN0GNBUNVgzOVBTVE1ZUFdDMlFHTjMxOEJJRFY2WS4u&r6e9f3bdf980d4a21b510d0a9e2af8516='
  });

  const [baseUrlLocked, setBaseUrlLocked] = useState(true);
  const [showUnlockWarning, setShowUnlockWarning] = useState(false);
  const [previewQr, setPreviewQr] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Generate QR code for preview
    const generatePreview = async () => {
      try {
        const url = await QRCode.toDataURL(`${config.baseUrl}${config.startId}`, {
          errorCorrectionLevel: 'M',
          margin: 0
        });
        setPreviewQr(url);
      } catch (err) {
        console.error(err);
      }
    };
    generatePreview();
  }, [config.baseUrl, config.startId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;
    
    if (type === 'number') {
      parsedValue = parseInt(value, 10);
      if (isNaN(parsedValue)) parsedValue = 0;
    }
    
    setConfig(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleToggleLock = () => {
    if (baseUrlLocked) {
      setShowUnlockWarning(true);
    } else {
      setBaseUrlLocked(true);
      setShowUnlockWarning(false);
    }
  };

  const handleConfirmUnlock = () => {
    setBaseUrlLocked(false);
    setShowUnlockWarning(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateStickersPDF(config);
    } catch (err) {
      console.error(err);
      alert('Wystąpił błąd podczas generowania pliku PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Generator Naklejek QR</h1>
        <p>Hufiec Trzebinia - System Inwentaryzacji</p>
      </header>

      <div className="main-layout">
        {/* Left Column: Configuration Form */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2>Konfiguracja</h2>
          <div style={{ marginTop: '1.5rem' }}>
            
            <div className="form-group">
              <label htmlFor="headerText">Nagłówek naklejki</label>
              <input
                type="text"
                id="headerText"
                name="headerText"
                className="form-control"
                value={config.headerText}
                onChange={handleInputChange}
                placeholder="Np. Własność Hufca Trzebinia"
              />
            </div>

            <div className="form-group">
              <label htmlFor="themeColor">Kolor przewodni (Ramka i tekst)</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  id="themeColor"
                  name="themeColor"
                  value={config.themeColor}
                  onChange={handleInputChange}
                />
                <span>{config.themeColor.toUpperCase()}</span>
              </div>
            </div>

            <div className="row">
              <div className="form-group">
                <label htmlFor="startId">Początkowy ID</label>
                <input
                  type="number"
                  id="startId"
                  name="startId"
                  className="form-control"
                  value={config.startId}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="totalStickers">Liczba naklejek</label>
                <input
                  type="number"
                  id="totalStickers"
                  name="totalStickers"
                  className="form-control"
                  value={config.totalStickers}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="baseUrl">Podstawowy adres URL (Base URL)</label>
              <div className="locked-field-wrapper">
                <input
                  type="text"
                  id="baseUrl"
                  name="baseUrl"
                  className="form-control"
                  value={config.baseUrl}
                  onChange={handleInputChange}
                  disabled={baseUrlLocked}
                />
                <button 
                  type="button" 
                  className="locked-btn" 
                  onClick={handleToggleLock}
                  title={baseUrlLocked ? "Odblokuj edycję URL" : "Zablokuj edycję URL"}
                >
                  {baseUrlLocked ? <Lock size={20} /> : <Unlock size={20} />}
                </button>
              </div>
              
              {showUnlockWarning && (
                <div className="warning-msg">
                  <div style={{ flex: 1 }}>
                    <strong>Ostrzeżenie:</strong> Zmiana tego adresu może spowodować, że zeskanowane kody QR nie będą działać. Kontynuuj tylko, jeśli masz pewność.
                  </div>
                  <button 
                    onClick={handleConfirmUnlock}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Rozumiem
                  </button>
                </div>
              )}
            </div>

            <button 
              className="primary-btn" 
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <Download size={20} />
              {isGenerating ? 'Generowanie...' : 'Pobierz Plik PDF (A4)'}
            </button>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="glass-panel preview-box">
          <h2>Podgląd naklejki</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Wymiary rzeczywiste: ~63x66 mm na formacie A4
          </p>
          
          <div className="sticker-preview">
            <div className="sticker-inner-border" style={{ borderColor: config.themeColor }}></div>
            <div className="sticker-title" style={{ color: config.themeColor }}>
              {config.headerText}
            </div>
            
            <div className="sticker-qr">
              {previewQr ? (
                <img src={previewQr} alt="QR Preview" />
              ) : (
                <QrCode size={48} color="#ccc" />
              )}
            </div>
            
            <div className="sticker-id-label" style={{ color: config.themeColor }}>
              Identyfikator przedmiotu:
            </div>
            <div className="sticker-id" style={{ color: config.themeColor }}>
              {config.startId}
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        Aplikacja generuje gotowy do druku plik PDF (format A4) z naklejkami. 
        Każda strona pomieści 12 naklejek.
      </footer>
    </div>
  );
}

export default App;
