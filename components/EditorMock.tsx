import React from 'react';
import { CodeFile } from '../types';

interface EditorMockProps {
  file: CodeFile | null;
  visible: boolean;
}

const EditorMock: React.FC<EditorMockProps> = ({ file, visible }) => {
  if (!visible) return null;

  const code = file?.content || "# Waiting for instructions...\n# Say 'Create a python function to...'";
  const lines = code.split('\n').map((line, i) => (
    <div key={i} className="flex">
      <span className="w-8 text-right mr-4 text-ghost-dim select-none">{i + 1}</span>
      <span className="text-ghost-text whitespace-pre-wrap font-mono">{line}</span>
    </div>
  ));

  return (
    <div className="h-full w-full bg-ghost-900 border border-ghost-700 rounded-lg overflow-hidden flex flex-col shadow-2xl">
      {/* Tab Bar */}
      <div className="bg-ghost-800 border-b border-ghost-700 px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
           <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
           <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
           <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
        </div>
        <div className="ml-4 px-3 py-1 bg-ghost-700 rounded text-xs text-ghost-text font-mono flex items-center gap-2">
          {file?.filename || 'untitled'}
        </div>
      </div>
      
      {/* Code Area */}
      <div className="flex-1 p-4 overflow-auto bg-[#0d0d0d]">
        <div className="text-sm font-mono leading-relaxed">
          {lines}
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="bg-ghost-blue/10 border-t border-ghost-blue/20 px-3 py-1 text-[10px] text-ghost-blue font-mono flex justify-between">
        <span>GHOSTHAND CONNECTED</span>
        <span>{file?.language.toUpperCase() || 'TEXT'}</span>
      </div>
    </div>
  );
};

export default EditorMock;
