import React from 'react';
import { MediaContent } from '../types';

interface MediaViewerProps {
  uploadedFile: { base64: string, mimeType: string } | null;
  generatedMedia: MediaContent | null;
  onClose: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ uploadedFile, generatedMedia, onClose }) => {
  if (!uploadedFile && !generatedMedia) return null;

  return (
    <div className="absolute top-6 right-6 z-30 w-80 bg-ghost-900/90 backdrop-blur-xl border border-ghost-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
      <div className="bg-ghost-800 px-4 py-2 flex justify-between items-center border-b border-ghost-700">
        <span className="text-xs font-mono font-bold text-ghost-text">MEDIA PANEL</span>
        <button onClick={onClose} className="text-ghost-dim hover:text-white">&times;</button>
      </div>
      
      <div className="p-4 space-y-4">
        {uploadedFile && (
          <div>
            <div className="text-[10px] text-ghost-dim mb-1 font-mono uppercase">Upload</div>
            <img 
              src={`data:${uploadedFile.mimeType};base64,${uploadedFile.base64}`} 
              className="w-full rounded border border-ghost-dim/20 object-cover max-h-40"
              alt="User upload"
            />
          </div>
        )}

        {generatedMedia && (
          <div>
            <div className="text-[10px] text-ghost-blue mb-1 font-mono uppercase animate-pulse">
              {generatedMedia.type === 'video' ? 'Generated Video (Veo)' : 'Generated Image'}
            </div>
            
            {generatedMedia.type === 'video' ? (
              <video 
                src={generatedMedia.url} 
                controls 
                autoPlay 
                loop
                className="w-full rounded border border-ghost-blue/30"
              />
            ) : (
              <img 
                src={generatedMedia.url} 
                className="w-full rounded border border-ghost-blue/30"
                alt="Generated content"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaViewer;