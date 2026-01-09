
import React, { useState, useEffect } from 'react';
import { searchNearbyCare } from '../services/geminiService';

const NearbyCare: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setLocError(null);
        },
        (err) => {
          console.warn("Geolocation failed:", err);
          setLocError("Location access denied. Please enable location to find nearby services.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocError("Geolocation is not supported by this browser.");
    }
  }, []);

  const handleSearch = async (type: string) => {
    setLoading(true);
    setResult(null);
    try {
      // Very explicit query for Gemini 2.5 Maps tool
      const query = `Find the nearest ${type} to my current location (${location ? `${location.latitude}, ${location.longitude}` : 'detect my location via tool'}). List at least 3 facilities with their names and full addresses. Use Google Maps grounding.`;
      const res = await searchNearbyCare(query, location || undefined);
      setResult(res);
    } catch (err) {
      console.error(err);
      setResult({ text: "I could not find nearby services right now. Please check if your location permissions are enabled." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Nearby Medical Services</h2>
        <p className="text-slate-500 text-sm mb-6">Find hospitals and medical stores in your immediate vicinity.</p>
        
        {locError && (
          <div className="mb-4 p-3 bg-amber-50 text-amber-700 text-xs rounded-xl border border-amber-100 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {locError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleSearch('Hospitals and ERs')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-6 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl border border-red-100 transition-all group shadow-sm active:scale-95"
          >
            <svg className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <span className="font-bold text-sm tracking-tight">Hospitals</span>
          </button>
          <button
            onClick={() => handleSearch('Pharmacies and Medical Stores')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl border border-blue-100 transition-all group shadow-sm active:scale-95"
          >
            <svg className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            <span className="font-bold text-sm tracking-tight">Pharmacies</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium animate-pulse">Scanning medical database...</p>
        </div>
      )}

      {result && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fade-in">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="text-lg font-bold text-slate-800">Results Near You</h3>
          </div>
          
          <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap mb-8 text-sm leading-relaxed">
            {result.text}
          </div>
          
          {result.groundingChunks?.length > 0 && (
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Maps Integration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.groundingChunks.map((chunk: any, i: number) => {
                  const url = chunk.maps?.uri || chunk.web?.uri;
                  if (!url) return null;
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-4 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 rounded-2xl transition-all group"
                    >
                      <div className="bg-blue-600 text-white p-2 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-sm font-bold text-slate-800 truncate block">{chunk.maps?.title || chunk.web?.title || "View Clinic"}</span>
                        <span className="text-[10px] text-blue-600 font-medium">Get Directions →</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NearbyCare;
