import React, { useState, useEffect } from 'react';
import { MapPin, Sun, Thermometer, Calendar, Search, Loader2, Settings, Eye, EyeOff, Star, Navigation, Clock, Download } from 'lucide-react';

const SonnensucheApp = () => {
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
  const [searchType, setSearchType] = useState('sonnenschein');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstruct, setShowIOSInstruct] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);

  // Standard API-Key (kann über geheime Settings überschrieben werden)
  const defaultApiKey = 'b0b755e584a3876179481c54767939f5'; // TODO: Ersetze mit deinem echten API-Key

  // PWA Installation + iOS Detection
  useEffect(() => {
    // iOS Detection - verbesserte Erkennung
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);
    
    // Show iOS install instructions if not already installed
    if (iOS && !window.navigator.standalone) {
      setShowIOSInstruct(true);
      setShowInstallPrompt(true); // Force show button on iOS
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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
    console.log('iOS Install clicked', { isIOS, showIOSInstruct });
  };

  // Geheimer Settings-Zugang über Logo-Klicks
  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    
    if (newCount >= 5) {
      setShowSettings(true);
      setLogoClickCount(0); // Reset
      console.log('Secret admin access activated! 🔓');
    }
    
    // Reset nach 3 Sekunden
    setTimeout(() => {
      if (newCount < 5) setLogoClickCount(0);
    }, 3000);
  };

  // Geocoding: Ortsname zu Koordinaten - Verbessert für größere Städte
  const geocodeLocation = async (locationName, currentApiKey) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationName)}&limit=5&appid=${currentApiKey}`
      );
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('Ort nicht gefunden');
      }
      
      // Priorisiere größere Städte und bekannte Orte
      const sortedResults = data.sort((a, b) => {
        // Bekannte Städte bevorzugen
        const knownCities = [
          'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 
          'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover', 'Nürnberg',
          'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Mannheim',
          'Augsburg', 'Wiesbaden', 'Mönchengladbach', 'Gelsenkirchen', 'Aachen', 'Braunschweig',
          'Chemnitz', 'Kiel', 'Krefeld', 'Halle', 'Magdeburg', 'Freiburg', 'Oberhausen',
          'Lübeck', 'Erfurt', 'Rostock', 'Kassel', 'Hagen', 'Potsdam', 'Saarbrücken'
        ];
        
        const aIsKnown = knownCities.some(city => a.name.toLowerCase().includes(city.toLowerCase()));
        const bIsKnown = knownCities.some(city => b.name.toLowerCase().includes(city.toLowerCase()));
        
        if (aIsKnown && !bIsKnown) return -1;
        if (!aIsKnown && bIsKnown) return 1;
        
        // Bei gleicher "Bekanntheit" nach Population sortieren (falls vorhanden)
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

  // Generiere Koordinaten im Umkreis - Verbessert für größere Städte
  const generateLocationGrid = (centerLat, centerLon, radiusKm, gridSize = 16) => {
    const points = [];
    
    // Strategischere Verteilung der Suchpunkte
    for (let i = 0; i < gridSize; i++) {
      const angle = (i / gridSize) * 2 * Math.PI;
      
      // Verschiedene Entfernungen testen - mehr Fokus auf mittlere Distanzen
      [0.2, 0.4, 0.7, 1.0].forEach(distanceFactor => {
        const distance = radiusKm * distanceFactor;
        
        // Koordinaten berechnen
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

  // Wetterdaten von OpenWeatherMap abrufen - Verbesserte Logik
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
      
      let totalTemp = 0;
      let maxTemp = -100;
      let totalCloudiness = 0;
      let totalRainHours = 0;
      let validReadings = 0;
      
      data.list.forEach(reading => {
        const readingTime = reading.dt * 1000;
        
        if (readingTime >= startDateTime && readingTime <= endDateTime) {
          validReadings++;
          totalTemp += reading.main.temp;
          maxTemp = Math.max(maxTemp, reading.main.temp);
          
          // Bewölkung sammeln
          totalCloudiness += reading.clouds.all;
          
          // Regen sammeln (realistisch)
          if (reading.rain && reading.rain['3h'] > 0) {
            totalRainHours += 3; // 3h pro Reading mit Regen
          }
        }
      });
      
      if (validReadings === 0) {
        throw new Error('Keine Wetterdaten für den gewählten Zeitraum verfügbar');
      }
      
      const avgTemp = totalTemp / validReadings;
      const avgCloudiness = totalCloudiness / validReadings;
      const avgRainHoursPerDay = totalRainHours / totalDays;
      
      // Realistische Sonnenstunden-Berechnung
      const maxPossibleSunHours = 12; // Maximum pro Tag
      const sunFactor = Math.max(0, (100 - avgCloudiness) / 100);
      let avgSunHoursPerDay = maxPossibleSunHours * sunFactor;
      
      // Reduziere Sonnenstunden wenn es regnet
      if (avgRainHoursPerDay > 0) {
        avgSunHoursPerDay = Math.max(0, avgSunHoursPerDay - (avgRainHoursPerDay * 0.7));
      }
      
      // Stelle sicher, dass Sonne + Regen nicht über 24h gehen
      const totalWeatherHours = avgSunHoursPerDay + avgRainHoursPerDay;
      if (totalWeatherHours > 18) { // Max 18h "aktives" Wetter (6h neutral)
        const factor = 18 / totalWeatherHours;
        avgSunHoursPerDay *= factor;
        avgRainHoursPerDay *= factor;
      }
      
      // Konsistente Vorhersage basierend auf realen Werten
      let forecast;
      if (searchType === 'sonnenschein') {
        if (avgRainHoursPerDay > 4) {
          forecast = 'Regnerisch';
        } else if (avgSunHoursPerDay > 7) {
          forecast = 'Sonnig';
        } else if (avgSunHoursPerDay > 4) {
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
      
      // Weather Score Berechnung
      let weatherScore;
      if (searchType === 'sonnenschein') {
        const tempScore = Math.max(0, Math.min(100, (avgTemp + 10) * 2.5));
        const sunScore = Math.max(0, Math.min(100, (avgSunHoursPerDay / 12) * 100));
        const rainPenalty = Math.min(30, avgRainHoursPerDay * 5); // Max -30 für Regen
        weatherScore = Math.round(Math.max(0, tempScore * 0.6 + sunScore * 0.4 - rainPenalty));
      } else {
        const tempScore = Math.max(0, Math.min(100, (10 - avgTemp) * 10));
        const snowScore = avgTemp < 2 ? 80 : 20;
        weatherScore = Math.round(tempScore * 0.7 + snowScore * 0.3);
      }
      
      return {
        avgTemp: Math.round(avgTemp * 10) / 10,
        maxTemp: Math.round(maxTemp * 10) / 10,
        sunHours: Math.round(avgSunHoursPerDay * 10) / 10,
        rainHours: Math.round(avgRainHoursPerDay * 10) / 10,
        weatherScore: weatherScore,
        cityName: data.city.name,
        totalDays: totalDays,
        forecast: forecast
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

  // Bekannte Touristenorte (auch unter 2.500 EW akzeptabel)
  const touristDestinations = [
    'Timmendorfer Strand', 'Scharbeutz', 'Büsum', 'Sankt Peter-Ording',
    'Heiligendamm', 'Binz', 'Sellin', 'Warnemünde', 'Travemünde',
    'Sylt', 'Norderney', 'Borkum', 'Fehmarn', 'Rügen', 'Usedom',
    'Grömitz', 'Dahme', 'Kellenhusen', 'Großenbrode', 'Burg auf Fehmarn',
    'Glowe', 'Göhren', 'Baabe', 'Zingst', 'Prerow', 'Born', 'Dierhagen',
    'Kühlungsborn', 'Rerik', 'Boltenhagen', 'Wismar', 'Stralsund'
  ];

  // Intelligente Ortsnamen-Suche
  const findBestCityName = async (lat, lon, currentApiKey) => {
    try {
      // Reverse Geocoding für nahegelegene Orte
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=10&appid=${currentApiKey}`
      );
      const cities = await response.json();
      
      if (cities.length === 0) {
        return null;
      }
      
      // Nach Distanz sortieren (nächste zuerst)
      const citiesWithDistance = cities.map(city => ({
        ...city,
        distance: calculateDistance(lat, lon, city.lat, city.lon)
      })).sort((a, b) => a.distance - b.distance);
      
      // Suche nach akzeptabler Stadt
      for (let city of citiesWithDistance) {
        const cityName = city.name;
        const distance = city.distance;
        
        // Sehr nah (≤10km) und bekannte Stadt → direkt verwenden
        if (distance <= 10) {
          // Ist es ein Touristenort? Dann immer OK
          if (touristDestinations.some(dest => 
            cityName.toLowerCase().includes(dest.toLowerCase()) || 
            dest.toLowerCase().includes(cityName.toLowerCase())
          )) {
            return { name: cityName, distance };
          }
          
          // Oder hat genug Einwohner? (falls API population liefert)
          if (city.population && city.population >= 2500) {
            return { name: cityName, distance };
          }
          
          // Oder ist es eine bekannte deutsche Stadt?
          const knownCities = [
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
            'Salzgitter', 'Cottbus', 'Wismar', 'Stralsund', 'Greifswald', 'Schwerin', 'Neubrandenburg'
          ];
          
          if (knownCities.some(knownCity => 
            cityName.toLowerCase().includes(knownCity.toLowerCase()) ||
            knownCity.toLowerCase().includes(cityName.toLowerCase())
          )) {
            return { name: cityName, distance };
          }
        }
      }
      
      // Fallback: Nächste Stadt nehmen (auch wenn weiter weg)
      return { 
        name: citiesWithDistance[0].name, 
        distance: citiesWithDistance[0].distance 
      };
      
    } catch (error) {
      console.error('City name lookup failed:', error);
      return null;
    }
  };

  // Distanz zwischen zwei Koordinaten berechnen (Haversine-Formel)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Erdradius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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
          // Intelligente Ortsnamen-Suche
          const cityResult = await findBestCityName(point.lat, point.lon, currentApiKey);
          
          let displayName;
          if (cityResult) {
            if (cityResult.distance <= 10) {
              // Sehr nah → direkter Stadtname
              displayName = cityResult.name;
            } else if (cityResult.distance <= 25) {
              // Mittlere Entfernung → "Region um X"
              displayName = `Region ${cityResult.name}`;
            } else {
              // Weit entfernt → "Umgebung X" 
              displayName = `Umgebung ${cityResult.name}`;
            }
          } else {
            // Fallback falls keine Stadt gefunden
            const direction = point.distance < 30 ? 'Nahe' : 'Ferne';
            displayName = `${direction} Region (${point.distance}km)`;
          }
          
          return {
            id: index,
            name: displayName,
            lat: point.lat.toFixed(4),
            lon: point.lon.toFixed(4),
            temperature: weather.avgTemp,
            maxTemp: weather.maxTemp,
            sunHours: weather.sunHours,
            rainHours: weather.rainHours,
            weatherScore: weather.weatherScore,
            distance: point.distance,
            forecast: weather.forecast,
            totalDays: weather.totalDays
          };
        }
        return null;
      });
      
      const weatherResults = await Promise.all(weatherPromises);
      const validResults = weatherResults.filter(result => result !== null);
      
      if (validResults.length === 0) {
        setError('Keine Wetterdaten gefunden. Bitte versuche es später nochmal.');
        return;
      }
      
      const sortedResults = validResults.sort((a, b) => b.weatherScore - a.weatherScore);
      setResults(sortedResults);
      
    } catch (error) {
      setError(`Fehler beim Laden der Wetterdaten: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (forecast, searchType) => {
    if (searchType === 'sonnenschein') {
      switch (forecast) {
        case 'Sonnig': return '☀️';
        case 'Bewölkt': return '⛅';
        case 'Bedeckt': return '☁️';
        default: return '🌤️';
      }
    } else {
      switch (forecast) {
        case 'Schnee': return '❄️';
        case 'Frost': return '🌨️';
        case 'Mild': return '🌤️';
        default: return '☁️';
      }
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(tomorrow.toISOString().split('T')[0]);
    
    // Lade gespeicherten API-Key falls vorhanden (überschreibt Standard)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400 p-4">
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-200 p-2 text-center text-xs z-50">
        <span className="text-gray-600">Werbung</span>
        <div className="bg-gray-200 h-12 flex items-center justify-center text-gray-500 rounded mt-1">
          [Google AdSense Banner 320x50]
        </div>
        <button className="absolute top-1 right-1 text-gray-400 hover:text-gray-600" onClick={() => document.querySelector('.fixed.bottom-0').style.display = 'none'}>×</button>
      </div>

      <div className="max-w-4xl mx-auto pb-20">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between gap-2 mb-4 px-2">
            <div className="relative">
              <Sun className="text-yellow-300 animate-pulse" size={60} />
              <div className="absolute -inset-2 bg-yellow-200 rounded-full opacity-20 animate-ping"></div>
            </div>
            <div className="flex-1 text-center mx-2">
              <h1 
                className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg cursor-pointer select-none" 
                onClick={handleLogoClick}
                title={logoClickCount > 0 ? `${logoClickCount}/5 für Admin-Zugang` : 'Sonnensuche'}
              >
                Sonnensuche
              </h1>
              <p className="text-yellow-100 text-sm md:text-lg font-medium">www.sonnensuche.com</p>
            </div>
            {showSettings && (
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 text-white hover:text-red-200 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center min-w-[50px] flex-shrink-0"
                title="Einstellungen schließen"
              >
                <span className="text-lg">✕</span>
                <span className="text-xs">Close</span>
              </button>
            )}
          </div>
          <p className="text-white text-xl drop-shadow font-semibold">Die erste App, die nach den Orten mit dem besten Wetter sucht</p>
          <p className="text-yellow-100 mt-2 text-lg font-bold">Für alle spontanen Urlauber und Ausflügler</p>
        </div>

        {showSettings && (
          <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6 mb-6 border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔧 Admin-Einstellungen</h3>
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
                    placeholder="Neuer OpenWeatherMap API-Key (optional)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    onClick={saveApiKey}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Speichern
                  </button>
                </div>
              </div>
              <div className="text-sm text-red-600 space-y-2">
                <p><strong>⚠️ Admin-Bereich:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Hier kannst du den Standard-API-Key überschreiben</li>
                  <li>Leer lassen = Standard-Key wird verwendet</li>
                  <li>Diese Einstellungen sind nur für Administratoren</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50/95 backdrop-blur border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Fehler:</strong> {error}
          </div>
        )}

        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Was suchst du?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setSearchType('sonnenschein')}
              className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                searchType === 'sonnenschein' 
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white shadow-lg border-2 border-yellow-600 shadow-yellow-200' 
                  : 'bg-gradient-to-br from-yellow-100 to-orange-100 text-gray-700 hover:shadow-md border-2 border-transparent hover:border-yellow-300'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-1">☀️</div>
                <h3 className="text-lg font-bold">Sonnenschein</h3>
                <p className="text-xs opacity-90">Warme Temperaturen & viel Sonne</p>
              </div>
            </button>
            
            <button
              onClick={() => setSearchType('schnee')}
              className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                searchType === 'schnee' 
                  ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-lg border-2 border-blue-600 shadow-blue-200' 
                  : 'bg-gradient-to-br from-blue-100 to-cyan-100 text-gray-700 hover:shadow-md border-2 border-transparent hover:border-blue-300'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-1">❄️</div>
                <h3 className="text-lg font-bold">Schnee & Winter</h3>
                <p className="text-xs opacity-90">Kalte Temperaturen & Schneechancen</p>
              </div>
            </button>
          </div>:scale-105 active:scale-95 ${
                searchType === 'schnee' 
                  ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-lg border-2 border-blue-600 shadow-blue-200' 
                  : 'bg-gradient-to-br from-blue-100 to-cyan-100 text-gray-700 hover:shadow-md border-2 border-transparent hover:border-blue-300'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">❄️</div>
                <h3 className="text-xl font-bold">Schnee & Winter</h3>
                <p className="text-sm opacity-90">Kalte Temperaturen & Schneechancen</p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Von wo startest du?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="z.B. Berlin, München"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={getCurrentLocation}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                  title="Aktuellen Standort verwenden"
                >
                  <Navigation size={18} />
                </button>
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wie weit bist du bereit zu fahren? ({radius} km)
              </label>
              <input
                type="range"
                min="10"
                max="500"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center text-sm text-gray-600 mt-1">
                {radius < 50 ? 'Nah' : radius < 150 ? 'Mittel' : 'Weit'} - {radius} km
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Wann möchtest du los?
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                Bis wann?
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg text-center">
              <span className="text-xs text-blue-600">Gesponsert - Während du wartest</span>
              <div className="bg-blue-100 h-20 flex items-center justify-center text-blue-500 rounded mt-2">
                [Google AdSense Interstitial]
              </div>
            </div>
          )}

          <p className="text-center text-blue-600 mb-4 font-medium">
            📅 5-Tage Wettervorhersage • Präzise Prognosen
          </p>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 shadow-lg flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Suche die besten Orte für dich...
              </>
            ) : (
              <>
                <Search size={24} />
                Ab in die Sonne!
                <Sun size={24} className="animate-pulse" />
              </>
            )}
          </button>
        </div>

        {/* PWA Download Button - Nur anzeigen wenn noch keine Ergebnisse da sind */}
        {(showInstallPrompt || isIOS) && results.length === 0 && (
          <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6 mb-8 border-l-4 border-blue-500">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-4 shadow-lg">
                  <Sun className="text-yellow-300 animate-pulse" size={32} />
                </div>
                <div className="absolute -inset-2 bg-blue-200 rounded-full opacity-30 animate-ping"></div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">📱 Sonnensuche-App kostenlos downloaden</h3>
              <p className="text-gray-600 mb-4">Installiere die App auf deinem Handy für schnelleren Zugriff - ohne App Store!</p>
              
              <button
                onClick={isIOS ? handleIOSInstall : handleInstallClick}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 text-lg"
              >
                <Download size={24} />
                <Sun size={24} className="text-yellow-300 animate-pulse" />
                {isIOS ? 'iPhone Installationsanleitung anzeigen' : 'Jetzt kostenlos installieren'}
                <Sun size={24} className="text-yellow-300 animate-pulse" />
              </button>
              
              <p className="text-sm text-gray-500 mt-3">
                ✅ Kostenlos • ✅ Ohne App Store • ✅ Funktioniert offline
              </p>
            </div>

            {/* iOS Installation Instructions */}
            {isIOS && showIOSInstruct && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3 text-center">📲 So installierst du Sonnensuche auf dein iPhone:</h4>
                <div className="space-y-3 text-sm text-blue-700">
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    <p>Tippe auf das <strong>Teilen-Symbol</strong> unten in Safari (Quadrat mit Pfeil nach oben) 📤</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    <p>Scrolle runter und wähle <strong>"Zum Home-Bildschirm hinzufügen"</strong> 📱</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    <p>Tippe auf <strong>"Hinzufügen"</strong> - fertig! 🎉</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
                  <p className="text-green-800 text-xs text-center">
                    ✅ Die Sonnensuche-App erscheint dann als Icon auf deinem Home-Bildschirm!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {results.length > 0 && (
          <div className="mb-6 p-4 bg-white/90 rounded-lg text-center">
            <span className="text-xs text-gray-500">Gesponserte Angebote</span>
            <div className="bg-gray-200 h-24 flex items-center justify-center text-gray-500 rounded mt-2">
              [Google AdSense Banner 728x90]
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
              Deine Top Ergebnisse
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Orte mit dem schönsten Wetter für deinen Urlaub oder Ausflug
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.slice(0, 12).map((spot, index) => (
                <div key={spot.id}>
                  <div
                    className={`p-5 rounded-xl border-2 transition-all hover:shadow-lg transform hover:scale-105 ${
                      index === 0 
                        ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-md' 
                        : 'border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2 mb-1">
                          {index === 0 && '👑'}
                          <span className="text-2xl">{index + 1}</span>
                          {spot.name}
                          <span className="text-3xl">{getWeatherIcon(spot.forecast, searchType)}</span>
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin size={14} />
                          {spot.distance} km entfernt
                        </p>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${getScoreColor(spot.weatherScore)}`}>
                        <Star size={14} className="inline mr-1" />
                        {spot.weatherScore}%
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2 bg-white/50 rounded-lg p-2">
                        <Thermometer className="text-red-500" size={18} />
                        <div>
                          <div className="font-bold">{spot.temperature}°C</div>
                          <div className="text-xs text-gray-600">Max: {spot.maxTemp}°C</div>
                        </div>
                      </div>
                      {searchType === 'sonnenschein' ? (
                        <div className="flex items-center gap-2 bg-white/50 rounded-lg p-2">
                          <Sun className="text-yellow-500" size={18} />
                          <div>
                            <div className="font-bold">{spot.sunHours}h</div>
                            <div className="text-xs text-gray-600">
                              {spot.totalDays > 1 ? 'Sonne pro Tag' : 'Sonnenschein'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-white/50 rounded-lg p-2">
                          <div className="text-blue-500 text-lg">❄️</div>
                          <div>
                            <div className="font-bold">{spot.forecast}</div>
                            <div className="text-xs text-gray-600">Wetter</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-sm bg-white/70 rounded-lg p-2 mb-3">
                      <strong>Vorhersage:</strong> <span className="font-medium">{spot.forecast}</span>
                      {searchType === 'sonnenschein' && spot.rainHours > 0 && (
                        <span className="text-blue-600 ml-2">({spot.rainHours}h Regen{spot.totalDays > 1 ? ' pro Tag' : ''})</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          const bookingUrl = `https://www.booking.com/searchresults.html?aid=12345678&label=sonnensuche&dest_type=city&ss=${encodeURIComponent(spot.name)}&checkin=${startDate}&checkout=${endDate}&adults=2&currency=EUR`;
                          window.open(bookingUrl, '_blank');
                          console.log('Booking clicked:', spot.name, spot.weatherScore);
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                      >
                        🏨 Unterkunft in {spot.name} finden
                        <span className="text-sm opacity-90">→ ab 29€</span>
                      </button>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => window.open('https://www.airbnb.de/', '_blank')}
                          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-3 rounded text-sm transition-colors"
                        >
                          🏠 Airbnb
                        </button>
                        <button
                          onClick={() => window.open(`https://de.hotels.com/search.do?destination=${encodeURIComponent(spot.name)}&startDate=${startDate}&endDate=${endDate}`, '_blank')}
                          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded text-sm transition-colors"
                        >
                          🏨 Hotels.com
                        </button>
                        <button
                          onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(spot.name)}/@${spot.lat},${spot.lon},12z`, '_blank')}
                          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded text-sm transition-colors"
                        >
                          📍 Route
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-500 text-center">
                        ⭐ Bei Buchung über unsere Partner unterstützt du Sonnensuche.com
                      </p>
                    </div>
                  </div>

                  {(index === 2 || index === 5) && (
                    <div className="my-4 p-4 bg-white/90 rounded-lg text-center">
                      <span className="text-xs text-gray-500">Werbung</span>
                      <div className="bg-gray-200 h-32 flex items-center justify-center text-gray-500 rounded mt-2">
                        [Google AdSense Native Ad 336x280]
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl">
              <h3 className="text-xl font-bold mb-2">✅ Echte Live-Wetterdaten von OpenWeatherMap</h3>
              <p className="text-green-100">
                Diese Ergebnisse basieren auf aktuellen 5-Tage-Wettervorhersagen und helfen dir dabei, 
                spontane Ausflüge und Kurzurlaube perfekt zu planen!
              </p>
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-center">
              <h4 className="font-bold mb-2">🚀 Mehr Planungssicherheit gewünscht?</h4>
              <p className="text-sm mb-3">Upgrade auf 16-Tage Wettervorhersage für nur 0,99€/Monat</p>
              <button className="bg-white text-purple-600 font-semibold py-2 px-4 rounded hover:bg-purple-50 transition-colors">
                ⭐ Premium aktivieren
              </button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>💡 Tipp:</strong> Unterkunft gefunden? Buche direkt über unsere Partner-Links 
                und unterstütze die Weiterentwicklung von Sonnensuche.com!
              </p>
            </div>

            {/* PWA Download Button - Nach den Ergebnissen */}
            {(showInstallPrompt || isIOS) && (
              <div className="mt-8 bg-white/95 backdrop-blur rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 shadow-lg">
                      <Sun className="text-yellow-300 animate-pulse" size={32} />
                    </div>
                    <div className="absolute -inset-2 bg-green-200 rounded-full opacity-30 animate-ping"></div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">🎉 Perfekte Ergebnisse gefunden!</h3>
                  <h4 className="text-xl font-bold text-gray-700 mb-2">📱 Jetzt Sonnensuche-App kostenlos installieren</h4>
                  <p className="text-gray-600 mb-4">Für noch schnellere Wettersuchen in Zukunft - direkt vom Home-Bildschirm!</p>
                  
                  <button
                    onClick={isIOS ? handleIOSInstall : handleInstallClick}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 text-lg"
                  >
                    <Download size={24} />
                    <Sun size={24} className="text-yellow-300 animate-pulse" />
                    {isIOS ? 'iPhone Installationsanleitung anzeigen' : 'App jetzt installieren'}
                    <Sun size={24} className="text-yellow-300 animate-pulse" />
                  </button>
                  
                  <p className="text-sm text-gray-500 mt-3">
                    ✅ Kostenlos • ✅ Ohne App Store • ✅ Funktioniert offline
                  </p>
                </div>

                {/* iOS Installation Instructions */}
                {isIOS && showIOSInstruct && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-3 text-center">📲 So installierst du Sonnensuche auf dein iPhone:</h4>
                    <div className="space-y-3 text-sm text-blue-700">
                      <div className="flex items-start gap-3">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        <p>Tippe auf das <strong>Teilen-Symbol</strong> unten in Safari (Quadrat mit Pfeil nach oben) 📤</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        <p>Scrolle runter und wähle <strong>"Zum Home-Bildschirm hinzufügen"</strong> 📱</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        <p>Tippe auf <strong>"Hinzufügen"</strong> - fertig! 🎉</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
                      <p className="text-green-800 text-xs text-center">
                        ✅ Die Sonnensuche-App erscheint dann als Icon auf deinem Home-Bildschirm!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 text-white rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">🌦 Sonnensuche.com - Die Revolution der Wettersuche</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Search size={20} />
              </div>
              <h3 className="font-bold mb-2">Nie wieder im Regen stehen</h3>
              <p>Suche nach dem Wetter, das du dir wünschst - nicht nach Orten! Finde spontan die sonnigsten Plätze in deiner Umgebung.</p>
            </div>
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <h3 className="font-bold mb-2">Perfekt für spontane Ausflügler</h3>
              <p>Ideal für Kurzreisen, Camping und Outdoor-Abenteuer. 5-Tage Wettervorhersage für ganz Deutschland.</p>
            </div>
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Star size={20} />
              </div>
              <h3 className="font-bold mb-2">Intelligentes Ranking</h3>
              <p>KI-basierte Bewertung für die besten Wetter-Spots in deiner Nähe. Präzise Prognosen von OpenWeatherMap.</p>
            </div>
          </div>
          
          {/* SEO Content Block */}
          <div className="mt-8 p-4 bg-white/10 rounded-lg">
            <h3 className="font-bold mb-3">Warum Sonnensuche für deine Ausflüge?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">🌅 Für Outdoor-Aktivitäten:</h4>
                <ul className="space-y-1">
                  <li>• Wandern bei perfektem Wetter</li>
                  <li>• Camping ohne Regen</li>
                  <li>• Radtouren im Sonnenschein</li>
                  <li>• Strand- und Badeausflüge</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🎯 Smart & Präzise:</h4>
                <ul className="space-y-1">
                  <li>• 5-Tage Wettervorhersage</li>
                  <li>• Umkreissuche bis 500km</li>
                  <li>• Echte Wetterdaten</li>
                  <li>• Kostenlos & ohne Anmeldung</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section für SEO */}
        <div className="mt-8 bg-white/95 backdrop-blur rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Häufige Fragen zur Wettersuche</h2>
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-bold text-gray-800 mb-2">Wie funktioniert die Sonnensuche?</h3>
              <p className="text-gray-600 text-sm">Sonnensuche durchsucht einen von dir gewählten Umkreis nach den Orten mit dem besten Wetter. Du gibst deinen Startort und gewünschten Zeitraum ein, und wir zeigen dir die sonnigsten Orte in deiner Nähe.</p>
            </div>
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-bold text-gray-800 mb-2">Ist Sonnensuche kostenlos?</h3>
              <p className="text-gray-600 text-sm">Ja, Sonnensuche ist komplett kostenlos! Du brauchst keine Anmeldung und kannst sofort loslegen. Wir finanzieren uns über Partnerschaften mit Buchungsportalen.</p>
            </div>
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-bold text-gray-800 mb-2">Wie genau sind die Wettervorhersagen?</h3>
              <p className="text-gray-600 text-sm">Wir nutzen professionelle Wetterdaten von OpenWeatherMap mit 5-Tage Vorhersagen. Die Daten werden alle 3 Stunden aktualisiert und sind sehr zuverlässig für die Planung von Ausflügen.</p>
            </div>
            <div className="pb-4">
              <h3 className="font-bold text-gray-800 mb-2">Kann ich die App auf mein Handy installieren?</h3>
              <p className="text-gray-600 text-sm">Ja! Sonnensuche ist eine Progressive Web App (PWA). Du kannst sie direkt über deinen Browser auf dem Smartphone installieren - ganz ohne App Store. Einfach "Zum Home-Bildschirm hinzufügen" wählen.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SonnensucheApp;
