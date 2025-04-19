# Adding a New LLM Provider

This example demonstrates how to add a new LLM provider (in this case, Mistral) to the multi-provider architecture.

## Step 1: Create the Provider Implementation

Create a new file at `packages/server/src/llm/providers/mistralProvider.ts`:

```typescript
import { ChatLlm, LlmAnswerQuestionParams, OpenAiStreamingResponse } from "mongodb-chatbot-server";
import { Embedder, EmbedArgs, EmbedResult } from "mongodb-rag-core";
import axios from "axios";
import { LlmProvider, LlmProviderConfig } from "../llmProviderInterface";

/**
 * Implementation of LlmProvider for Mistral AI
 */
export class MistralProvider implements LlmProvider {
  getName(): string {
    return "mistral";
  }

  requiresApiKey(): boolean {
    return true; // Mistral requires an API key
  }

  createChatLlm(config: LlmProviderConfig): ChatLlm {
    if (!config.apiKey) {
      throw new Error("Mistral provider requires an API key");
    }

    const apiKey = config.apiKey;
    const model = config.model || "mistral-medium";
    const baseUrl = config.baseUrl || "https://api.mistral.ai/v1";
    const timeout = config.timeout || 60000;

    return {
      async answerQuestionAwaited({ messages }: LlmAnswerQuestionParams) {
        try {
          console.log(`Using Mistral model: ${model}`);

          // Convert messages to Mistral format (similar to OpenAI format)
          const mistralMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          }));

          // Set a timeout for the Mistral API call
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          // Make the API call
          const response = await axios.post(
            `${baseUrl}/chat/completions`,
            {
              model,
              messages: mistralMessages,
              temperature: 0.7,
              max_tokens: 2048,
            },
            {
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          return {
            role: "assistant",
            content: response.data.choices[0].message.content,
          };
        } catch (error: any) {
          console.error("Error calling Mistral:", error);
          
          // Check if it's a timeout error
          if (error.name === 'AbortError' || (error.message && error.message.includes('timeout'))) {
            console.error('Mistral API call timed out');
            return {
              role: "assistant",
              content: "I apologize, but I'm having trouble processing your request at the moment. The response is taking longer than expected. Please try a simpler query or try again later."
            };
          }
          
          // For other errors
          return {
            role: "assistant",
            content: `I apologize, but I'm experiencing technical difficulties at the moment. Please try again later.`,
          };
        }
      },

      async answerQuestionStream(params: LlmAnswerQuestionParams): Promise<OpenAiStreamingResponse> {
        const response = await this.answerQuestionAwaited(params);

        // Create a simple async iterable that yields the response
        const asyncIterable = {
          [Symbol.asyncIterator]() {
            let done = false;
            return {
              async next() {
                if (done) {
                  return { done: true, value: undefined };
                }
                done = true;
                return {
                  done: false,
                  value: {
                    choices: [{
                      delta: {
                        content: response.content,
                      },
                    }],
                  },
                };
              },
            };
          },
        };

        return asyncIterable as unknown as OpenAiStreamingResponse;
      },

      async callTool() {
        throw new Error("Tool calling not implemented for Mistral LLM");
      },
    };
  }

  createEmbedder(config: LlmProviderConfig): Embedder {
    if (!config.apiKey) {
      throw new Error("Mistral provider requires an API key");
    }

    const apiKey = config.apiKey;
    const model = config.embeddingModel || "mistral-embed";
    const baseUrl = config.baseUrl || "https://api.mistral.ai/v1";

    return {
      embed: async (args: EmbedArgs): Promise<EmbedResult> => {
        try {
          const { text } = args;
          
          console.log(`Generating embeddings with Mistral model: ${model}`);
          
          const response = await axios.post(
            `${baseUrl}/embeddings`,
            {
              model,
              input: text,
            },
            {
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            }
          );
          
          const embedding = response.data.data[0].embedding;
          console.log(`Generated embedding with ${embedding.length} dimensions`);
          
          return { embedding };
        } catch (error: any) {
          console.error("Error generating embeddings with Mistral:", error);
          throw new Error(`Failed to generate embeddings: ${error.message}`);
        }
      }
    };
  }
}
```

## Step 2: Register the Provider in the Factory

Update `packages/server/src/llm/llmProviderFactory.ts`:

```typescript
import { LlmProvider, LlmProviderConfig } from "./llmProviderInterface";
import { OllamaProvider } from "./providers/ollamaProvider";
import { GeminiProvider } from "./providers/geminiProvider";
import { MistralProvider } from "./providers/mistralProvider"; // Add this line

// Map of provider names to provider implementations
const providers: Record<string, LlmProvider> = {
  ollama: new OllamaProvider(),
  gemini: new GeminiProvider(),
  mistral: new MistralProvider(), // Add this line
};
```

## Step 3: Update Environment Variables

Update your `.env` file to include Mistral configuration:

```
# Mistral config
MISTRAL_API_KEY=""
MISTRAL_CHAT_MODEL="mistral-medium"
MISTRAL_EMBEDDING_MODEL="mistral-embed"
```

## Step 4: Update Environment Loading

Update `packages/server/src/loadEnvVars.ts` and `packages/ingest/src/loadEnvVars.ts`:

```typescript
const {
  // Existing configuration...
  
  // Mistral configuration
  MISTRAL_API_KEY,
  MISTRAL_CHAT_MODEL = "mistral-medium",
  MISTRAL_EMBEDDING_MODEL = "mistral-embed",
  
  // ...
} = process.env;

// Provider-specific assertions
if (LLM_PROVIDER.toLowerCase() === "ollama") {
  // Ollama assertions...
} else if (LLM_PROVIDER.toLowerCase() === "gemini") {
  // Gemini assertions...
} else if (LLM_PROVIDER.toLowerCase() === "mistral") {
  assert(MISTRAL_API_KEY, "MISTRAL_API_KEY is required when using Mistral provider");
}

return {
  // Existing return values...
  
  // Mistral configuration
  MISTRAL_API_KEY,
  MISTRAL_CHAT_MODEL,
  MISTRAL_EMBEDDING_MODEL,
};
```

## Step 5: Update Server Code

Update `packages/server/src/index.ts` to handle the new provider:

```typescript
// Create the LLM based on the selected provider
const llm = createChatLlm(LLM_PROVIDER, {
  // Common configuration
  timeout: LLM_TIMEOUT_MS,
  
  // Ollama-specific configuration
  baseUrl: OLLAMA_BASE_URL,
  
  // Model selection based on provider
  model: LLM_PROVIDER.toLowerCase() === "ollama" 
    ? OLLAMA_CHAT_MODEL 
    : LLM_PROVIDER.toLowerCase() === "gemini"
      ? GEMINI_CHAT_MODEL
      : MISTRAL_CHAT_MODEL,
  
  // API key based on provider
  apiKey: LLM_PROVIDER.toLowerCase() === "gemini" 
    ? GEMINI_API_KEY 
    : LLM_PROVIDER.toLowerCase() === "mistral"
      ? MISTRAL_API_KEY
      : undefined,
});

// Similar updates for embedder creation...
```

## Step 6: Test the New Provider

1. Get a Mistral API key from [Mistral AI](https://console.mistral.ai/)
2. Add your API key to the `.env` file
3. Set `LLM_PROVIDER="mistral"` in your `.env` file
4. Restart the server and test the chatbot

That's it! You've successfully added a new LLM provider to the architecture.
