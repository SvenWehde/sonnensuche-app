import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Calendar, MapPin, Clock, ChevronRight, CloudRain, Snowflake } from 'lucide-react';

function Blog() {
  const articles = [
    {
      id: 'sonnigste-orte-deutschland-2024',
      title: 'Die 15 sonnigsten Orte Deutschlands 2024',
      excerpt: 'Entdecke die Städte mit den meisten Sonnenstunden in Deutschland. Von Freiburg bis zum Kaiserstuhl - hier scheint die Sonne am längsten!',
      date: '27. September 2024',
      readTime: '7 Min.',
      category: 'Top-Listen',
      icon: <Sun className="w-5 h-5 text-yellow-500" />
    },
    {
      id: 'oktober-wetter-beste-reiseziele',
      title: 'Oktober Wetter 2024: Die besten Reiseziele für goldene Herbsttage',
      excerpt: 'Wo ist es im Oktober noch warm? Wir zeigen dir die besten Ziele für Herbstferien mit Sonnengarantie - in Deutschland und Europa.',
      date: '27. September 2024',
      readTime: '8 Min.',
      category: 'Saisonal',
      icon: <CloudRain className="w-5 h-5 text-orange-500" />
    },
    {
      id: 'wochenendtrip-wetter-planen',
      title: 'Wochenendtrip perfekt planen: So findest du garantiert gutes Wetter',
      excerpt: 'Schluss mit verregneten Ausflügen! Mit diesen Tipps und Tools findest du immer das beste Wetter für deinen spontanen Wochenendtrip.',
      date: '26. September 2024',
      readTime: '6 Min.',
      category: 'Ratgeber',
      icon: <MapPin className="w-5 h-5 text-blue-500" />
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f4f8',
      paddingBottom: '40px'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '60px 20px',
        textAlign: 'center',
        color: 'white'
      }}>
        <Link to="/" style={{
          color: 'white',
          textDecoration: 'none',
          fontSize: '14px',
          opacity: 0.9,
          display: 'inline-block',
          marginBottom: '20px'
        }}>
          ← Zurück zur Wettersuche
        </Link>
        
        <h1 style={{
          fontSize: '42px',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}>
          Wetter-Ratgeber & Reisetipps
        </h1>
        <p style={{
          fontSize: '18px',
          opacity: 0.95,
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Entdecke die sonnigsten Orte, beste Reisezeiten und clevere Tipps für wettersichere Ausflüge
        </p>
      </div>

      {/* CTA Box */}
      <div style={{
        maxWidth: '1000px',
        margin: '-30px auto 40px',
        padding: '0 20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '20px',
            marginBottom: '15px',
            color: '#2c3e50'
          }}>
            🌤️ Finde jetzt die besten Wetter-Spots in deiner Nähe!
          </h2>
          <Link to="/" style={{
            display: 'inline-block',
            backgroundColor: '#667eea',
            color: 'white',
            padding: '12px 30px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            Zur Wettersuche →
          </Link>
        </div>
      </div>

      {/* Articles Grid */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '25px'
        }}>
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/blog/${article.id}`}
              style={{
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <article style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '25px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
              }}>
                {/* Category Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '15px'
                }}>
                  {article.icon}
                  <span style={{
                    fontSize: '12px',
                    color: '#667eea',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {article.category}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  marginBottom: '12px',
                  lineHeight: '1.4'
                }}>
                  {article.title}
                </h3>

                {/* Excerpt */}
                <p style={{
                  color: '#64748b',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  marginBottom: '20px',
                  flex: 1
                }}>
                  {article.excerpt}
                </p>

                {/* Meta Info */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '15px',
                  borderTop: '1px solid #f0f0f0',
                  fontSize: '13px',
                  color: '#94a3b8'
                }}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} />
                      {article.date}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={14} />
                      {article.readTime}
                    </span>
                  </div>
                  <ChevronRight size={18} style={{ color: '#667eea' }} />
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* More Articles Coming Soon */}
        <div style={{
          marginTop: '50px',
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{
            fontSize: '24px',
            marginBottom: '15px',
            color: '#2c3e50'
          }}>
            Weitere Artikel in Planung
          </h3>
          <p style={{
            color: '#64748b',
            fontSize: '16px',
            marginBottom: '25px'
          }}>
            Wir arbeiten an weiteren spannenden Themen für dich:
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center'
          }}>
            {[
              'Die wärmsten Winterziele',
              'Skigebiete mit Schneegarantie',
              'Regenwahrscheinlichkeit verstehen',
              'Beste Reisezeit Ostsee',
              'München Wetter-Guide',
              'Hamburg bei Regen'
            ].map(topic => (
              <span key={topic} style={{
                padding: '8px 16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '20px',
                fontSize: '14px',
                color: '#64748b'
              }}>
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Newsletter CTA */}
        <div style={{
          marginTop: '40px',
          padding: '35px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'white'
        }}>
          <h3 style={{
            fontSize: '24px',
            marginBottom: '15px'
          }}>
            Nie wieder schlechtes Wetter erwischen!
          </h3>
          <p style={{
            fontSize: '16px',
            marginBottom: '20px',
            opacity: 0.95
          }}>
            Nutze unsere kostenlose Wettersuche und finde immer die sonnigsten Orte in deiner Nähe.
          </p>
          <Link to="/" style={{
            display: 'inline-block',
            backgroundColor: 'white',
            color: '#667eea',
            padding: '12px 30px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            Jetzt Wetter checken
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '60px',
        padding: '30px 20px',
        textAlign: 'center',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          marginBottom: '20px'
        }}>
          <Link to="/" style={{
            color: '#64748b',
            textDecoration: 'none',
            fontSize: '14px'
          }}>
            Wettersuche
          </Link>
          <Link to="/impressum" style={{
            color: '#64748b',
            textDecoration: 'none',
            fontSize: '14px'
          }}>
            Impressum
          </Link>
          <Link to="/datenschutz" style={{
            color: '#64748b',
            textDecoration: 'none',
            fontSize: '14px'
          }}>
            Datenschutz
          </Link>
        </div>
        <p style={{
          color: '#94a3b8',
          fontSize: '13px'
        }}>
          © 2024 Sonnensuche. Dein Wegweiser zu besserem Wetter.
        </p>
      </div>
    </div>
  );
}

export default Blog;
