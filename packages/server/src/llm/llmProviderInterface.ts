import { ChatLlm } from "mongodb-chatbot-server";
import { Embedder } from "mongodb-rag-core";

/**
 * Interface for LLM provider configuration
 */
export interface LlmProviderConfig {
  // Common configuration options
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  embeddingModel?: string;
  timeout?: number;
  
  // Provider-specific options can be added by providers
  [key: string]: any;
}

/**
 * Interface for LLM provider capabilities
 */
export interface LlmProvider {
  /**
   * Create a chat LLM instance for this provider
   */
  createChatLlm(config: LlmProviderConfig): ChatLlm;
  
  /**
   * Create an embedder instance for this provider
   */
  createEmbedder(config: LlmProviderConfig): Embedder;
  
  /**
   * Get the name of this provider
   */
  getName(): string;
  
  /**
   * Check if this provider requires an API key
   */
  requiresApiKey(): boolean;
}
