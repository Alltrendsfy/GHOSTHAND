import React from 'react';
import { HUDState } from '../types';

interface SmartHUDProps {
  status: HUDState;
  volume: number;
  onConnect: () => void;
  isConnected: boolean;
  options: string[] | null;
}

const SmartHUD: React.FC<SmartHUDProps> = ({ status, volume, onConnect, isConnected, options }) => {
  
  // Dynamic color based on status
  const getStatusColor = () => {
    switch (status) {
      case HUDState.LISTENING: return 'border-ghost-green shadow-[0_0_25px_rgba(0,255,157,0.4)]';
      case HUDState.SPEAKING: return 'border-ghost-blue shadow-[0_0_25px_rgba(0,210,255,0.4)]';
      case HUDState.THINKING: return 'border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.4)]';
      case HUDState.ERROR: return 'border-ghost-red shadow-[0_0_25px_rgba(255,77,77,0.4)]';
      default: return 'border-ghost-dim/50';
    }
  };

  const getStatusText = () => {
     switch (status) {
      case HUDState.LISTENING: return 'Ouvindo...';
      case HUDState.SPEAKING: return 'GhostHand Falando...';
      case HUDState.THINKING: return 'Processando...';
      case HUDState.ERROR: return 'Erro de Conexão';
      default: return 'Standby';
    }
  };

  // Generate bars for audio viz
  const bars = Array.from({ length: 16 }).map((_, i) => {
    const heightMod = Math.sin(i * 0.5) * 0.5 + 1; 
    let h = 4;
    if (status === HUDState.LISTENING || status === HUDState.SPEAKING) {
       h = Math.min(32, Math.max(4, volume * 40 * heightMod));
    }
    
    let bg = 'bg-ghost-dim/50';
    if (status === HUDState.LISTENING) bg = 'bg-ghost-green';
    if (status === HUDState.SPEAKING) bg = 'bg-ghost-blue';
    if (status === HUDState.THINKING) bg = 'bg-purple-500 animate-pulse';

    return (
      <div 
        key={i} 
        className={`w-1 rounded-full transition-all duration-75 ${bg}`}
        style={{ height: `${h}px` }}
      />
    );
  });

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 w-full max-w-lg pointer-events-none">
      
      {/* The Bar */}
      <div className={`
        relative flex items-center gap-4 px-6 py-3 
        bg-ghost-900/80 backdrop-blur-xl rounded-full 
        border ${getStatusColor()} 
        transition-all duration-300 pointer-events-auto
        z-20
      `}>
        
        {/* Status Indicator / Connect Button */}
        <button 
          onClick={onConnect}
          disabled={isConnected}
          className={`
            w-3 h-3 rounded-full 
            ${isConnected ? (status === HUDState.LISTENING ? 'bg-ghost-green animate-pulse' : 'bg-ghost-blue') : 'bg-ghost-red cursor-pointer hover:scale-125'}
            transition-all duration-300
          `}
        />

        {/* Audio Visualizer */}
        <div className="flex items-center gap-1 h-8 w-40 justify-center">
          {bars}
        </div>

        {/* Text Status */}
        <span className="text-xs font-mono font-bold text-ghost-text uppercase tracking-widest w-32 text-right">
          {getStatusText()}
        </span>
      </div>

      {/* Visual Cards (Expansion) */}
      <div className={`
        flex gap-3 transition-all duration-500 ease-out origin-top w-full justify-center
        ${options ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}
      `}>
        {options && options.map((opt, idx) => (
          <div 
            key={idx}
            className="bg-ghost-800/90 backdrop-blur-md border border-ghost-dim/30 rounded-lg p-3 w-1/3 shadow-xl transform transition-transform hover:scale-105"
          >
            <div className="text-[10px] text-ghost-dim mb-1 font-mono uppercase tracking-wider">Opção {idx + 1}</div>
            <div className="text-sm text-ghost-text font-medium leading-tight">{opt}</div>
          </div>
        ))}
      </div>

      {!isConnected && (
         <div className="text-ghost-dim text-xs font-mono bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/5">
            Clique no ponto vermelho para iniciar
         </div>
      )}
    </div>
  );
};

export default SmartHUD;