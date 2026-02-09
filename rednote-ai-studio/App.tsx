import React, { useState } from 'react';
import { AppMode } from './types';
import { PromptGenerator } from './components/PromptGenerator';
import { ViralAnalyzer } from './components/ViralAnalyzer';
import { PenTool, BarChart2 } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.GENERATOR);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-rednote-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">R</div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">红薯 AI Studio</h1>
          </div>
          
          <nav className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setMode(AppMode.GENERATOR)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === AppMode.GENERATOR
                  ? 'bg-white text-rednote-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <PenTool size={16} />
              <span>创作助手</span>
            </button>
            <button
              onClick={() => setMode(AppMode.ANALYZER)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === AppMode.ANALYZER
                  ? 'bg-white text-rednote-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <BarChart2 size={16} />
              <span>爆款分析</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8">
        {/* Use CSS visibility toggling instead of conditional rendering to persist state */}
        <div className={mode === AppMode.GENERATOR ? 'block' : 'hidden'}>
          <PromptGenerator />
        </div>
        <div className={mode === AppMode.ANALYZER ? 'block' : 'hidden'}>
          <ViralAnalyzer />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} 红薯 AI Studio. Powered by Gemini.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;