
import React, { useState } from 'react';
import { identifyDrug, generateSpeech, decodeBase64Audio, decodePCM } from '../services/geminiService';

const DrugIdentifier: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [context, setContext] = useState({ amount: '', reason: '', otherInfo: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result?.toString().split(',')[1] || null);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const contextStr = `Dosage taken: ${context.amount || 'Unknown'}. Reason for use: ${context.reason || 'Not provided'}. Other info: ${context.otherInfo || 'None'}.`;
      const res = await identifyDrug(image, contextStr);
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Advanced Drug Prediction</h2>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer relative overflow-hidden group min-h-[200px]">
              {image ? (
                <div className="relative w-full aspect-square md:aspect-video">
                  <img src={`data:image/jpeg;base64,${image}`} className="w-full h-full object-contain rounded-lg" alt="Drug Preview" />
                  <button onClick={() => setImage(null)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <>
                  <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  <span className="text-slate-600 font-medium">Upload drug photo</span>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} />
                </>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Amount Taken (Optional)</label>
              <input type="text" value={context.amount} onChange={e => setContext({...context, amount: e.target.value})} className="w-full p-2 text-sm rounded-lg border border-slate-200" placeholder="e.g. 2 pills" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Reason for use</label>
              <input type="text" value={context.reason} onChange={e => setContext({...context, reason: e.target.value})} className="w-full p-2 text-sm rounded-lg border border-slate-200" placeholder="e.g. Headache" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Other Symptoms</label>
              <textarea value={context.otherInfo} onChange={e => setContext({...context, otherInfo: e.target.value})} className="w-full h-20 p-2 text-sm rounded-lg border border-slate-200" placeholder="e.g. Felt dizzy after taking it" />
            </div>
          </div>
        </div>

        <button onClick={handleAnalyze} disabled={loading || !image} className="w-full mt-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg">
          {loading ? "Identifying Drug..." : "Analyze Drug Data"}
        </button>
      </div>

      {result && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-slide-up">
           <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-slate-800">Drug Profile</h3>
            <button onClick={playVoice} disabled={isSpeaking} className={`p-2 rounded-full transition-colors ${isSpeaking ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600 hover:bg-blue-50'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            </button>
          </div>
          <div className="prose prose-blue prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed mb-6">
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

export default DrugIdentifier;
