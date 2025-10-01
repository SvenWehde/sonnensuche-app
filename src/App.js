import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { MapPin, Sun, Thermometer, Calendar, Search, Loader2, Settings, Eye, EyeOff, Star, Navigation, Clock, Download, ChevronRight, Map, Home } from 'lucide-react';
import Impressum from './Impressum';
import Datenschutz from './Datenschutz';
import Blog from './Blog';
import BlogArticle1 from './BlogArticle1';
import BlogArticle2 from './BlogArticle2';
import BlogArticle3 from './BlogArticle3';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/sonnigste-orte-deutschland-2024" element={<BlogArticle1 />} />
        <Route path="/blog/oktober-wetter-beste-reiseziele" element={<BlogArticle2 />} />
        <Route path="/blog/wochenendtrip-wetter-planen" element={<BlogArticle3 />} />
      </Routes>
    </Router>
  );
}

const HomePage = () => {
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(50);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstruct, setShowIOSInstruct] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);

  // Standard API-Key
  const defaultApiKey = 'b0b755e584a3876179481c54767939f5';

  // PWA Installation + iOS Detection
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);
    
    if (iOS && !window.navigator.standalone) {
      setShowIOSInstruct(true);
      setShowInstallPrompt(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Service Worker Registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleIOSInstall = () => {
    setShowIOSInstruct(!showIOSInstruct);
  };

  // Geheimer Settings-Zugang über Logo-Klicks
  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    
    if (newCount >= 5) {
      setShowSettings(true);
      setLogoClickCount(0);
    }
    
    setTimeout(() => {
      if (newCount < 5) setLogoClickCount(0);
    }, 3000);
  };

  // Blacklist für kleine/unbekannte Orte
  const getBlacklistedTerms = () => [
    'Hals', 'Siedlung', 'Weiler', 'Hof', 'Berg', 'Wald', 'Tal', 'Dorf', 'Koog',
    'Klein', 'Groß', 'Ober', 'Unter', 'Nord', 'Süd', 'Ost', 'West', 'Neu', 'Alt',
    'Küstengewässer', 'Gewässer', 'Bucht', 'Moor', 'Heide', 'Forst', 'Marsch',
    'Schleswig-Holstein', 'Niedersachsen', 'Mecklenburg', 'Brandenburg', 'Bayern',
    'Gemeinde', 'Kreis', 'Landkreis', 'Bezirk', 'Amt', 'Verwaltung'
  ];

  // Bekannte deutsche Städte und Touristenorte
  const getAcceptableCities = () => [
    'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 
    'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover', 'Nürnberg',
    'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Mannheim',
    'Augsburg', 'Wiesbaden', 'Mönchengladbach', 'Gelsenkirchen', 'Aachen', 'Braunschweig',
    'Chemnitz', 'Kiel', 'Krefeld', 'Halle', 'Magdeburg', 'Freiburg', 'Oberhausen',
    'Lübeck', 'Erfurt', 'Rostock', 'Kassel', 'Hagen', 'Potsdam', 'Saarbrücken',
    'Mainz', 'Ludwigshafen', 'Oldenburg', 'Leverkusen', 'Osnabrück', 'Solingen',
    'Heidelberg', 'Herne', 'Neuss', 'Darmstadt', 'Regensburg', 'Ingolstadt',
    'Würzburg', 'Fürth', 'Wolfsburg', 'Offenbach', 'Ulm', 'Heilbronn', 'Pforzheim',
    'Göttingen', 'Bottrop', 'Trier', 'Recklinghausen', 'Reutlingen', 'Bremerhaven',
    'Bergisch Gladbach', 'Jena', 'Remscheid', 'Erlangen', 'Moers', 'Siegen', 'Hildesheim',
    'Salzgitter', 'Cottbus', 'Wismar', 'Stralsund', 'Greifswald', 'Schwerin', 'Neubrandenburg',
    'Reinfeld', 'Bad Segeberg', 'Bad Schwartau', 'Neustadt', 'Oldenburg in Holstein',
    'Plön', 'Eutin', 'Malente', 'Preetz', 'Itzehoe', 'Rendsburg', 'Neumünster',
    'Flensburg', 'Husum', 'Heide', 'Meldorf', 'Brunsbüttel', 'Glückstadt',
    'Timmendorfer Strand', 'Scharbeutz', 'Büsum', 'Sankt Peter-Ording',
    'Heiligendamm', 'Binz', 'Sellin', 'Warnemünde', 'Travemünde', 'Grömitz',
    'Dahme', 'Kellenhusen', 'Großenbrode', 'Burg auf Fehmarn', 'Fehmarn',
    'Sylt', 'Westerland', 'Kampen', 'List', 'Norderney', 'Borkum', 'Juist',
    'Glowe', 'Göhren', 'Baabe', 'Zingst', 'Prerow', 'Born', 'Dierhagen',
    'Kühlungsborn', 'Rerik', 'Boltenhagen', 'Usedom', 'Bansin', 'Heringsdorf',
    'Celle', 'Lüneburg', 'Stade', 'Cuxhaven', 'Wilhelmshaven', 'Emden',
    'Papenburg', 'Meppen', 'Lingen', 'Nordhorn', 'Vechta', 'Cloppenburg'
  ];

  const getFilteredCityName = (cityName, distance, centerLocation) => {
    if (!cityName || cityName.length < 3) {
      return centerLocation;
    }
    
    const blacklistedTerms = getBlacklistedTerms();
    const acceptableCities = getAcceptableCities();
    
    const isAcceptable = acceptableCities.some(city => 
      cityName.toLowerCase().includes(city.toLowerCase()) ||
      city.toLowerCase().includes(cityName.toLowerCase())
    );
    
    if (isAcceptable) {
      return cityName;
    }
    
    const isBlacklisted = blacklistedTerms.some(term => 
      cityName.toLowerCase().includes(term.toLowerCase())
    );
    
    return cityName;
  };

  // Geocoding
  const geocodeLocation = async (locationName, currentApiKey) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationName)}&limit=5&appid=${currentApiKey}`
      );
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('Ort nicht gefunden');
      }
      
      const sortedResults = data.sort((a, b) => {
        const knownCities = getAcceptableCities();
        const aIsKnown = knownCities.some(city => a.name.toLowerCase().includes(city.toLowerCase()));
        const bIsKnown = knownCities.some(city => b.name.toLowerCase().includes(city.toLowerCase()));
        
        if (aIsKnown && !bIsKnown) return -1;
        if (!aIsKnown && bIsKnown) return 1;
        
        if (a.population && b.population) {
          return b.population - a.population;
        }
        
        return 0;
      });
      
      const bestResult = sortedResults[0];
      return {
        lat: bestResult.lat,
        lon: bestResult.lon,
        name: bestResult.name,
        country: bestResult.country
      };
    } catch (error) {
      throw new Error(`Geocoding fehler: ${error.message}`);
    }
  };

  // Generiere Koordinaten im Umkreis
  const generateLocationGrid = (centerLat, centerLon, radiusKm, gridSize = 16) => {
    const points = [];
    
    for (let i = 0; i < gridSize; i++) {
      const angle = (i / gridSize) * 2 * Math.PI;
      
      [0.2, 0.4, 0.7, 1.0].forEach(distanceFactor => {
        const distance = radiusKm * distanceFactor;
        const lat = centerLat + (distance / 111) * Math.cos(angle);
        const lon = centerLon + (distance / (111 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
        
        points.push({
          lat: lat,
          lon: lon,
          distance: Math.round(distance)
        });
      });
    }
    
    return points;
  };

  // NEUE VERBESSERTE fetchWeatherData Funktion
  const fetchWeatherData = async (lat, lon, currentApiKey) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${currentApiKey}&units=metric&lang=de`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const startDateTime = new Date(startDate).getTime();
      const endDateTime = new Date(endDate).getTime() + (24 * 60 * 60 * 1000);
      const totalDays = Math.ceil((endDateTime - startDateTime) / (24 * 60 * 60 * 1000));
      
      // Sammle Daten für jeden Tag
      const dailyData = {};
      
      data.list.forEach(reading => {
        const readingTime = reading.dt * 1000;
        
        if (readingTime >= startDateTime && readingTime <= endDateTime) {
          const date = new Date(readingTime).toISOString().split('T')[0];
          
          if (!dailyData[date]) {
            dailyData[date] = {
              maxTemp: -100,
              temps: [],
              cloudiness: [],
              rainHours: 0,
              readings: 0
            };
          }
          
          dailyData[date].maxTemp = Math.max(dailyData[date].maxTemp, reading.main.temp);
          dailyData[date].temps.push(reading.main.temp);
          dailyData[date].cloudiness.push(reading.clouds.all);
          dailyData[date].readings++;
          
          if (reading.rain && reading.rain['3h'] > 0) {
            dailyData[date].rainHours += 3;
          }
        }
      });
      
      if (Object.keys(dailyData).length === 0) {
        throw new Error('Keine Wetterdaten für den gewählten Zeitraum verfügbar');
      }
      
      // Berechne Tageswerte
      let totalMaxTemp = 0;
      let totalSunHours = 0;
      let totalRainHours = 0;
      let totalAvgTemp = 0;
      
      Object.values(dailyData).forEach(day => {
        totalMaxTemp += day.maxTemp;
        
        const avgCloudiness = day.cloudiness.reduce((a, b) => a + b, 0) / day.cloudiness.length;
        const avgTemp = day.temps.reduce((a, b) => a + b, 0) / day.temps.length;
        totalAvgTemp += avgTemp;
        
        // Berechne Sonnenstunden für diesen Tag
        const maxPossibleSunHours = 12;
        const sunFactor = Math.max(0, (100 - avgCloudiness) / 100);
        let daySunHours = maxPossibleSunHours * sunFactor;
        
        if (day.rainHours > 0) {
          daySunHours = Math.max(0, daySunHours - (day.rainHours * 0.7));
        }
        
        totalSunHours += daySunHours;
        totalRainHours += day.rainHours;
      });
      
      const daysCount = Object.keys(dailyData).length;
      const avgMaxTemp = totalMaxTemp / daysCount;
      const avgSunHours = totalSunHours / daysCount;
      const avgRainHoursPerDay = totalRainHours / daysCount;
      const avgTemp = totalAvgTemp / daysCount;
      
      // Bestimme Vorhersage
      let forecast;
      if (searchType === 'sonnenschein') {
        if (avgRainHoursPerDay > 4) {
          forecast = 'Regnerisch';
        } else if (avgSunHours > 7) {
          forecast = 'Sonnig';
        } else if (avgSunHours > 4) {
          forecast = 'Bewölkt';
        } else {
          forecast = 'Bedeckt';
        }
      } else {
        if (avgTemp < 0) {
          forecast = 'Schnee';
        } else if (avgTemp < 5) {
          forecast = 'Frost';
        } else {
          forecast = 'Mild';
        }
      }
      
      // Berechne Weather Score mit stärkerer Gewichtung der Maximaltemperatur
      let weatherScore;
      if (searchType === 'sonnenschein') {
        // 60% Maximaltemperatur, 40% Sonnenstunden
        const tempScore = Math.max(0, Math.min(100, (avgMaxTemp / 30) * 100));
        const sunScore = Math.max(0, Math.min(100, (avgSunHours / 12) * 100));
        const rainPenalty = Math.min(30, avgRainHoursPerDay * 5);
        weatherScore = Math.round(Math.max(0, tempScore * 0.6 + sunScore * 0.4 - rainPenalty));
      } else {
        const tempScore = Math.max(0, Math.min(100, (10 - avgTemp) * 10));
        const snowScore = avgTemp < 2 ? 80 : 20;
        weatherScore = Math.round(tempScore * 0.7 + snowScore * 0.3);
      }
      
      return {
        avgTemp: Math.round(avgTemp * 10) / 10,
        maxTemp: Math.round(avgMaxTemp * 10) / 10,
        sunHours: Math.round(avgSunHours * 10) / 10,
        rainHours: Math.round(avgRainHoursPerDay * 10) / 10,
        weatherScore: weatherScore,
        cityName: data.city.name,
        totalDays: totalDays,
        forecast: forecast,
        isOneDay: totalDays === 1
      };
    } catch (error) {
      console.error('Wetter-API Fehler:', error);
      return null;
    }
  };
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setLocation('Mein aktueller Standort');
        },
        (error) => {
          setError('Standort-Zugriff verweigert oder nicht verfügbar');
        }
      );
    } else {
      setError('Geolocation wird von diesem Browser nicht unterstützt');
    }
  };

  const handleSearch = async () => {
    const currentApiKey = apiKey.trim() || defaultApiKey;
    
    if (!currentApiKey || currentApiKey === 'HIER_DEINEN_API_KEY_EINFÜGEN') {
      setError('API-Key fehlt! Bitte kontaktiere den Administrator.');
      return;
    }
    
    if (!location || !startDate || !endDate) {
      setError('Bitte alle Felder ausfüllen');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    
    const minLoadingTime = 4000;
    const searchStartTime = Date.now();
    
    try {
      let centerCoords;
      
      if (location === 'Mein aktueller Standort' && userLocation) {
        centerCoords = userLocation;
      } else {
        centerCoords = await geocodeLocation(location, currentApiKey);
      }
      
      const locationGrid = generateLocationGrid(centerCoords.lat, centerCoords.lon, radius);
      
      const weatherPromises = locationGrid.map(async (point, index) => {
        const weather = await fetchWeatherData(point.lat, point.lon, currentApiKey);
        if (weather) {
          const originalCityName = weather.cityName || `Gebiet ${index + 1}`;
          const filteredCityName = getFilteredCityName(originalCityName, point.distance, location);
          
          return {
            id: index,
            name: filteredCityName,
            lat: point.lat.toFixed(4),
            lon: point.lon.toFixed(4),
            temperature: weather.avgTemp,
            maxTemp: weather.maxTemp,
            sunHours: weather.sunHours,
            rainHours: weather.rainHours,
            weatherScore: weather.weatherScore,
            distance: point.distance,
            forecast: weather.forecast,
            totalDays: weather.totalDays,
            isOneDay: weather.isOneDay
          };
        }
        return null;
      });
      
      const weatherResults = await Promise.all(weatherPromises);
      const validResults = weatherResults.filter(result => result !== null);
      
      if (validResults.length === 0) {
        setError('Keine Wetterdaten gefunden. Bitte versuche es später nochmal.');
        const elapsedTime = Date.now() - searchStartTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        setTimeout(() => setLoading(false), remainingTime);
        return;
      }
      
     const sortedResults = validResults.sort((a, b) => {
  if (searchType === 'sonnenschein') {
    // Bei Sonnenschein-Suche: Einfach nach höchster Temperatur sortieren
    return b.maxTemp - a.maxTemp;
  } else {
    // Bei Schnee-Suche: Weiterhin nach weatherScore
    return b.weatherScore - a.weatherScore;
  }
});
      
      const elapsedTime = Date.now() - searchStartTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        setResults(sortedResults);
        setLoading(false);
      }, remainingTime);
      
    } catch (error) {
      setError(`Fehler beim Laden der Wetterdaten: ${error.message}`);
      const elapsedTime = Date.now() - searchStartTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      setTimeout(() => setLoading(false), remainingTime);
    }
  };

  const getWeatherIcon = (forecast) => {
    if (searchType === 'sonnenschein') {
      switch (forecast) {
        case 'Sonnig': return <Sun className="w-6 h-6 text-yellow-500 inline" />;
        case 'Bewölkt': return <Sun className="w-6 h-6 text-gray-400 inline" />;
        case 'Bedeckt': return <Sun className="w-6 h-6 text-gray-600 inline" />;
        case 'Regnerisch': return <Sun className="w-6 h-6 text-blue-500 inline" />;
        default: return <Sun className="w-6 h-6 text-yellow-400 inline" />;
      }
    } else {
      return '❄️';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
    if (score >= 60) return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
    return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
  };

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(tomorrow.toISOString().split('T')[0]);
    
    const savedApiKey = localStorage.getItem('openweather-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openweather-api-key', apiKey.trim());
      setShowSettings(false);
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
      {/* Fixed Footer Ad */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-2 text-center text-xs z-50">
        <span className="text-gray-500">Anzeige</span>
        <div className="bg-gray-100 h-12 flex items-center justify-center text-gray-400 rounded mt-1">
          [Google AdSense]
        </div>
        <button 
          className="absolute top-1 right-1 text-gray-400 hover:text-gray-600" 
          onClick={(e) => e.currentTarget.parentElement.style.display = 'none'}
        >
          ×
        </button>
      </div>
      
      <div className="max-w-6xl mx-auto p-4 pb-20">
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div 
              className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg cursor-pointer"
              onClick={handleLogoClick}
              title={logoClickCount > 0 ? `${logoClickCount}/5 für Admin-Zugang` : 'Sonnensuche'}
            >
              <Sun className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight">
              Sonnensuche
            </h1>
          </div>
          <p className="text-white/90 text-lg md:text-xl font-light">
            Die erste App, die nach den Orten mit dem besten Wetter sucht
          </p>
          <p className="text-white/80 text-base md:text-lg mt-1">
            Für alle spontanen Urlauber und Ausflügler
          </p>
        </div>

        {/* Blog-Button */}
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <Link to="/blog" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            border: '2px solid rgba(255,255,255,0.3)',
            fontSize: '17px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
          }}>
            <span style={{ fontSize: '22px' }}>📚</span>
            <span>Wetter-Ratgeber & Reisetipps</span>
          </Link>
        </div>

        {/* Admin Settings */}
        {showSettings && (
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin-Einstellungen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API-Key überschreiben (optional):
                </label>
                <div className="flex gap-2">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Neuer OpenWeatherMap API-Key"
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    onClick={saveApiKey}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50/95 backdrop-blur-lg border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
            <strong>Fehler:</strong> {error}
          </div>
        )}

        {/* Search Card */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Was suchst du?
          </h2>

          {/* Search Type Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => {
                setSearchType('sonnenschein');
                setTimeout(() => {
                  const element = document.getElementById('location-input');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);
              }}
              className={`p-6 rounded-xl border-2 transition-all ${
                searchType === 'sonnenschein'
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white border-transparent shadow-lg scale-105' 
                  : 'bg-white border-gray-200 hover:border-yellow-300 hover:shadow-md'
              }`}
            >
              <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <h3 className="text-lg font-semibold mb-1">Sonnenschein</h3>
              <p className="text-sm opacity-80">Warme Temperaturen & viel Sonne</p>
            </button>
            
            <button
              onClick={() => {
                setSearchType('schnee');
                setTimeout(() => {
                  const element = document.getElementById('location-input');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);
              }}
              className={`p-6 rounded-xl border-2 transition-all ${
                searchType === 'schnee'
                  ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white border-transparent shadow-lg scale-105' 
                  : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="w-8 h-8 mx-auto mb-2 text-2xl">❄️</div>
              <h3 className="text-lg font-semibold mb-1">Schnee & Winter</h3>
              <p className="text-sm opacity-80">Kalte Temperaturen & Schneechancen</p>
            </button>
          </div>
         
          {/* Search Form */}
          <div className="space-y-6">
            <div id="location-input">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Von wo startest du?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="z.B. Berlin, München"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  onClick={getCurrentLocation}
                  className="px-4 py-3 bg-gray-50 hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-300 rounded-xl transition-all"
                  title="Aktuellen Standort verwenden"
                >
                  <Navigation size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suchradius - Wie weit bist du bereit zu fahren? ({radius} km)
              </label>
              <input
                type="range"
                min="10"
                max="500"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(radius - 10) / 4.9}%, #e5e7eb ${(radius - 10) / 4.9}%, #e5e7eb 100%)`
                }}
              />
              <div className="text-center text-sm text-gray-600 mt-2">
                {radius < 50 ? 'Kurze Fahrt' : radius < 150 ? 'Mittlere Distanz' : 'Weite Reise'} - {radius} km
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wann möchtest du los?
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bis wann?
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {loading && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg text-center">
              <span className="text-xs text-purple-600">Gesponsert - Analysiere Wetterdaten für beste Ergebnisse</span>
              <div className="bg-purple-100 h-20 flex items-center justify-center text-purple-400 rounded mt-2">
                [Google AdSense]
              </div>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={loading || !searchType}
            className="w-full mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-xl disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>Suche die besten Orte für dich...</span>
              </>
            ) : (
              <>
                <Search size={24} />
                <span>Beste Orte finden</span>
              </>
            )}
          </button>
        </div>

        {/* PWA Install Prompt */}
        {(showInstallPrompt || isIOS) && results.length === 0 && (
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8 border-l-4 border-purple-500">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-4 shadow-lg">
                  <Download className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Sonnensuche-App installieren</h3>
              <p className="text-gray-600 mb-6">Installiere die App auf deinem Handy für schnelleren Zugriff!</p>
              
              <button
                onClick={isIOS ? handleIOSInstall : handleInstallClick}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                {isIOS ? 'Installationsanleitung anzeigen' : 'App installieren'}
              </button>
              
              <p className="text-sm text-gray-500 mt-4">
                Kostenlos • Ohne App Store • Funktioniert offline
              </p>
            </div>

            {/* iOS Instructions */}
            {isIOS && showIOSInstruct && (
              <div className="mt-6 p-6 bg-purple-50 rounded-xl">
                <h4 className="font-bold text-purple-800 mb-4 text-center">So installierst du die App auf dem iPhone:</h4>
                <div className="space-y-3 text-sm text-purple-700">
                  <div className="flex items-start gap-3">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    <p>Tippe auf das Teilen-Symbol unten in Safari</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    <p>Wähle "Zum Home-Bildschirm hinzufügen"</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    <p>Tippe auf "Hinzufügen" - fertig!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results - HIER IST DIE WICHTIGE ÄNDERUNG */}
        {results.length > 0 && (
          <div>
            <h2 className="text-3xl font-light text-white text-center mb-8">
              Deine Top Ergebnisse
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.slice(0, 12).map((spot, index) => (
                <React.Fragment key={spot.id}>
                  <div className={`bg-white/95 backdrop-blur-lg rounded-2xl p-6 transition-all hover:shadow-2xl hover:scale-[1.02] ${
                    index === 0 ? 'ring-2 ring-yellow-400 ring-offset-4 ring-offset-transparent' : ''
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`text-3xl font-bold ${index === 0 ? 'text-yellow-500' : 'text-purple-600'}`}>
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            {spot.name}
                            {getWeatherIcon(spot.forecast)}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin size={14} />
                            {spot.distance} km entfernt
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(spot.weatherScore)}`}>
                        {spot.weatherScore}%
                      </div>
                    </div>

                    {/* HIER IST DIE NEUE ANZEIGE */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <Thermometer className="text-red-500" size={20} />
                        <div>
                          <div className="font-semibold">
                            {spot.maxTemp}°C
                          </div>
                          <div className="text-xs text-gray-600">
                            {spot.isOneDay ? 'Max. Temperatur' : 'Ø Max-Temp'}
                          </div>
                        </div>
                      </div>
                      {searchType === 'sonnenschein' ? (
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          <Sun className="text-yellow-500" size={20} />
                          <div>
                            <div className="font-semibold">
                              {spot.sunHours}h
                            </div>
                            <div className="text-xs text-gray-600">
                              {spot.isOneDay ? 'Sonnenstunden' : 'Ø Sonne/Tag'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          <div className="text-2xl">❄️</div>
                          <div>
                            <div className="font-semibold">{spot.forecast}</div>
                            <div className="text-xs text-gray-600">Wetter</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-sm bg-gray-50 rounded-xl p-3 mb-4">
                      <strong>Vorhersage:</strong> {spot.forecast}
                      {searchType === 'sonnenschein' && spot.rainHours > 0 && (
                        <span className="text-blue-600 ml-2">({spot.rainHours}h Regen{spot.totalDays > 1 ? '/Tag' : ''})</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          const bookingUrl = `https://www.booking.com/searchresults.html?aid=12345678&label=sonnensuche&dest_type=city&ss=${encodeURIComponent(spot.name)}&checkin=${startDate}&checkout=${endDate}&adults=2&currency=EUR`;
                          window.open(bookingUrl, '_blank');
                        }}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Home size={18} />
                        Unterkunft finden
                      </button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(spot.name)}/@${spot.lat},${spot.lon},12z`, '_blank')}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm border-2 border-gray-200"
                        >
                          <Map size={16} />
                          Route planen
                        </button>
                        <button
                          onClick={() => window.open(`https://de.hotels.com/search.do?destination=${encodeURIComponent(spot.name)}&startDate=${startDate}&endDate=${endDate}`, '_blank')}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm border-2 border-gray-200"
                        >
                          <Home size={16} />
                          Hotels
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Werbung nach bestimmten Indizes */}
                  {index === 1 && (
                    <div className="md:col-span-2 my-4 p-6 bg-white/90 backdrop-blur-lg rounded-xl text-center">
                      <span className="text-xs text-gray-500">Gesponserte Angebote</span>
                      <div className="bg-gray-100 h-24 flex items-center justify-center text-gray-400 rounded mt-2">
                        [Google AdSense Banner]
                      </div>
                    </div>
                  )}

                  {(index === 4 || index === 7) && (
                    <div className="md:col-span-2 my-4 p-6 bg-white/90 backdrop-blur-lg rounded-xl text-center">
                      <span className="text-xs text-gray-500">Werbung</span>
                      <div className="bg-gray-100 h-32 flex items-center justify-center text-gray-400 rounded mt-2">
                        [Google AdSense]
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Info Boxes */}
            <div className="mt-12 bg-white/95 backdrop-blur-lg rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Echte Live-Wetterdaten</h3>
              <p className="text-gray-600">
                Diese Ergebnisse basieren auf aktuellen 5-Tage-Wettervorhersagen von OpenWeatherMap
                und helfen dir dabei, spontane Ausflüge und Kurzurlaube perfekt zu planen!
              </p>
            </div>

            {/* PWA Install nach Ergebnissen */}
            {(showInstallPrompt || isIOS) && (
              <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-center text-white">
                <h3 className="text-2xl font-bold mb-4">Perfekte Ergebnisse gefunden!</h3>
                <p className="mb-6">Installiere die App für noch schnellere Wettersuchen</p>
                <button
                  onClick={isIOS ? handleIOSInstall : handleInstallClick}
                  className="bg-white text-purple-600 font-semibold py-3 px-8 rounded-xl hover:shadow-lg transition-all"
                >
                  App installieren
                </button>
              </div>
            )}
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-12 bg-white/95 backdrop-blur-lg rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Häufige Fragen
          </h2>
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Wie funktioniert die Sonnensuche?</h3>
              <p className="text-gray-600 text-sm">
                Sonnensuche durchsucht einen von dir gewählten Umkreis nach den Orten mit dem besten Wetter. 
                Du gibst deinen Startort und gewünschten Zeitraum ein, und wir zeigen dir die sonnigsten Orte in deiner Nähe.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Ist Sonnensuche kostenlos?</h3>
              <p className="text-gray-600 text-sm">
                Ja, Sonnensuche ist komplett kostenlos! Du brauchst keine Anmeldung und kannst sofort loslegen.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Wie genau sind die Wettervorhersagen?</h3>
              <p className="text-gray-600 text-sm">
                Wir nutzen professionelle Wetterdaten von OpenWeatherMap mit 5-Tage Vorhersagen. 
                Die Daten werden alle 3 Stunden aktualisiert und sind sehr zuverlässig für die Planung von Ausflügen.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Kann ich die App installieren?</h3>
              <p className="text-gray-600 text-sm">
                Ja! Sonnensuche ist eine Progressive Web App (PWA). Du kannst sie direkt über deinen Browser installieren.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer mit Impressum und Datenschutz Links */}
      <footer style={{
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '30px 20px',
        textAlign: 'center',
        marginTop: '80px',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            flexWrap: 'wrap',
            marginBottom: '20px'
          }}>
            <Link to="/impressum" style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '14px',
              opacity: 0.9
            }}>
              Impressum
            </Link>
            <Link to="/datenschutz" style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '14px',
              opacity: 0.9
            }}>
              Datenschutzerklärung
            </Link>
          </div>
          <p style={{ 
            fontSize: '13px', 
            opacity: 0.7,
            marginTop: '15px'
          }}>
            © 2024 Sonnensuche. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
