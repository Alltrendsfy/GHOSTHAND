export enum HUDState {
  STANDBY = 'STANDBY',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR'
}

export enum LayoutMode {
  SINGLE_FULL = 'SINGLE_FULL',
  SPLIT_H = 'SPLIT_H',
  SPLIT_V = 'SPLIT_V'
}

export interface CodeFile {
  filename: string;
  language: string;
  content: string;
}

export interface MediaContent {
  type: 'image' | 'video';
  url: string;
  mimeType: string;
  description?: string;
}

export interface ScrollCommand {
  action: 'scroll_down' | 'scroll_up' | 'scroll_top' | 'scroll_bottom';
  id: number; // To trigger useEffect
}

export interface AppState {
  layout: LayoutMode;
  codeFile: CodeFile | null;
  browserUrl: string | null;
  browserZoom: number; // 1.0 is 100%
  scrollCommand: ScrollCommand | null;
  isBrowserVisible: boolean;
  isCodeVisible: boolean;
  isGridVisible: boolean;
  cardOptions: string[] | null; // For disambiguation cards
  logMessages: string[]; // For debugging/history
  uploadedFile: { base64: string, mimeType: string } | null;
  generatedMedia: MediaContent | null;
}

export interface GhostHandContextType {
  state: AppState;
  hudState: HUDState;
  volumeLevel: number; // 0.0 to 1.0 for visualization
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}