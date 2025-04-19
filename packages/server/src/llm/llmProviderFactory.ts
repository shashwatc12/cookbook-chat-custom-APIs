import { LlmProvider, LlmProviderConfig } from "./llmProviderInterface";
import { OllamaProvider } from "./providers/ollamaProvider";
import { GeminiProvider } from "./providers/geminiProvider";

// Map of provider names to provider implementations
const providers: Record<string, LlmProvider> = {
  ollama: new OllamaProvider(),
  gemini: new GeminiProvider(),
  // Add more providers here as they are implemented
};

/**
 * Get an LLM provider by name
 * @param providerName The name of the provider to get
 * @returns The provider instance
 * @throws Error if the provider is not found
 */
export function getLlmProvider(providerName: string): LlmProvider {
  const provider = providers[providerName.toLowerCase()];
  if (!provider) {
    throw new Error(`LLM provider '${providerName}' not found. Available providers: ${Object.keys(providers).join(", ")}`);
  }
  return provider;
}

/**
 * Get all available LLM providers
 * @returns A record of provider names to provider instances
 */
export function getAllLlmProviders(): Record<string, LlmProvider> {
  return { ...providers };
}

/**
 * Create a chat LLM instance for the specified provider
 * @param providerName The name of the provider to use
 * @param config The provider configuration
 * @returns A ChatLlm instance
 */
export function createChatLlm(providerName: string, config: LlmProviderConfig) {
  const provider = getLlmProvider(providerName);
  return provider.createChatLlm(config);
}

/**
 * Create an embedder instance for the specified provider
 * @param providerName The name of the provider to use
 * @param config The provider configuration
 * @returns An Embedder instance
 */
export function createEmbedder(providerName: string, config: LlmProviderConfig) {
  const provider = getLlmProvider(providerName);
  return provider.createEmbedder(config);
}
