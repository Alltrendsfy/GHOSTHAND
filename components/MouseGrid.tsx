import React from 'react';

interface MouseGridProps {
  visible: boolean;
}

const MouseGrid: React.FC<MouseGridProps> = ({ visible }) => {
  if (!visible) return null;

  // Create a 3x3 grid
  const cells = Array.from({ length: 9 }).map((_, i) => (
    <div 
      key={i} 
      className="relative border border-ghost-red/30 flex items-center justify-center group hover:bg-ghost-red/10 transition-colors"
    >
      <span className="text-4xl font-mono font-bold text-ghost-red opacity-50 group-hover:opacity-100">
        {i + 1}
      </span>
      {/* Sub-grid lines for decorative purpose */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
         <div className="border-r border-b border-ghost-red/10"></div>
         <div className="border-b border-ghost-red/10"></div>
         <div className="border-r border-ghost-red/10"></div>
         <div></div>
      </div>
    </div>
  ));

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 bg-black/10 backdrop-blur-[1px]">
        {cells}
      </div>
      <div className="absolute top-4 right-4 bg-ghost-red text-black text-xs font-bold px-2 py-1 rounded">
        GRID ATIVO
      </div>
    </div>
  );
};

export default MouseGrid;