import React, { useEffect, useRef } from 'react';
import { ScrollCommand } from '../types';

interface BrowserMockProps {
  url: string | null;
  visible: boolean;
  zoom: number;
  scrollCommand: ScrollCommand | null;
}

const BrowserMock: React.FC<BrowserMockProps> = ({ url, visible, zoom, scrollCommand }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle scroll commands
  useEffect(() => {
    if (!contentRef.current || !scrollCommand) return;

    const el = contentRef.current;
    const amount = 300; // pixels to scroll

    switch (scrollCommand.action) {
      case 'scroll_down':
        el.scrollBy({ top: amount, behavior: 'smooth' });
        break;
      case 'scroll_up':
        el.scrollBy({ top: -amount, behavior: 'smooth' });
        break;
      case 'scroll_top':
        el.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'scroll_bottom':
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        break;
    }
  }, [scrollCommand]);

  if (!visible) return null;

  return (
    <div className="h-full w-full bg-white rounded-lg overflow-hidden flex flex-col shadow-2xl transition-all duration-300">
      {/* Browser Chrome */}
      <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 flex items-center gap-3 shrink-0">
         <div className="flex gap-1">
           <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
           <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
           <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
        </div>
        
        {/* Address Bar */}
        <div className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-1 text-xs text-gray-600 font-sans truncate shadow-sm flex justify-between items-center">
          <span>{url || 'about:blank'}</span>
          {zoom !== 1.0 && (
             <span className="bg-blue-100 text-blue-700 px-1.5 rounded text-[10px] font-bold">
               {Math.round(zoom * 100)}%
             </span>
          )}
        </div>
      </div>

      {/* Content Area with Zoom */}
      <div 
        ref={contentRef}
        className="flex-1 bg-white overflow-auto relative scroll-smooth"
      >
        <div 
          className="p-8 origin-top-left transition-transform duration-300 ease-out"
          style={{ 
            transform: `scale(${zoom})`,
            width: `${100 / zoom}%`, // Compensate width so content doesn't shrink horizontally into a column
            minHeight: '100%'
          }}
        >
          <div className="max-w-3xl mx-auto space-y-8">
             {/* Header Section */}
             <div className="space-y-4">
                <div className="h-10 w-3/4 bg-gray-800 rounded animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="h-3 w-20 bg-blue-500 rounded-full"></div>
                  <div className="h-3 w-20 bg-gray-300 rounded-full"></div>
                </div>
             </div>

             {/* Text Block */}
             <div className="space-y-3">
               <div className="h-4 w-full bg-gray-200 rounded"></div>
               <div className="h-4 w-[95%] bg-gray-200 rounded"></div>
               <div className="h-4 w-[90%] bg-gray-200 rounded"></div>
               <div className="h-4 w-[92%] bg-gray-200 rounded"></div>
             </div>
             
             {/* Feature Box */}
             <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
               <h3 className="text-blue-900 font-bold text-xl mb-3">Documentation & Features</h3>
               <p className="text-blue-700 leading-relaxed">
                 GhostHand simulated browser environment. 
                 <br/><br/>
                 Try saying:
                 <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>"Zoom in on the page"</li>
                    <li>"Scroll down to the bottom"</li>
                    <li>"Reset zoom"</li>
                 </ul>
               </p>
             </div>

             {/* Images Grid (Mock) */}
             <div className="grid grid-cols-2 gap-6">
                <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg"></div>
                <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg"></div>
             </div>

             {/* More Content to enable scrolling */}
             <div className="space-y-3 pt-4">
               <div className="h-4 w-full bg-gray-200 rounded"></div>
               <div className="h-4 w-[85%] bg-gray-200 rounded"></div>
               <div className="h-4 w-[95%] bg-gray-200 rounded"></div>
               <div className="h-4 w-[75%] bg-gray-200 rounded"></div>
             </div>
             
             <div className="space-y-3 pt-4">
               <div className="h-4 w-full bg-gray-200 rounded"></div>
               <div className="h-4 w-full bg-gray-200 rounded"></div>
               <div className="h-4 w-[90%] bg-gray-200 rounded"></div>
             </div>

             <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                Footer Content
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserMock;