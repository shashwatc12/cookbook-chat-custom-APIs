import { Embedder, EmbedArgs, EmbedResult } from "mongodb-rag-core";
import axios from "axios";

/**
 * Options for creating an Ollama embedder.
 */
export interface OllamaEmbedderOptions {
  /**
   * Base URL for the Ollama API.
   * @default "http://localhost:11434"
   */
  baseUrl?: string;

  /**
   * The name of the embedding model to use.
   * @default "nomic-embed-text"
   */
  model?: string;

  /**
   * Options for exponential backoff when API calls fail.
   */
  backoffOptions?: {
    /**
     * Number of attempts to make before giving up.
     * @default 3
     */
    numOfAttempts?: number;

    /**
     * Maximum delay between retries in milliseconds.
     * @default 5000
     */
    maxDelay?: number;

    /**
     * Starting delay for the first retry in milliseconds.
     * @default 1000
     */
    startingDelay?: number;
  };
}

/**
 * Creates an embedder that uses Ollama's API to generate embeddings.
 */
export function makeOllamaEmbedder(options: OllamaEmbedderOptions = {}): Embedder {
  const {
    baseUrl = "http://localhost:11434",
    model = "nomic-embed-text",
    backoffOptions = {
      numOfAttempts: 3,
      maxDelay: 5000,
      startingDelay: 1000,
    },
  } = options;

  const numOfAttempts = backoffOptions.numOfAttempts || 3;
  const maxDelay = backoffOptions.maxDelay || 5000;
  const startingDelay = backoffOptions.startingDelay || 1000;

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
