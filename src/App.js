import React, { useState, useEffect } from 'react';
import { MapPin, Sun, Thermometer, Calendar, Search, Loader2, Settings, Eye, EyeOff, Star, Navigation, Clock } from 'lucide-react';

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

  // Geocoding: Ortsname zu Koordinaten
  const geocodeLocation = async (locationName) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationName)}&limit=1&appid=${apiKey}`
      );
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('Ort nicht gefunden');
      }
      
      return {
        lat: data[0].lat,
        lon: data[0].lon,
        name: data[0].name,
        country: data[0].country
      };
    } catch (error) {
      throw new Error(`Geocoding fehler: ${error.message}`);
    }
  };

  // Generiere Koordinaten im Umkreis
  const generateLocationGrid = (centerLat, centerLon, radiusKm, gridSize = 12) => {
    const locations = [];
    const points = [];
    
    // Generiere Punkte in verschiedenen Entfernungen und Richtungen
    for (let i = 0; i < gridSize; i++) {
      const angle = (i / gridSize) * 2 * Math.PI;
      
      // Verschiedene Entfernungen vom Zentrum
      [0.3, 0.6, 1.0].forEach(distanceFactor => {
        const distance = radiusKm * distanceFactor;
        // Umrechnung: 1 Grad ≈ 111 km
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

  // Wetterdaten von OpenWeatherMap abrufen
  const fetchWeatherData = async (lat, lon) => {
    try {
      // 5-Tage Vorhersage mit 3-Stunden Intervallen
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=de`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Analysiere Wetterdaten für den gewählten Zeitraum
      const startDateTime = new Date(startDate).getTime();
      const endDateTime = new Date(endDate).getTime() + (24 * 60 * 60 * 1000); // Ende des Tages
      
      let totalTemp = 0;
      let maxTemp = -100;
      let sunnyHours = 0;
      let validReadings = 0;
      let rainHours = 0;
      
      data.list.forEach(reading => {
        const readingTime = reading.dt * 1000;
        
        if (readingTime >= startDateTime && readingTime <= endDateTime) {
          validReadings++;
          totalTemp += reading.main.temp;
          maxTemp = Math.max(maxTemp, reading.main.temp);
          
          // Sonnenstunden basierend auf Bewölkung schätzen
          const cloudiness = reading.clouds.all;
          const sunFactor = Math.max(0, (100 - cloudiness) / 100);
          sunnyHours += sunFactor * 3; // 3-Stunden Intervalle
          
          // Regenstunden
          if (reading.rain && reading.rain['3h'] > 0) {
            rainHours += 3;
          }
        }
      });
      
      if (validReadings === 0) {
        throw new Error('Keine Wetterdaten für den gewählten Zeitraum verfügbar');
      }
      
      const avgTemp = totalTemp / validReadings;
      const estimatedSunHours = sunnyHours / (validReadings / 8); // Pro Tag
      const estimatedRainHours = rainHours / (validReadings / 8); // Pro Tag
      
      // Wetter-Score berechnen basierend auf Suchtyp
      let weatherScore;
      if (searchType === 'sonnenschein') {
        const tempScore = Math.max(0, Math.min(100, (avgTemp + 10) * 2.5)); // -10°C = 0%, 30°C = 100%
        const sunScore = Math.max(0, Math.min(100, (estimatedSunHours / 12) * 100)); // 12h = 100%
        weatherScore = Math.round(tempScore * 0.6 + sunScore * 0.4);
      } else { // schnee
        const tempScore = Math.max(0, Math.min(100, (10 - avgTemp) * 10)); // Kälter = besser für Schnee
        const snowScore = avgTemp < 2 ? 80 : 20; // Unter 2°C = gute Schneechancen
        weatherScore = Math.round(tempScore * 0.7 + snowScore * 0.3);
      }
      
      return {
        avgTemp: Math.round(avgTemp * 10) / 10,
        maxTemp: Math.round(maxTemp * 10) / 10,
        sunHours: Math.round(estimatedSunHours * 10) / 10,
        rainHours: Math.round(estimatedRainHours * 10) / 10,
        weatherScore: weatherScore,
        cityName: data.city.name,
        forecast: searchType === 'sonnenschein' 
          ? (avgTemp > 20 && estimatedSunHours > 6 ? 'Sonnig' : avgTemp > 15 ? 'Bewölkt' : 'Bedeckt')
          : (avgTemp < 0 ? 'Schnee' : avgTemp < 5 ? 'Frost' : 'Mild')
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
    if (!apiKey.trim()) {
      setError('Bitte gib zuerst deinen OpenWeatherMap API-Key ein!');
      setShowSettings(true);
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
      
      // Koordinaten ermitteln
      if (location === 'Mein aktueller Standort' && userLocation) {
        centerCoords = userLocation;
      } else {
        centerCoords = await geocodeLocation(location);
      }
      
      // Gitter von Koordinaten im Umkreis generieren
      const locationGrid = generateLocationGrid(centerCoords.lat, centerCoords.lon, radius);
      
      // Wetterdaten für alle Punkte parallel abrufen
      const weatherPromises = locationGrid.map(async (point, index) => {
        const weather = await fetchWeatherData(point.lat, point.lon);
        if (weather) {
          return {
            id: index,
            name: weather.cityName || `Region ${index + 1}`,
            lat: point.lat.toFixed(4),
            lon: point.lon.toFixed(4),
            temperature: weather.avgTemp,
            maxTemp: weather.maxTemp,
            sunHours: weather.sunHours,
            rainHours: weather.rainHours,
            weatherScore: weather.weatherScore,
            distance: point.distance,
            forecast: weather.forecast
          };
        }
        return null;
      });
      
      const weatherResults = await Promise.all(weatherPromises);
      const validResults = weatherResults.filter(result => result !== null);
      
      if (validResults.length === 0) {
        setError('Keine Wetterdaten gefunden. Überprüfe deinen API-Key und die Internetverbindung.');
        return;
      }
      
      // Nach Wetter-Score sortieren
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
    // Setze Standarddaten
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(tomorrow.toISOString().split('T')[0]);
    
    // Lade gespeicherten API-Key
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
      <div className="max-w-4xl mx-auto">
        {/* Header im Sonnensuche-Stil */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Sun className="text-yellow-300 animate-pulse" size={50} />
              <div className="absolute -inset-2 bg-yellow-200 rounded-full opacity-20 animate-ping"></div>
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white drop-shadow-lg">Sonnensuche</h1>
              <p className="text-yellow-100 text-lg font-medium">www.sonnensuche.com</p>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 text-white hover:text-yellow-200 hover:bg-white/10 rounded-lg transition-colors"
              title="API-Einstellungen"
            >
              <Settings size={24} />
            </button>
          </div>
          <p className="text-white text-lg drop-shadow">Die erste App, die nach dem Wetter sucht, das du dir wünschst!</p>
          <p className="text-yellow-100 mt-2">Für alle spontanen Urlauber und Ausflügler</p>
        </div>

        {/* API-Key Einstellungen */}
        {showSettings && (
          <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6 mb-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔑 OpenWeatherMap API-Key</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API-Key eingeben:
                </label>
                <div className="flex gap-2">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Dein OpenWeatherMap API-Key"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    onClick={saveApiKey}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Speichern
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>So erhältst du deinen kostenlosen API-Key:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Gehe zu <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">openweathermap.org/api</a></li>
                  <li>Erstelle einen kostenlosen Account</li>
                  <li>Gehe zu "My API keys" in deinem Profil</li>
                  <li>Kopiere deinen API-Key hierher</li>
                </ol>
                <p className="text-green-600">✅ Kostenlos: 1000 API-Aufrufe pro Tag</p>
              </div>
            </div>
          </div>
        )}

        {/* Fehler-Anzeige */}
        {error && (
          <div className="bg-red-50/95 backdrop-blur border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Fehler:</strong> {error}
          </div>
        )}

        {/* Suchformular im Sonnensuche-Design */}
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Was suchst du?</h2>
          
          {/* Wetter-Typ Auswahl */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setSearchType('sonnenschein')}
              className={`p-6 rounded-xl transition-all transform hover:scale-105 ${
                searchType === 'sonnenschein' 
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white shadow-lg' 
                  : 'bg-gradient-to-br from-yellow-100 to-orange-100 text-gray-700 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">☀️</div>
                <h3 className="text-xl font-bold">Sonnenschein</h3>
                <p className="text-sm opacity-90">Warme Temperaturen & viel Sonne</p>
              </div>
            </button>
            
            <button
              onClick={() => setSearchType('schnee')}
              className={`p-6 rounded-xl transition-all transform hover:scale-105 ${
                searchType === 'schnee' 
                  ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-lg' 
                  : 'bg-gradient-to-br from-blue-100 to-cyan-100 text-gray-700 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">❄️</div>
                <h3 className="text-xl font-bold">Schnee & Winter</h3>
                <p className="text-sm opacity-90">Kalte Temperaturen & Schneechancen</p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
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
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Aktuellen Standort verwenden"
                >
                  <Navigation size={18} />
                </button>
              </div>
            </div>

            <div>
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

            <div>
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

            <div>
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

          <button
            onClick={handleSearch}
            disabled={loading || !apiKey.trim()}
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
                {apiKey.trim() ? 'Ab in die Sonne!' : 'API-Key benötigt'}
                <Sun size={24} className="animate-pulse" />
              </>
            )}
          </button>
        </div>

        {/* Ergebnisse im Sonnensuche-Stil */}
        {results.length > 0 && (
          <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
              🏆 Die Top {results.length} Ergebnisse
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Orte mit dem {searchType === 'sonnenschein' ? 'schönsten Sonnenwetter' : 'besten Schneewetter'} für deinen Ausflug
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.slice(0, 8).map((spot, index) => (
                <div
                  key={spot.id}
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
                          <div className="text-xs text-gray-600">Sonnenschein</div>
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
                      <span className="text-blue-600 ml-2">({spot.rainHours}h Regen)</span>
                    )}
                  </div>

                  {/* Booking.com Affiliate Integration */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        const bookingUrl = `https://www.booking.com/searchresults.html?aid=12345678&label=sonnensuche&dest_type=city&ss=${encodeURIComponent(spot.name)}&checkin=${startDate}&checkout=${endDate}&adults=2&currency=EUR`;
                        window.open(bookingUrl, '_blank');
                        // Analytics tracking
console.log('Booking clicked:', spot.name, spot.weatherScore);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                      🏨 Unterkunft in {spot.name} finden
                      <span className="text-sm opacity-90">→ ab 29€</span>
                    </button>
                    
                    {spot.weatherScore > 80 && (
                      <div className="p-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg text-center text-sm">
                        <span className="font-bold">🎉 Perfektes Wetter!</span> Jetzt beste Angebote sichern
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => window.open(`https://www.airbnb.de/s/${encodeURIComponent(spot.name)}?checkin=${startDate}&checkout=${endDate}&adults=2`, '_blank')}
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
                    </div>
                    
                    <p className="text-xs text-gray-500 text-center">
                      ⭐ Bei Buchung über unsere Partner unterstützt du Sonnensuche.com
                    </p>
                  </div>
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

            {/* Booking.com Integration Hinweis */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>💡 Tipp:</strong> Unterkunft gefunden? Buche direkt über unsere Partner-Links 
                und unterstütze die Weiterentwicklung von Sonnensuche.com!
              </p>
            </div>
          </div>
        )}

        {/* Footer im Sonnensuche-Stil */}
        <div className="mt-8 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 text-white rounded-xl p-6">
          <h3 className="text-2xl font-bold mb-4 text-center">🌦 Sonnensuche.com - Die Revolution der Wettersuche</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Search size={20} />
              </div>
              <h4 className="font-bold mb-2">Nie wieder im Regen stehen</h4>
              <p>Suche nach dem Wetter, das du dir wünschst - nicht nach Orten!</p>
            </div>
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <h4 className="font-bold mb-2">Perfekt für spontane Ausflügler</h4>
              <p>Perfekt für Kurzreisen, Camping und Outdoor-Abenteuer</p>
            </div>
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Star size={20} />
              </div>
              <h4 className="font-bold mb-2">Intelligentes Ranking</h4>
              <p>KI-basierte Bewertung für die besten Wetter-Spots in deiner Nähe</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SonnensucheApp;
