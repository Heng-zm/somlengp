export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIAssistantConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topK?: number;
  topP?: number;
}

export interface AIResponse {
  success: boolean;
  response: string;
  model: string;
  timestamp: string;
  tokens?: number;
  error?: string;
}

export interface AIAssistantProps {
  initialMessages?: ChatMessage[];
  config?: Partial<AIAssistantConfig>;
  onMessageSent?: (message: ChatMessage) => void;
  onResponseReceived?: (response: ChatMessage) => void;
}

export const DEFAULT_AI_CONFIG: AIAssistantConfig = {
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  maxTokens: 2048,
  topK: 40,
  topP: 0.95,
};

export const SYSTEM_PROMPTS = {
  default: "You are a helpful AI assistant powered by Gemini 1.5 Flash. You are knowledgeable, friendly, and provide accurate information. Please be concise but thorough in your responses. If you're unsure about something, please say so rather than making assumptions.",
  creative: "You are a creative AI assistant that helps with writing, brainstorming, and creative projects. Be imaginative and inspiring while maintaining accuracy.",
  technical: "You are a technical AI assistant specialized in programming, software development, and technical problem-solving. Provide detailed, accurate technical guidance.",
  educational: "You are an educational AI assistant that helps explain complex topics in simple terms. Use examples and analogies to make concepts clear and engaging.",
};
