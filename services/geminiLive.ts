import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { createPcmBlob, decodeBase64, decodeAudioData } from '../utils/audioUtils';
import { HUDState } from '../types';

// --- Tool Definitions ---

const writeCodeDeclaration: FunctionDeclaration = {
  name: 'writeCode',
  description: 'Escreve ou atualiza código no editor. Use quando o usuário pedir para criar funções, scripts ou classes.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      language: { type: Type.STRING, description: 'Linguagem de programação (python, javascript, etc.)' },
      code: { type: Type.STRING, description: 'O conteúdo do código' },
      filename: { type: Type.STRING, description: 'Nome do arquivo sugerido' }
    },
    required: ['language', 'code']
  }
};

const organizeWindowsDeclaration: FunctionDeclaration = {
  name: 'organizeWindows',
  description: 'Organiza o layout das janelas na área de trabalho.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      layout: { 
        type: Type.STRING, 
        enum: ['SPLIT_H', 'SPLIT_V', 'SINGLE_FULL'],
        description: 'A configuração de layout desejada.'
      },
      showBrowser: { type: Type.BOOLEAN },
      showCode: { type: Type.BOOLEAN }
    },
    required: ['layout']
  }
};

const navigateBrowserDeclaration: FunctionDeclaration = {
  name: 'navigateBrowser',
  description: 'Navega no browser simulado para uma URL específica.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: { type: Type.STRING, description: 'A URL para visitar' }
    },
    required: ['url']
  }
};

const controlBrowserViewDeclaration: FunctionDeclaration = {
  name: 'controlBrowserView',
  description: 'Controla a visualização da página web (Zoom e Scroll). Use para "descer a página", "subir", "aumentar zoom/letra", "diminuir zoom".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { 
        type: Type.STRING, 
        enum: ['scroll_down', 'scroll_up', 'scroll_top', 'scroll_bottom', 'zoom_in', 'zoom_out', 'zoom_reset'],
        description: 'A ação de visualização a ser realizada.'
      }
    },
    required: ['action']
  }
};

const toggleGridDeclaration: FunctionDeclaration = {
  name: 'toggleGrid',
  description: 'Ativa ou desativa a grade numérica do mouse (Mouse Grid) para controle preciso.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      active: { type: Type.BOOLEAN, description: 'True para ligar, False para desligar' }
    },
    required: ['active']
  }
};

const suggestOptionsDeclaration: FunctionDeclaration = {
  name: 'suggestOptions',
  description: 'Apresenta visualmente até 3 opções para o usuário escolher quando o pedido for ambíguo.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: 'Lista de 2 a 3 textos curtos descrevendo as opções.' 
      }
    },
    required: ['options']
  }
};

// New Tools

const searchWebDeclaration: FunctionDeclaration = {
  name: 'searchWeb',
  description: 'Pesquisa informações atualizadas na internet (Google Search) sobre eventos recentes, documentação, notícias, etc.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'O termo de busca' }
    },
    required: ['query']
  }
};

const searchMapsDeclaration: FunctionDeclaration = {
  name: 'searchMaps',
  description: 'Pesquisa locais, restaurantes ou informações geográficas no Google Maps.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'O que procurar no mapa' }
    },
    required: ['query']
  }
};

const analyzeFileDeclaration: FunctionDeclaration = {
  name: 'analyzeFile',
  description: 'Analisa o arquivo ou imagem que o usuário fez upload. Use isso se o usuário perguntar "O que é isso?" ou "Analise esta imagem".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: 'Pergunta específica sobre o arquivo, se houver.' }
    },
  }
};

const generateMediaDeclaration: FunctionDeclaration = {
  name: 'generateMedia',
  description: 'Gera vídeos (Veo) ou edita imagens (Flash Image). Use para criar conteúdo visual.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskType: { type: Type.STRING, enum: ['VIDEO_GENERATION', 'IMAGE_EDIT'], description: 'Tipo de tarefa' },
      prompt: { type: Type.STRING, description: 'Descrição do vídeo ou instruções de edição da imagem.' }
    },
    required: ['taskType', 'prompt']
  }
};

const executeSystemCommandDeclaration: FunctionDeclaration = {
  name: 'executeSystemCommand',
  description: 'Simula a execução de um comando do sistema operacional (como abrir aplicativos externos, word, calculadora, configurações).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      command: { type: Type.STRING, description: 'O comando ou nome do aplicativo (ex: "Abrir Word", "Calculadora")' }
    },
    required: ['command']
  }
};

const tools = [
  writeCodeDeclaration, 
  organizeWindowsDeclaration, 
  navigateBrowserDeclaration,
  controlBrowserViewDeclaration,
  toggleGridDeclaration,
  suggestOptionsDeclaration,
  searchWebDeclaration,
  searchMapsDeclaration,
  analyzeFileDeclaration,
  generateMediaDeclaration,
  executeSystemCommandDeclaration
];

// --- Service Class ---

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  
  // Callbacks
  private onStatusChange: (status: HUDState) => void;
  private onVolumeChange: (vol: number) => void;
  private onToolCall: (name: string, args: any) => Promise<any>;

  constructor(
    apiKey: string,
    onStatusChange: (status: HUDState) => void,
    onVolumeChange: (vol: number) => void,
    onToolCall: (name: string, args: any) => Promise<any>
  ) {
    this.ai = new GoogleGenAI({ apiKey });
    this.onStatusChange = onStatusChange;
    this.onVolumeChange = onVolumeChange;
    this.onToolCall = onToolCall;
  }

  async connect() {
    this.onStatusChange(HUDState.STANDBY);

    try {
      this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          channelCount: 1, 
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `Você é o Project GhostHand, um assistente de acessibilidade "invisível" altamente capaz.
          
          CAPACIDADES NOVAS (Use as ferramentas):
          1. **Internet:** Use 'searchWeb' para notícias, docs e fatos recentes.
          2. **Mapas:** Use 'searchMaps' para locais e geografia.
          3. **Visão:** Se o usuário falar sobre uma imagem enviada ("Olhe isso", "Analise"), use 'analyzeFile'.
          4. **Navegação Web Avançada:** Use 'controlBrowserView' para rolar (scroll) a página ou dar zoom.
          5. **Criação de Mídia:** 
             - Se pedirem um vídeo: use 'generateMedia' com taskType='VIDEO_GENERATION'.
             - Se pedirem para editar a imagem enviada (ex: "Adicione filtro retro"): use 'generateMedia' com taskType='IMAGE_EDIT'.
          6. **Comandos OS:** Se pedirem para abrir programas externos (Word, Excel, Calculadora) que não estão no mock, use 'executeSystemCommand'.

          Persona:
          - Profissional, direto e eficiente.
          - Fala pouco, faz muito.
          - Responda e interaja sempre em PORTUGUÊS DO BRASIL.
          
          Diretrizes de Ação:
          1. **Código:** Se o usuário pedir código, use 'writeCode'.
          2. **Navegação:** Se o usuário quiser ver sites ou docs, use 'navigateBrowser'.
          3. **Mouse/Precisão:** Se o usuário disser "Mouse", "Grade", ative o 'toggleGrid'.
          4. **Ambiguidade:** Use 'suggestOptions' se precisar esclarecer.
          5. **Janelas:** Use 'organizeWindows' para arrumar o espaço.

          Mantenha a conversa focada.`,
          tools: [{ functionDeclarations: tools }],
        },
        callbacks: {
          onopen: () => {
            this.onStatusChange(HUDState.LISTENING);
            this.startAudioInput(stream);
          },
          onmessage: (msg: LiveServerMessage) => this.handleMessage(msg),
          onclose: () => {
            this.onStatusChange(HUDState.STANDBY);
          },
          onerror: (err) => {
            console.error(err);
            this.onStatusChange(HUDState.ERROR);
          }
        }
      });
    } catch (error) {
      console.error("Connection failed", error);
      this.onStatusChange(HUDState.ERROR);
    }
  }

  private startAudioInput(stream: MediaStream) {
    if (!this.inputContext) return;

    const source = this.inputContext.createMediaStreamSource(stream);
    const analyzer = this.inputContext.createAnalyser();
    analyzer.fftSize = 256;
    
    // Processor for handling raw audio chunks
    const processor = this.inputContext.createScriptProcessor(4096, 1, 1);
    
    source.connect(analyzer);
    analyzer.connect(processor);
    processor.connect(this.inputContext.destination);

    const dataArray = new Uint8Array(analyzer.frequencyBinCount);

    processor.onaudioprocess = (e) => {
      // 1. Send Audio to Gemini
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);
      
      if (this.sessionPromise) {
        this.sessionPromise.then((session) => {
           session.sendRealtimeInput({ media: pcmBlob });
        });
      }

      // 2. Visualize Volume
      analyzer.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      this.onVolumeChange(average / 128.0); // Normalize 0-2ish
    };
  }

  private async handleMessage(message: LiveServerMessage) {
    // Handle Audio Output
    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (audioData) {
      this.onStatusChange(HUDState.SPEAKING);
      await this.playAudio(audioData);
    }

    // Handle Tool Calls
    const toolCall = message.toolCall;
    if (toolCall) {
      this.onStatusChange(HUDState.THINKING);
      for (const fc of toolCall.functionCalls) {
         try {
           const result = await this.onToolCall(fc.name, fc.args);
           
           // Send response back
           this.sessionPromise?.then(session => {
             session.sendToolResponse({
               functionResponses: {
                 id: fc.id,
                 name: fc.name,
                 response: { result: result || "Ação completada com sucesso." }
               }
             });
           });
         } catch (e) {
            console.error("Tool execution failed", e);
            // Send error back so the model knows it failed
            this.sessionPromise?.then(session => {
             session.sendToolResponse({
               functionResponses: {
                 id: fc.id,
                 name: fc.name,
                 response: { result: "Erro ao executar a ferramenta: " + e }
               }
             });
           });
         }
      }
    }

    if (message.serverContent?.turnComplete) {
       // Turn is done, revert to listening if not speaking
       if (!audioData) {
         this.onStatusChange(HUDState.LISTENING);
       }
    }
  }

  private async playAudio(base64Data: string) {
    if (!this.outputContext) return;

    this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
    
    const audioBuffer = await decodeAudioData(
      decodeBase64(base64Data), 
      this.outputContext, 
      24000
    );

    const source = this.outputContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputContext.destination);
    
    source.addEventListener('ended', () => {
      this.sources.delete(source);
      if (this.sources.size === 0) {
        this.onStatusChange(HUDState.LISTENING);
      }
    });

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.sources.add(source);
  }

  disconnect() {
    this.sessionPromise?.then(session => session.close());
    this.inputContext?.close();
    this.outputContext?.close();
    this.sessionPromise = null;
    this.inputContext = null;
    this.outputContext = null;
  }
}