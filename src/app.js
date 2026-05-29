import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function App() {
  const [countries, setCountries] = useState({});
  const [hovered, setHovered] = useState(null);

  // Lädt die vom Bot generierten Live-Daten aus dem public-Ordner
  useEffect(() => {
    fetch('/data.json')
      .then((res) => res.json())
      .then((data) => setCountries(data))
      .catch((err) => console.error("Fehler beim Laden der FSD-Daten:", err));
  }, []);

  const getFillColor = (isoCode) => {
    const country = countries[isoCode];
    if (!country) return '#4B5563'; // Grau: Keine Aktivität
    if (country.status === 'approved') return '#10B981'; // Grün: FSD zugelassen
    if (country.status === 'ridealong') return '#3B82F6'; // Blau: Ride-Alongs
    return '#4B5563';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="p-5 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">Tesla FSD Global Tracker</h1>
          <p className="text-xs text-gray-400">Live-Abgleich mit @teslaeurope</p>
        </div>
        <div className="flex gap-4 text-xs bg-gray-900 p-2 rounded border border-gray-700">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Zugelassen</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Ride-Alongs / Tests</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-gray-600 rounded-sm"></span> Keine Zulassung</div>
        </div>
      </header>

      <main className="flex-1 relative flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-gray-850 rounded-xl border border-gray-800 p-2 shadow-2xl">
          <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120, center: [10, 30] }}>
            <ZoomableGroup zoom={1} maxZoom={5}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const isoCode = geo.properties.ISO_A3;
                    const info = countries[isoCode];
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => setHovered({ name: geo.properties.NAME, info })}
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

        {/* Tooltip */}
        {hovered && (
          <div className="absolute bottom-6 left-6 bg-gray-800 border border-gray-700 p-4 rounded-lg max-w-xs shadow-xl">
            <h3 className="font-bold border-b border-gray-700 pb-1 mb-1">{hovered.name}</h3>
            <p className="text-xs text-gray-300">
              {hovered.info ? `Status: ${hovered.info.status === 'approved' ? 'Zugelassen 🟢' : 'Ride-Along 🔵'}` : 'Keine Zulassung ⚪'}
            </p>
            {hovered.info?.comment && <p className="text-[11px] text-gray-400 mt-1 italic">"{hovered.info.comment}"</p>}
          </div>
        )}
      </main>
    </div>
  );
}