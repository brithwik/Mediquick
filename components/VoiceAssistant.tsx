
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { encodePCM, decodeBase64Audio, decodePCM } from '../services/geminiService';

const VoiceAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState<string>('');
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  const startSession = async () => {
    try {
      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Output Audio Context (24k for Gemini)
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Input Audio Context (16k for Gemini)
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are HealthGenius. Respond verbally to medical queries. Keep responses short (1-2 sentences). Listen carefully to the user and respond as soon as they stop speaking.',
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setStatus('listening');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmData = encodePCM(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: pcmData, mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            sessionRef.current = { stream, scriptProcessor, source, inputCtx };
          },
          onmessage: async (message) => {
            // Transcript management
            if (message.serverContent?.inputTranscription) {
              setTranscript(prev => `You: ${message.serverContent?.inputTranscription?.text}\n${prev}`);
            }
            if (message.serverContent?.outputTranscription) {
              setTranscript(prev => `AI: ${message.serverContent?.outputTranscription?.text}\n${prev}`);
            }

            // Audio Playback
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioCtxRef.current) {
              setStatus('speaking');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtxRef.current.currentTime);
              
              // Use renamed decodeBase64Audio utility
              const audioBuffer = await decodePCM(decodeBase64Audio(base64Audio), audioCtxRef.current, 24000, 1);
              const source = audioCtxRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioCtxRef.current.destination);
              
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setStatus('listening');
                }
              };
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }
          },
          onerror: (e) => {
            console.error('Live API Error:', e);
            setStatus('idle');
          },
          onclose: () => stopSession()
        }
      });

      setIsActive(true);
    } catch (err) {
      console.error('Failed to start session', err);
      setStatus('idle');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.stream.getTracks().forEach((track: any) => track.stop());
      sessionRef.current.scriptProcessor.disconnect();
      sessionRef.current.source.disconnect();
      sessionRef.current.inputCtx.close();
    }
    setIsActive(false);
    setStatus('idle');
    setTranscript('');
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-6 flex-grow min-h-[400px]">
        <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-blue-50/50 shadow-2xl' : 'bg-slate-50'}`}>
          {isActive && (
            <div className={`absolute inset-0 animate-ping rounded-full opacity-20 ${status === 'speaking' ? 'bg-blue-300' : 'bg-green-300'}`}></div>
          )}
          
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'speaking' ? 'bg-blue-600 scale-110' : status === 'listening' ? 'bg-green-500 scale-105 shadow-lg' : 'bg-slate-200'}`}>
            {isActive ? (
              <div className="flex items-end space-x-1.5 h-12">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div 
                    key={i} 
                    className={`w-2 bg-white rounded-full ${status !== 'idle' ? 'animate-bounce' : 'h-2'}`} 
                    style={{ 
                      height: `${status === 'speaking' ? 40 + (Math.sin(Date.now()/200 + i) * 30) : status === 'listening' ? 10 + (Math.random() * 20) : 8}%`, 
                      animationDelay: `${i * 0.1}s` 
                    }} 
                  />
                ))}
              </div>
            ) : (
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            )}
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {status === 'idle' && "Speak to HealthGenius"}
            {status === 'connecting' && "Connecting..."}
            {status === 'listening' && "HealthGenius is Listening..."}
            {status === 'speaking' && "HealthGenius is Responding..."}
          </h2>
          <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">Ask about symptoms, drugs, or medical reports naturally via voice.</p>
        </div>

        <button 
          onClick={isActive ? stopSession : startSession} 
          className={`px-12 py-4 rounded-full font-bold text-lg transition-all shadow-xl active:scale-95 ${isActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {isActive ? "Stop Interaction" : "Start Conversation"}
        </button>
      </div>

      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 h-48 overflow-y-auto shadow-inner">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 sticky top-0 bg-slate-900 py-1 border-b border-slate-800">Visual Transcription Feed</h3>
        <div className="text-sm font-medium text-blue-100/70 whitespace-pre-wrap leading-relaxed">
          {transcript || "Waiting for audio input..."}
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
