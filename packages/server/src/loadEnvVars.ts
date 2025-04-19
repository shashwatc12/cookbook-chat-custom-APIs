import { strict as assert } from "assert";
import dotenv from "dotenv";

/**
  Load environment variables from a .env file at the given path.
  Note that if you change the environment variable names,
  you need to update this function to support those environment variables.
 */
export function loadEnvVars(path: string) {
  Object.keys(process.env).forEach(key => {
    delete process.env[key];
  });
  dotenv.config({ path });

  const {
    // MongoDB configuration
    MONGODB_CONNECTION_URI,
    MONGODB_DATABASE_NAME,
    VECTOR_SEARCH_INDEX_NAME,

    // LLM provider selection
    LLM_PROVIDER = "ollama", // Default to Ollama if not specified

    // Ollama configuration
    OLLAMA_BASE_URL = "http://localhost:11434",
    OLLAMA_EMBEDDING_MODEL = "nomic-embed-text",
    OLLAMA_CHAT_MODEL = "llama3",

    // Gemini configuration
    GEMINI_API_KEY,
    GEMINI_CHAT_MODEL = "gemini-pro",
    GEMINI_EMBEDDING_MODEL = "embedding-001",

    // Common configuration
    LLM_TIMEOUT_MS = "60000", // Default timeout of 60 seconds
  } = process.env;

  // Required MongoDB configuration
  assert(MONGODB_CONNECTION_URI, "MONGODB_CONNECTION_URI is required");
  assert(MONGODB_DATABASE_NAME, "MONGODB_DATABASE_NAME is required");
  assert(VECTOR_SEARCH_INDEX_NAME, "VECTOR_SEARCH_INDEX_NAME is required");

  // Provider-specific assertions
  if (LLM_PROVIDER.toLowerCase() === "ollama") {
    assert(OLLAMA_BASE_URL, "OLLAMA_BASE_URL is required when using Ollama provider");
    assert(OLLAMA_EMBEDDING_MODEL, "OLLAMA_EMBEDDING_MODEL is required when using Ollama provider");
  } else if (LLM_PROVIDER.toLowerCase() === "gemini") {
    assert(GEMINI_API_KEY, "GEMINI_API_KEY is required when using Gemini provider");
  }

  return {
    // MongoDB configuration
    MONGODB_CONNECTION_URI,
    MONGODB_DATABASE_NAME,
    VECTOR_SEARCH_INDEX_NAME,

    // LLM provider selection
    LLM_PROVIDER,

    // Ollama configuration
    OLLAMA_BASE_URL,
    OLLAMA_EMBEDDING_MODEL,
    OLLAMA_CHAT_MODEL,

    // Gemini configuration
    GEMINI_API_KEY,
    GEMINI_CHAT_MODEL,
    GEMINI_EMBEDDING_MODEL,

    // Common configuration
    LLM_TIMEOUT_MS: parseInt(LLM_TIMEOUT_MS, 10),
  };
}
