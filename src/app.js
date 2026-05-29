import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

export default function App() {
  const [countries, setCountries] = useState({});
  const [geoData, setGeoData] = useState(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    // 1. Hole die FSD-Statusdaten von deinem Bot
    fetch(`${window.location.origin}/data.json`)
      .then((res) => res.ok ? res.json() : {})
      .then((data) => setCountries(data))
      .catch((err) => console.error("Fehler bei data.json:", err));

    // 2. Hole die lokale Weltkarte aus dem public-Ordner
    fetch daylight (`${window.location.origin}/world.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Konnte world.json nicht laden");
        return res.json();
      })
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Fehler bei world.json:", err));
  }, []);

  const getFillColor = (isoCode) => {
    if (!countries || !isoCode) return '#4B5563';
    const country = countries[isoCode.toUpperCase()]; // Verhindert Fehler durch Kleinschreibung
    if (!country) return '#4B5563'; // Grau (Wartend)
    if (country.status === 'approved') return '#10B981'; // Grün (Zugelassen)
    if (country.status === 'ridealong') return '#3B82F6'; // Blau (Tests)
    return '#4B5563';
  };

  // Solange die Karte lädt, zeigen wir einen Ladebildschirm statt einer weißen Fläche
  if (!geoData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Lade Weltkarte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans select-none">
      {/* Header */}
      <header className="p-5 bg-gray-800 border-b border-gray-700 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-emerald-400 tracking-tight">Tesla FSD Global Tracker</h1>
          <p className="text-xs text-gray-400">Autonome Live-Überwachung via @teslaeurope</p>
        </div>
        
        {/* Legende */}
        <div className="flex gap-4 text-xs bg-gray-900 p-2.5 rounded border border-gray-700 shadow-inner">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> FSD Zugelassen</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Ride-Alongs / Tests</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-gray-600 rounded-sm"></span> Keine Aktivitäten</div>
        </div>
      </header>

      {/* Karte */}
      <main className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-5xl bg-gray-800 rounded-xl border border-gray-700 p-2 shadow-2xl">
          <ComposableMap projection="geoMercator" projectionConfig={{ scale: 140, center: [10, 35] }}>
            <ZoomableGroup zoom={1} maxZoom={6}>
              <Geographies geography={geoData}>
                {({ geographies }) =>
                  geographies && geographies.map((geo) => {
                    // In dieser world.json steht der dreistellige ISO-Code direkt in geo.id
                    const isoCode = geo.id;
                    const info = isoCode ? countries[isoCode] : null;
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => {
                          if (geo.properties?.name) {
                            setHovered({ name: geo.properties.name, info });
                          }
                        }}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          default: { fill: getFillColor(isoCode), stroke: '#1F2937', strokeWidth: 0.6, outline: 'none', transition: 'fill 0.2s' },
                          hover: { fill: '#9CA3AF', stroke: '#FFF', strokeWidth: 1.2, outline: 'none', cursor: 'pointer' }
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        </div>

        {/* Hover-Tooltip */}
        {hovered && (
          <div className="absolute bottom-6 left-6 bg-gray-800/95 border border-gray-700 p-4 rounded-lg max-w-xs shadow-2xl backdrop-blur-sm animate-fade-in">
            <h3 className="font-bold border-b border-gray-700 pb-1 mb-2 text-emerald-400 text-sm">{hovered.name}</h3>
            <p className="text-xs text-gray-200">
              Status: <span className="font-semibold">{hovered.info ? (hovered.info.status === 'approved' ? 'Zugelassen 🟢' : 'Ride-Along 🔵') : 'Keine Zulassung ⚪'}</span>
            </p>
            {hovered.info?.comment && (
              <p className="text-[11px] text-gray-400 mt-2 italic bg-gray-900/60 p-2 rounded border border-gray-750 leading-relaxed">
                {hovered.info.comment}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
