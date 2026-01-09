
import React, { useState } from 'react';
import { checkOverdoseRisk, generateSpeech, decodeBase64Audio, decodePCM } from '../services/geminiService';

const OverdoseChecker: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({ drug: '', amount: '', time: '', weight: '', symptoms: '' });
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await checkOverdoseRisk(formData);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playVoice = async () => {
    if (!result?.text || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const audioData = await generateSpeech(result.text);
      if (audioData) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = await decodePCM(decodeBase64Audio(audioData), audioCtx, 24000);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      }
    } catch (err) {
      console.error(err);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 bg-gradient-to-br from-white to-red-50/30">
        <h2 className="text-xl font-bold text-red-700 mb-1 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1-1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          Overdose Risk Assessment
        </h2>
        <p className="text-slate-500 text-sm mb-6">Immediate guidance for potential drug toxicity.</p>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Drug Name(s)</label>
            <input type="text" required value={formData.drug} onChange={e => setFormData({...formData, drug: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200" placeholder="e.g. Paracetamol, Xanax" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Amount Taken</label>
            <input type="text" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200" placeholder="e.g. 10 tablets of 500mg" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Time Since Ingestion</label>
            <input type="text" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200" placeholder="e.g. 45 minutes ago" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Weight (Optional)</label>
            <input type="text" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200" placeholder="e.g. 70kg" />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Current Symptoms</label>
            <textarea required value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})} className="w-full h-24 p-3 rounded-xl border border-slate-200" placeholder="e.g. Drowsiness, vomiting, shallow breathing..." />
          </div>
          <button disabled={loading} type="submit" className="md:col-span-2 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-100">
            {loading ? "Assessing Risk..." : "Analyze Overdose Risk"}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-red-100 animate-fade-in relative">
          <div className="absolute top-4 right-4">
            <button onClick={playVoice} disabled={isSpeaking} className={`p-3 rounded-full transition-all ${isSpeaking ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-red-50'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            </button>
          </div>
          <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed mb-6">
            {result.text}
          </div>

          {result.groundingChunks?.length > 0 && (
            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Verification Sources</h4>
              <div className="flex flex-wrap gap-2">
                {result.groundingChunks.map((chunk: any, i: number) => (
                  chunk.web && (
                    <a
                      key={i}
                      href={chunk.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-xs px-4 py-2 bg-slate-50 text-blue-600 rounded-xl hover:bg-blue-50 transition-all border border-slate-100 hover:shadow-sm"
                    >
                      <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg>
                      {chunk.web.title || "Medical Reference"}
                    </a>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OverdoseChecker;
