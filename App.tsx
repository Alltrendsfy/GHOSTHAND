import React, { useState, useCallback, useRef, useEffect } from 'react';
import SmartHUD from './components/SmartHUD';
import EditorMock from './components/EditorMock';
import BrowserMock from './components/BrowserMock';
import MouseGrid from './components/MouseGrid';
import MediaViewer from './components/MediaViewer';
import { GeminiLiveService } from './services/geminiLive';
import { searchWeb, searchMaps, analyzeImage, generateVideo, editImage } from './services/genAI';
import { HUDState, AppState, LayoutMode } from './types';

const INITIAL_STATE: AppState = {
  layout: LayoutMode.SINGLE_FULL,
  codeFile: null,
  browserUrl: 'https://docs.ghosthand.dev/intro',
  browserZoom: 1.0,
  scrollCommand: null,
  isBrowserVisible: false,
  isCodeVisible: true,
  isGridVisible: false,
  cardOptions: null,
  logMessages: ['Sistema inicializado. Aguardando comando...'],
  uploadedFile: null,
  generatedMedia: null
};

export default function App() {
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [hudState, setHudState] = useState<HUDState>(HUDState.STANDBY);
  const [volume, setVolume] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [systemNotification, setSystemNotification] = useState<string | null>(null);

  // Service ref to persist across renders
  const serviceRef = useRef<GeminiLiveService | null>(null);

  // Clear system notification after 3s
  useEffect(() => {
    if (systemNotification) {
      const timer = setTimeout(() => setSystemNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [systemNotification]);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setAppState(prev => ({
          ...prev,
          uploadedFile: { base64: base64String, mimeType: file.type },
          logMessages: [...prev.logMessages, `Arquivo carregado: ${file.name}`]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Tool Callbacks ---

  const handleWriteCode = async (args: any) => {
    setAppState(prev => ({
      ...prev,
      codeFile: {
        filename: args.filename || (prev.codeFile?.filename || 'script.py'),
        language: args.language,
        content: args.code
      },
      isCodeVisible: true,
      cardOptions: null, 
      logMessages: [...prev.logMessages, `Escrevendo código (${args.language})...`]
    }));
    return "Código escrito no editor.";
  };

  const handleOrganizeWindows = async (args: any) => {
    setAppState(prev => ({
      ...prev,
      layout: args.layout || LayoutMode.SPLIT_H,
      isBrowserVisible: args.showBrowser ?? true,
      isCodeVisible: args.showCode ?? true,
      cardOptions: null,
      logMessages: [...prev.logMessages, `Reorganizando workspace: ${args.layout}`]
    }));
    return "Workspace reorganizado.";
  };

  const handleNavigateBrowser = async (args: any) => {
    setAppState(prev => ({
      ...prev,
      browserUrl: args.url,
      isBrowserVisible: true,
      cardOptions: null,
      logMessages: [...prev.logMessages, `Navegando para ${args.url}`]
    }));
    return `Navegado para ${args.url}`;
  };

  const handleControlBrowserView = async (args: any) => {
    const action = args.action;
    setAppState(prev => {
      let newZoom = prev.browserZoom;
      let scrollCmd = prev.scrollCommand;
      let msg = '';

      switch (action) {
        case 'zoom_in':
          newZoom = Math.min(2.0, prev.browserZoom + 0.2);
          msg = `Zoom: ${Math.round(newZoom * 100)}%`;
          break;
        case 'zoom_out':
          newZoom = Math.max(0.5, prev.browserZoom - 0.2);
          msg = `Zoom: ${Math.round(newZoom * 100)}%`;
          break;
        case 'zoom_reset':
          newZoom = 1.0;
          msg = `Zoom resetado`;
          break;
        case 'scroll_down':
        case 'scroll_up':
        case 'scroll_top':
        case 'scroll_bottom':
          scrollCmd = { action: action, id: Date.now() };
          msg = `Rolando página (${action})`;
          break;
      }

      return {
        ...prev,
        browserZoom: newZoom,
        scrollCommand: scrollCmd,
        isBrowserVisible: true,
        logMessages: [...prev.logMessages, msg]
      };
    });
    return "Visualização do navegador atualizada.";
  };

  const handleToggleGrid = async (args: any) => {
    setAppState(prev => ({
      ...prev,
      isGridVisible: args.active,
      cardOptions: null,
      logMessages: [...prev.logMessages, `Mouse Grid: ${args.active ? 'ATIVO' : 'INATIVO'}`]
    }));
    return args.active ? "Grade ativada." : "Grade desativada.";
  };

  const handleSuggestOptions = async (args: any) => {
    setAppState(prev => ({
      ...prev,
      cardOptions: args.options,
      logMessages: [...prev.logMessages, `Sugerindo ${args.options.length} opções...`]
    }));
    return "Opções apresentadas ao usuário.";
  };

  const handleExecuteSystemCommand = async (args: any) => {
    setSystemNotification(`EXECUTANDO: ${args.command}`);
    setAppState(prev => ({
       ...prev, 
       logMessages: [...prev.logMessages, `OS Command: ${args.command}`]
    }));
    return `Comando de sistema "${args.command}" enviado para a bridge.`;
  };

  // New Capabilities Handlers

  const handleSearchWeb = async (args: any) => {
    const apiKey = process.env.API_KEY || '';
    setAppState(prev => ({ ...prev, logMessages: [...prev.logMessages, `Pesquisando: ${args.query}`] }));
    const result = await searchWeb(apiKey, args.query);
    return result;
  };

  const handleSearchMaps = async (args: any) => {
    const apiKey = process.env.API_KEY || '';
    setAppState(prev => ({ ...prev, logMessages: [...prev.logMessages, `Mapas: ${args.query}`] }));
    const result = await searchMaps(apiKey, args.query);
    return result;
  };

  const handleAnalyzeFile = async (args: any) => {
    if (!appState.uploadedFile) return "Nenhum arquivo foi enviado pelo usuário.";
    const apiKey = process.env.API_KEY || '';
    
    setAppState(prev => ({ ...prev, logMessages: [...prev.logMessages, `Analisando imagem com Gemini 3 Pro...`] }));
    const result = await analyzeImage(apiKey, appState.uploadedFile.base64, appState.uploadedFile.mimeType, args.prompt);
    return result;
  };

  const handleGenerateMedia = async (args: any) => {
    const apiKey = process.env.API_KEY || '';
    const task = args.taskType;
    const prompt = args.prompt;

    try {
      if (task === 'VIDEO_GENERATION') {
        setAppState(prev => ({ ...prev, logMessages: [...prev.logMessages, `Gerando Vídeo Veo... (Isso pode demorar)`] }));
        
        // Pass uploaded image if available for image-to-video
        const videoUri = await generateVideo(
          apiKey, 
          prompt, 
          appState.uploadedFile?.base64, 
          appState.uploadedFile?.mimeType
        );

        // Append key for fetching
        const fullUrl = `${videoUri}&key=${apiKey}`;
        
        setAppState(prev => ({
          ...prev,
          generatedMedia: { type: 'video', url: fullUrl, mimeType: 'video/mp4' },
          logMessages: [...prev.logMessages, `Vídeo Veo gerado!`]
        }));
        return "Vídeo gerado com sucesso e exibido na tela.";

      } else if (task === 'IMAGE_EDIT') {
        if (!appState.uploadedFile) return "Preciso de uma imagem enviada para editar.";
        
        setAppState(prev => ({ ...prev, logMessages: [...prev.logMessages, `Editando imagem...`] }));
        const newImageBase64 = await editImage(apiKey, appState.uploadedFile.base64, appState.uploadedFile.mimeType, prompt);
        
        setAppState(prev => ({
          ...prev,
          generatedMedia: { type: 'image', url: `data:image/png;base64,${newImageBase64}`, mimeType: 'image/png' },
          logMessages: [...prev.logMessages, `Imagem editada!`]
        }));
        return "Imagem editada e exibida na tela.";
      }
    } catch (e) {
      return "Ocorreu um erro ao gerar a mídia. Verifique se a chave API tem permissões.";
    }
    return "Tarefa desconhecida.";
  };

  // --- Connection Logic ---

  const handleConnect = useCallback(async () => {
    if (isConnected) return;

    // Use environment variable for key
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      alert("API_KEY not found in environment.");
      return;
    }

    const service = new GeminiLiveService(
      apiKey,
      (status) => setHudState(status),
      (vol) => setVolume(vol),
      async (name, args) => {
        // Dispatch tool calls
        switch (name) {
          case 'writeCode': return handleWriteCode(args);
          case 'organizeWindows': return handleOrganizeWindows(args);
          case 'navigateBrowser': return handleNavigateBrowser(args);
          case 'controlBrowserView': return handleControlBrowserView(args);
          case 'toggleGrid': return handleToggleGrid(args);
          case 'suggestOptions': return handleSuggestOptions(args);
          case 'executeSystemCommand': return handleExecuteSystemCommand(args);
          case 'searchWeb': return handleSearchWeb(args);
          case 'searchMaps': return handleSearchMaps(args);
          case 'analyzeFile': return handleAnalyzeFile(args);
          case 'generateMedia': return handleGenerateMedia(args);
          default: return "Unknown tool";
        }
      }
    );

    serviceRef.current = service;
    await service.connect();
    setIsConnected(true);
  }, [isConnected, appState.uploadedFile]); 


  // --- Layout Helpers ---

  const getContainerClass = () => {
    const { layout, isBrowserVisible, isCodeVisible } = appState;
    if (!isBrowserVisible && !isCodeVisible) return 'hidden';
    if (isBrowserVisible && isCodeVisible) {
      return layout === LayoutMode.SPLIT_V ? 'flex-col' : 'flex-row';
    }
    return 'flex-row'; // Default if only one is visible
  };

  return (
    <div className="w-screen h-screen bg-[#050505] relative overflow-hidden flex flex-col font-sans selection:bg-ghost-green/30">
      
      {/* Background Grid Effect */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }} 
      />

      {/* OS System Notification Overlay */}
      {systemNotification && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 animate-pulse-fast">
          <div className="bg-ghost-900/90 border border-ghost-green/50 px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(0,255,157,0.2)] backdrop-blur-xl flex items-center gap-4">
             <div className="w-3 h-3 bg-ghost-green rounded-full animate-ping"></div>
             <span className="text-ghost-green font-mono font-bold tracking-widest text-lg">{systemNotification}</span>
          </div>
        </div>
      )}

      {/* Mouse Grid Overlay */}
      <MouseGrid visible={appState.isGridVisible} />

      {/* Media Viewer Overlay */}
      <MediaViewer 
        uploadedFile={appState.uploadedFile} 
        generatedMedia={appState.generatedMedia}
        onClose={() => setAppState(prev => ({ ...prev, generatedMedia: null, uploadedFile: null }))} 
      />

      {/* Upload Button */}
      <div className="absolute top-6 left-6 z-30">
        <label className="cursor-pointer group flex items-center gap-2 px-3 py-2 bg-ghost-800/80 border border-ghost-dim/30 rounded-lg hover:border-ghost-green/50 hover:bg-ghost-700/80 transition-all">
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          <span className="text-ghost-dim group-hover:text-ghost-green material-icons text-sm font-mono">
            {appState.uploadedFile ? 'ARQUIVO_CARREGADO' : 'UPLOAD_ARQUIVO'}
          </span>
        </label>
      </div>

      {/* Main Workspace */}
      <div className={`relative z-10 flex-1 p-6 gap-6 flex ${getContainerClass()}`}>
        
        {/* Code Section */}
        {appState.isCodeVisible && (
          <div className={`transition-all duration-500 ease-in-out ${appState.isBrowserVisible ? 'flex-1' : 'w-full'}`}>
            <EditorMock file={appState.codeFile} visible={true} />
          </div>
        )}

        {/* Browser Section */}
        {appState.isBrowserVisible && (
          <div className={`transition-all duration-500 ease-in-out ${appState.isCodeVisible ? 'flex-1' : 'w-full'}`}>
            <BrowserMock 
              url={appState.browserUrl} 
              visible={true} 
              zoom={appState.browserZoom}
              scrollCommand={appState.scrollCommand}
            />
          </div>
        )}

      </div>

      {/* Logs Overlay (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-20 w-72 pointer-events-none">
        <div className="flex flex-col gap-1 items-start">
           {appState.logMessages.slice(-5).map((msg, i) => (
             <div key={i} className="text-[10px] text-ghost-dim font-mono bg-black/60 backdrop-blur-sm px-2 py-1 rounded-r border-l-2 border-ghost-dim shadow-lg animate-pulse-fast">
               {msg}
             </div>
           ))}
        </div>
      </div>

      {/* The GhostHand HUD */}
      <SmartHUD 
        status={hudState} 
        volume={volume} 
        onConnect={handleConnect}
        isConnected={isConnected}
        options={appState.cardOptions}
      />
      
    </div>
  );
}