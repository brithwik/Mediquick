
import React, { useState } from 'react';
import { AppTab } from './types';
import HealthAdvisor from './components/HealthAdvisor';
import DrugIdentifier from './components/DrugIdentifier';
import OverdoseChecker from './components/OverdoseChecker';
import VoiceAssistant from './components/VoiceAssistant';
import NearbyCare from './components/NearbyCare';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.ADVISOR);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.ADVISOR: return <HealthAdvisor />;
      case AppTab.DRUG_ID: return <DrugIdentifier />;
      case AppTab.OVERDOSE: return <OverdoseChecker />;
      case AppTab.VOICE: return <VoiceAssistant />;
      case AppTab.NEARBY_CARE: return <NearbyCare />;
      default: return <HealthAdvisor />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-xl flex items-center justify-center text-white shadow-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-none">HealthGenius</h1>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Medical AI System</span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
             <div className="flex items-center bg-slate-100 rounded-full px-3 py-1 border border-slate-200">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
               <span className="text-[10px] font-bold text-slate-600 uppercase">Decision Engine Online</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full px-4 py-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar / Navigation */}
          <nav className="lg:col-span-3 space-y-2">
            <NavItem 
              active={activeTab === AppTab.ADVISOR} 
              onClick={() => setActiveTab(AppTab.ADVISOR)}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              label="Diagnosis Advisor"
            />
            <NavItem 
              active={activeTab === AppTab.DRUG_ID} 
              onClick={() => setActiveTab(AppTab.DRUG_ID)}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.641.32a2 2 0 01-1.836 0l-.64-.32a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547l-.372.372a2 2 0 000 2.828l.372.372a2 2 0 001.022.547l2.387.477a6 6 0 003.86-.517l.641-.32a2 2 0 011.836 0l.64.32a6 6 0 003.86.517l2.387-.477a2 2 0 001.022-.547l.372-.372a2 2 0 000-2.828l-.372-.372z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              label="Drug Identifier"
            />
            <NavItem 
              active={activeTab === AppTab.OVERDOSE} 
              onClick={() => setActiveTab(AppTab.OVERDOSE)}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
              label="Overdose Check"
            />
            <NavItem 
              active={activeTab === AppTab.VOICE} 
              onClick={() => setActiveTab(AppTab.VOICE)}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
              label="Live Voice Assist"
            />
            <NavItem 
              active={activeTab === AppTab.NEARBY_CARE} 
              onClick={() => setActiveTab(AppTab.NEARBY_CARE)}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              label="Nearby Care"
            />

            <div className="mt-8 p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
               <h4 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-2 flex items-center">
                 <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                 AI Ethics Guard
               </h4>
               <p className="text-[10px] leading-relaxed text-slate-500">Decisions are cross-referenced with latest peer-reviewed protocols but should always be verified by medical professionals.</p>
            </div>
          </nav>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            {renderContent()}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-slate-400 text-xs">
          <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
            <p className="font-bold text-slate-600 mb-1">HealthGenius Decision Support System v2.1</p>
            <p>© 2024 Optimized with Gemini Reasoning.</p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-blue-600 transition-colors font-medium">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors font-medium">Data Safety</a>
            <a href="#" className="hover:text-red-500 transition-colors font-bold">Emergency Protocol</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
      active 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-600/10' 
      : 'text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-sm'
    }`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {icon}
    </div>
    <span className={`font-bold text-sm tracking-tight ${active ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
  </button>
);

export default App;
