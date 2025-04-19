# Changelog: Multi-Provider LLM Architecture

This document details the specific changes made to the original MongoDB Cookbook Chat repository to implement the multi-provider LLM architecture.

## New Files Added

### Provider Interface and Factory
- `packages/server/src/llm/llmProviderInterface.ts`: Defines the common interface for all LLM providers
- `packages/server/src/llm/llmProviderFactory.ts`: Implements the factory pattern for creating provider instances

### Provider Implementations
- `packages/server/src/llm/providers/ollamaProvider.ts`: Implementation for Ollama
- `packages/server/src/llm/providers/geminiProvider.ts`: Implementation for Google's Gemini

### Documentation
- `README-LLM-PROVIDERS.md`: Documentation for the multi-provider architecture
- `CHANGELOG-LLM-PROVIDERS.md`: This changelog file

## Modified Files

### Environment Configuration
- `cookbook-chat/.env`: Added new environment variables for provider selection and configuration
  - Added `LLM_PROVIDER` for selecting the active provider
  - Added Gemini-specific configuration variables
  - Added common LLM configuration variables

### Server Configuration
- `packages/server/src/loadEnvVars.ts`: Updated to support multiple providers
  - Added provider selection logic
  - Added provider-specific configuration loading
  - Added conditional validation based on selected provider

### Server Implementation
- `packages/server/src/index.ts`: Updated to use the provider factory
  - Replaced direct Ollama calls with provider factory calls
  - Added provider selection logic
  - Added dynamic configuration based on selected provider

### Ingest Configuration
- `packages/ingest/src/loadEnvVars.ts`: Updated to support multiple providers
  - Added provider selection logic
  - Added provider-specific configuration loading
  - Added conditional validation based on selected provider

### Ingest Implementation
- `packages/ingest/src/ingest.config.ts`: Updated to use the provider factory
  - Replaced direct Ollama calls with provider factory calls
  - Added provider selection logic
  - Added dynamic configuration based on selected provider

## Removed Files

- `packages/server/src/ollamaLlm.ts`: Functionality moved to `ollamaProvider.ts`
- `packages/server/src/ollamaEmbedder.ts`: Functionality moved to `ollamaProvider.ts`
- `packages/ingest/src/ollamaEmbedder.ts`: Functionality moved to provider architecture

## Detailed Changes

### Provider Interface

Created a common interface that all LLM providers must implement:

```typescript
export interface LlmProvider {
  getName(): string;
  requiresApiKey(): boolean;
  createChatLlm(config: LlmProviderConfig): ChatLlm;
  createEmbedder(config: LlmProviderConfig): Embedder;
}

export interface LlmProviderConfig {
  // Common configuration
  timeout?: number;
  
  // Ollama-specific configuration
  baseUrl?: string;
  model?: string;
  embeddingModel?: string;
  numOfAttempts?: number;
  maxDelay?: number;
  startingDelay?: number;
  
  // Gemini-specific configuration
  apiKey?: string;
}
```

### Environment Variables

Added new environment variables to support multiple providers:

```
# Original variables
MONGODB_CONNECTION_URI=...
MONGODB_DATABASE_NAME=...
VECTOR_SEARCH_INDEX_NAME=...

# New variables
LLM_PROVIDER="ollama"  # Options: ollama, gemini
LLM_TIMEOUT_MS=60000

# Gemini-specific variables
GEMINI_API_KEY=""
GEMINI_CHAT_MODEL="gemini-pro"
GEMINI_EMBEDDING_MODEL="embedding-001"
```

### Server Implementation

Updated the server code to use the provider factory:

```typescript
// Old implementation
const llm = makeOllamaLlm({
  baseUrl: OLLAMA_BASE_URL,
  model: OLLAMA_CHAT_MODEL,
});

const embedder = makeOllamaEmbedder({
  baseUrl: OLLAMA_BASE_URL,
  model: OLLAMA_EMBEDDING_MODEL,
  backoffOptions: {
    numOfAttempts: 3,
    maxDelay: 5000,
  },
});

// New implementation
const llm = createChatLlm(LLM_PROVIDER, {
  timeout: LLM_TIMEOUT_MS,
  baseUrl: OLLAMA_BASE_URL,
  model: LLM_PROVIDER.toLowerCase() === "ollama" ? OLLAMA_CHAT_MODEL : GEMINI_CHAT_MODEL,
  apiKey: GEMINI_API_KEY,
});

const embedder = createEmbedder(LLM_PROVIDER, {
  timeout: LLM_TIMEOUT_MS,
  baseUrl: OLLAMA_BASE_URL,
  numOfAttempts: 3,
  maxDelay: 5000,
  apiKey: GEMINI_API_KEY,
  embeddingModel: LLM_PROVIDER.toLowerCase() === "ollama" ? OLLAMA_EMBEDDING_MODEL : GEMINI_EMBEDDING_MODEL,
});
```

## Migration Notes

If you're updating from the original repository, follow these steps:

1. Add the new files from the "New Files Added" section
2. Update the modified files as described in the "Modified Files" section
3. Remove the files listed in the "Removed Files" section
4. Update your `.env` file with the new environment variables
5. Install the new dependencies: `npm install @google/generative-ai`
