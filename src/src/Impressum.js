import React from 'react';
import { Link } from 'react-router-dom';

function Impressum() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f4f8',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '40px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <Link to="/" style={{
          color: '#4CAF50',
          textDecoration: 'none',
          fontSize: '16px',
          marginBottom: '20px',
          display: 'inline-block'
        }}>
          ← Zurück zur Startseite
        </Link>
        
        <h1 style={{ color: '#2c3e50', marginBottom: '30px' }}>Impressum</h1>
        
        <div style={{ lineHeight: '1.8', color: '#555' }}>
          <p>
            <strong>Sven Wehde</strong><br />
            Sonnensuche.com - die Wetterapp<br />
            Hudestraße 166<br />
            Gebäude 44<br />
            23569 Lübeck
          </p>
          
          <h2 style={{ color: '#2c3e50', marginTop: '30px' }}>Kontakt</h2>
          <p>
            Telefon: +49 451 70786848<br />
            E-Mail: wolf-thriller@gmx.de
          </p>
          
          <h2 style={{ color: '#2c3e50', marginTop: '30px' }}>Redaktionell verantwortlich</h2>
          <p>
            Sven Wehde<br />
            Hudestraße 166<br />
            23569 Lübeck
          </p>
          
          <h2 style={{ color: '#2c3e50', marginTop: '30px' }}>Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
          
          <p style={{ fontSize: '12px', marginTop: '40px', opacity: 0.7 }}>
            Quelle: <a href="https://www.e-recht24.de" target="_blank" rel="noopener noreferrer" 
                      style={{ color: '#4CAF50' }}>
              https://www.e-recht24.de
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Impressum;
