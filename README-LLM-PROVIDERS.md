# Multi-Provider LLM Architecture for MongoDB Chatbot

This repository extends the original [MongoDB Cookbook Chat](https://github.com/mongodb-university/cookbook-chat) with a flexible architecture that supports multiple LLM providers. This enhancement allows developers to easily switch between different LLM services without changing the core application code.

## What's New

The original MongoDB Chatbot framework was tightly coupled with OpenAI's API, which was later replaced with Ollama. This enhanced version:

1. **Introduces a Provider Interface**: Abstracts LLM functionality behind a common interface
2. **Implements a Factory Pattern**: Dynamically selects the appropriate provider based on configuration
3. **Supports Multiple Providers**: Currently implements Ollama and Gemini, with an architecture that makes it easy to add more
4. **Simplifies Configuration**: Uses environment variables to control which provider is used

## Architecture Overview

The multi-provider architecture consists of:

- **Provider Interface** (`LlmProviderInterface.ts`): Defines the contract that all LLM providers must implement
- **Provider Factory** (`llmProviderFactory.ts`): Creates provider instances based on configuration
- **Provider Implementations**:
  - `OllamaProvider`: For using local Ollama models
  - `GeminiProvider`: For using Google's Gemini models
  - (Extensible for other providers)

## Key Changes from Original Repository

### 1. Provider Interface

Created a common interface that all LLM providers must implement:

```typescript
export interface LlmProvider {
  getName(): string;
  requiresApiKey(): boolean;
  createChatLlm(config: LlmProviderConfig): ChatLlm;
  createEmbedder(config: LlmProviderConfig): Embedder;
}
```

### 2. Provider Factory

Implemented a factory pattern to instantiate the appropriate provider:

```typescript
export function getLlmProvider(providerName: string): LlmProvider {
  const provider = providers[providerName.toLowerCase()];
  if (!provider) {
    throw new Error(`LLM provider '${providerName}' not found. Available providers: ${Object.keys(providers).join(", ")}`);
  }
  return provider;
}

export function createChatLlm(providerName: string, config: LlmProviderConfig) {
  const provider = getLlmProvider(providerName);
  return provider.createChatLlm(config);
}

export function createEmbedder(providerName: string, config: LlmProviderConfig) {
  const provider = getLlmProvider(providerName);
  return provider.createEmbedder(config);
}
```

### 3. Configuration System

Enhanced the environment variable system to support multiple providers:

```
# LLM Provider Selection
LLM_PROVIDER="ollama" # Options: ollama, gemini

# Ollama config
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_EMBEDDING_MODEL="nomic-embed-text"
OLLAMA_CHAT_MODEL="llama3.2"

# Gemini config
GEMINI_API_KEY="YOUR_API_KEY"
GEMINI_CHAT_MODEL="gemini-pro"
GEMINI_EMBEDDING_MODEL="embedding-001"
```

### 4. Server Integration

Updated the server code to use the provider factory:

```typescript
// Create the LLM based on the selected provider
const llm = createChatLlm(LLM_PROVIDER, {
  // Common configuration
  timeout: LLM_TIMEOUT_MS,
  
  // Provider-specific configuration
  baseUrl: OLLAMA_BASE_URL,
  model: LLM_PROVIDER.toLowerCase() === "ollama" ? OLLAMA_CHAT_MODEL : GEMINI_CHAT_MODEL,
  apiKey: GEMINI_API_KEY,
});

// Creates vector embeddings for user queries
const embedder = createEmbedder(LLM_PROVIDER, {
  // Configuration...
});
```

## Benefits Over the Original Implementation

1. **Flexibility**: Easily switch between different LLM providers
2. **Extensibility**: Add new providers without changing the core application code
3. **Configurability**: Control provider selection and settings through environment variables
4. **Maintainability**: Provider-specific code is isolated in separate modules
5. **Cost Management**: Choose between free open-source models (Ollama) and commercial APIs (Gemini)

## How to Use

### Switching Between Providers

To switch between different LLM providers, update the `.env` file:

```
# For Ollama
LLM_PROVIDER="ollama"

# For Gemini
LLM_PROVIDER="gemini"
```

### Adding a New Provider

To add support for a new LLM provider (e.g., Mistral, Grok, etc.):

1. Create a new provider class in `src/llm/providers/` that implements the `LlmProvider` interface
2. Add the provider to the factory in `llmProviderFactory.ts`
3. Add provider-specific configuration to `.env`
4. Update the loadEnvVars.ts file to include the new provider's configuration

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure your `.env` file with the appropriate provider settings
4. Run the ingest process: `cd packages/ingest && npm run ingest:all`
5. Start the server: `cd packages/server && npm run dev`
6. Start the UI: `cd packages/ui && npm run dev`

## Provider-Specific Setup

### Ollama

1. Install Ollama: [https://ollama.ai/](https://ollama.ai/)
2. Pull the required models:
   ```
   ollama pull llama3
   ollama pull nomic-embed-text
   ```
3. Set `LLM_PROVIDER="ollama"` in your `.env` file

### Gemini

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add your API key to the `GEMINI_API_KEY` field in the `.env` file
3. Set `LLM_PROVIDER="gemini"` in your `.env` file

## RAG Architecture Flow

This implementation maintains the original RAG (Retrieval-Augmented Generation) architecture:

1. **Content Ingestion**: Documents are processed and stored with vector embeddings
2. **Query Processing**: User queries are analyzed to determine if RAG is needed
3. **Retrieval**: For RAG queries, relevant content is retrieved using vector search
4. **Generation**: The LLM generates a response based on the retrieved content

The multi-provider architecture ensures that both the embedding generation and response generation can be handled by different LLM providers without changing the core RAG flow.
