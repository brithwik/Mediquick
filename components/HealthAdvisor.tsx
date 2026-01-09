
import React, { useState } from 'react';
import { analyzeSymptomsOrReports, generateSpeech, decodeBase64Audio, decodePCM } from '../services/geminiService';

const HealthAdvisor: React.FC = () => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result?.toString().split(',')[1] || null);
      reader.readAsDataURL(file);
    }
  };

  const playVoice = async (text: string) => {
    if (!text || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const audioData = await generateSpeech(text);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input && !image) return;
    
    setLoading(true);
    try {
      const res = await analyzeSymptomsOrReports(input || "Please analyze this health report.", image || undefined);
      setResult(res);
      if (autoSpeak) {
        playVoice(res.text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Health Decision Support</h2>
        <p className="text-slate-500 text-sm mb-6">Input symptoms or upload laboratory reports for a detailed AI assessment.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 'I have a sharp pain in my lower back' or 'Explain these blood test results...'"
            className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
          />
          
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex-grow min-w-[200px] flex items-center justify-center px-4 py-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-sm text-slate-600 font-medium">{image ? "Image Selected" : "Attach Reports/Photo"}</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>

            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <input 
                type="checkbox" 
                id="autoSpeak" 
                checked={autoSpeak} 
                onChange={(e) => setAutoSpeak(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="autoSpeak" className="text-sm text-slate-600 font-medium cursor-pointer flex items-center">
                <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                Read Results
              </label>
            </div>
            
            <button
              disabled={loading}
              type="submit"
              className="px-10 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
            >
              {loading ? "Analyzing..." : "Get Decision"}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            <button
              onClick={() => playVoice(result.text)}
              disabled={isSpeaking}
              className={`p-3 rounded-2xl shadow-sm transition-all ${isSpeaking ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-blue-50'}`}
              title="Speak result"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            </button>
          </div>
          
          <div className="max-w-none">
             <div className="flex items-center space-x-2 mb-6">
               <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
               <h3 className="text-2xl font-bold text-slate-800 tracking-tight">AI Decision Profile</h3>
             </div>

             <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-800 prose-headings:font-bold text-slate-700 whitespace-pre-wrap mb-8">
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
        </div>
      )}
    </div>
  );
};

export default HealthAdvisor;
