import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

// Der unkaputtbare Link zur offiziellen Weltkarte
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export default function App() {
  const [countries, setCountries] = useState({});
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    // window.location.origin stellt sicher, dass Vercel die Datei immer von der richtigen Adresse lädt
    fetch(`${window.location.origin}/data.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Konnte data.json auf dem Server nicht finden");
        return res.json();
      })
      .then((data) => setCountries(data || {}))
      .catch((err) => {
        console.error("Fehler beim Laden der FSD-Daten, nutze leere Basis:", err);
        setCountries({}); // Verhindert den White Screen Absturz bei Ladefehlern
      });
  }, []);

  const getFillColor = (isoCode) => {
    if (!countries || !isoCode) return '#4B5563';
    const country = countries[isoCode];
    if (!country) return '#4B5563'; // Grau (Kein FSD-Status vorhanden)
    if (country.status === 'approved') return '#10B981'; // Grün (FSD zugelassen)
    if (country.status === 'ridealong') return '#3B82F6'; // Blau (Testfahrten/Ride-Alongs)
    return '#4B5563';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      {/* Header-Bar */}
      <header className="p-5 bg-gray-800 border-b border-gray-700 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">Tesla FSD Global Tracker</h1>
          <p className="text-xs text-gray-400">Autonome Live-Überwachung via @teslaeurope</p>
        </div>
        
        {/* Legende */}
        <div className="flex gap-4 text-xs bg-gray-900 p-2.5 rounded border border-gray-700 shadow-inner">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Zugelassen</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Ride-Alongs / Tests</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-gray-600 rounded-sm"></span> Keine Zulassung</div>
        </div>
      </header>

      {/* Hauptbereich mit der Weltkarte */}
      <main className="flex-1 relative flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-gray-800 rounded-xl border border-gray-700 p-2 shadow-2xl">
          <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120, center: [10, 30] }}>
            <ZoomableGroup zoom={1} maxZoom={5}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies && geographies.map((geo) => {
                    // fängt unterschiedliche Schreibweisen der Länder-IDs in den Map-Dateien ab
                    const isoCode = geo.properties?.ISO_A3 || geo.properties?.iso_a3 || geo.id;
                    const info = isoCode ? countries[isoCode] : null;
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => {
                          if (geo.properties?.NAME) {
                            setHovered({ name: geo.properties.NAME, info });
                          }
                        }}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          default: { fill: getFillColor(isoCode), stroke: '#1F2937', strokeWidth: 0.5, outline: 'none' },
                          hover: { fill: '#9CA3AF', stroke: '#FFF', strokeWidth: 1, outline: 'none', cursor: 'pointer' }
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        </div>

        {/* Infobox bei Maus-Hover */}
        {hovered && (
          <div className="absolute bottom-6 left-6 bg-gray-800 border border-gray-700 p-4 rounded-lg max-w-xs shadow-2xl backdrop-blur-md">
            <h3 className="font-bold border-b border-gray-700 pb-1 mb-2 text-emerald-400">{hovered.name}</h3>
            <p className="text-xs text-gray-200 font-medium">
              Status: {hovered.info ? (hovered.info.status === 'approved' ? 'Zugelassen 🟢' : 'Ride-Along 🔵') : 'Keine Zulassung ⚪'}
            </p>
            {hovered.info?.comment && (
              <p className="text-[11px] text-gray-400 mt-2 italic bg-gray-900 p-1.5 rounded border border-gray-750">
                {hovered.info.comment}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
