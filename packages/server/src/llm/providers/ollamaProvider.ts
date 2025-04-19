import { ChatLlm, LlmAnswerQuestionParams, OpenAiStreamingResponse } from "mongodb-chatbot-server";
import { Embedder, EmbedArgs, EmbedResult } from "mongodb-rag-core";
import axios from "axios";
import { LlmProvider, LlmProviderConfig } from "../llmProviderInterface";

/**
 * Implementation of LlmProvider for Ollama
 */
export class OllamaProvider implements LlmProvider {
  getName(): string {
    return "ollama";
  }

  requiresApiKey(): boolean {
    return false; // Ollama doesn't require an API key
  }

  createChatLlm(config: LlmProviderConfig): ChatLlm {
    const baseUrl = config.baseUrl || "http://localhost:11434";
    const model = config.model || "llama3";
    const timeout = config.timeout || 60000;

    return {
      async answerQuestionAwaited({ messages }: LlmAnswerQuestionParams) {
        try {
          console.log(`Using Ollama model: ${model}`);

          // Convert messages to a prompt
          let prompt = "";
          for (const message of messages) {
            if (message.role === "system") {
              prompt += `System: ${message.content}\n\n`;
            } else if (message.role === "user") {
              prompt += `User: ${message.content}\n\n`;
            } else if (message.role === "assistant") {
              prompt += `Assistant: ${message.content}\n\n`;
            }
          }
          prompt += "Assistant: ";

          console.log(`Sending prompt to Ollama: ${prompt.substring(0, 100)}...`);

          // Set a longer timeout for Ollama API calls
          const response = await axios.post(`${baseUrl}/api/generate`, {
            model,
            prompt,
            stream: false,
          }, {
            timeout: timeout
          });

          return {
            role: "assistant",
            content: response.data.response,
          };
        } catch (error: any) {
          console.error("Error calling Ollama:", error);
          // Check if it's a timeout error
          if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
            console.error('Ollama API call timed out');
            return {
              role: "assistant",
              content: "I apologize, but I'm having trouble processing your request at the moment. The response is taking longer than expected. Please try a simpler query or try again later."
            };
          }
          // For other errors
          return {
            role: "assistant",
            content: "I apologize, but I'm experiencing technical difficulties at the moment. Please try again later."
          };
        }
      },

      // For streaming, we'll just use the non-streaming version for simplicity
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
        throw new Error("Tool calling not implemented for Ollama LLM");
      },
    };
  }

  createEmbedder(config: LlmProviderConfig): Embedder {
    const baseUrl = config.baseUrl || "http://localhost:11434";
    const model = config.embeddingModel || "nomic-embed-text";
    const numOfAttempts = config.numOfAttempts || 3;
    const maxDelay = config.maxDelay || 5000;
    const startingDelay = config.startingDelay || 1000;

    /**
     * Implements exponential backoff for API calls.
     */
    async function withBackoff<T>(fn: () => Promise<T>): Promise<T> {
      let attempt = 0;
      let delay = startingDelay;

      while (attempt < numOfAttempts) {
        try {
          return await fn();
        } catch (error) {
          attempt++;
          if (attempt >= numOfAttempts) {
            throw error;
          }

          // Calculate delay with exponential backoff, but cap at maxDelay
          delay = Math.min(delay * 2, maxDelay);

          // Add some jitter to avoid thundering herd problem
          const jitter = Math.random() * 0.1 * delay;
          const actualDelay = delay + jitter;

          console.warn(`Ollama API call failed, retrying in ${Math.round(actualDelay)}ms (attempt ${attempt}/${numOfAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, actualDelay));
        }
      }

      throw new Error("Should not reach here");
    }

    /**
     * Generates embeddings for the given text using Ollama's API.
     */
    async function embedText(text: string): Promise<number[]> {
      return withBackoff(async () => {
        const response = await axios.post(`${baseUrl}/api/embeddings`, {
          model,
          prompt: text,
        });

        if (!response.data || !response.data.embedding) {
          throw new Error("Invalid response from Ollama API: missing embedding");
        }

        return response.data.embedding;
      });
    }

    return {
      embed: async (args: EmbedArgs): Promise<EmbedResult> => {
        const { text } = args;
        const embedding = await embedText(text);
        return { embedding };
      }
    };
  }
}
