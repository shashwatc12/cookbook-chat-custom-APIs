import { makeIngestMetaStore, Config } from "mongodb-rag-ingest";
import {
  makeMongoDbEmbeddedContentStore,
  makeMongoDbPageStore,
} from "mongodb-rag-core";
import { standardChunkFrontMatterUpdater } from "mongodb-rag-ingest/embed";
import path from "path";
import { loadEnvVars } from "./loadEnvVars";
import { cookbookDataSourceConstructor } from "./cookbookDataSource";

// Import the provider factory
import { createEmbedder } from "../../../packages/server/src/llm/llmProviderFactory";

// Load project environment variables
const dotenvPath = path.join(__dirname, "..", "..", "..", ".env"); // .env at project root
const {
  MONGODB_CONNECTION_URI,
  MONGODB_DATABASE_NAME,
  GITHUB_REPO_NAME,
  GITHUB_REPO_OWNER,
  LLM_PROVIDER,
  OLLAMA_BASE_URL,
  OLLAMA_EMBEDDING_MODEL,
  GEMINI_API_KEY,
  GEMINI_EMBEDDING_MODEL,
  LLM_TIMEOUT_MS,
} = loadEnvVars(dotenvPath);

export default {
  embedder: async () => {
    console.log(`Using ${LLM_PROVIDER} provider for embeddings`);
    return createEmbedder(LLM_PROVIDER, {
      // Common configuration
      timeout: LLM_TIMEOUT_MS,

      // Ollama-specific configuration
      baseUrl: OLLAMA_BASE_URL,
      embeddingModel: OLLAMA_EMBEDDING_MODEL,
      numOfAttempts: 25,
      startingDelay: 1000,

      // Gemini-specific configuration
      apiKey: GEMINI_API_KEY,
      embeddingModel: GEMINI_EMBEDDING_MODEL,
    });
  },
  embeddedContentStore: () =>
    makeMongoDbEmbeddedContentStore({
      connectionUri: MONGODB_CONNECTION_URI,
      databaseName: MONGODB_DATABASE_NAME,
    }),
  pageStore: () =>
    makeMongoDbPageStore({
      connectionUri: MONGODB_CONNECTION_URI,
      databaseName: MONGODB_DATABASE_NAME,
    }),
  ingestMetaStore: () =>
    makeIngestMetaStore({
      connectionUri: MONGODB_CONNECTION_URI,
      databaseName: MONGODB_DATABASE_NAME,
      entryId: "all",
    }),
  chunkOptions: () => ({
    transform: standardChunkFrontMatterUpdater,
    maxChunkSize: 1000,
  }),
  // Add data sources here
  dataSources: async () => {
    const cookbookSource = await cookbookDataSourceConstructor({
      githubRepoName: GITHUB_REPO_NAME,
      githubRepoUsername: GITHUB_REPO_OWNER,
    });

    return [cookbookSource];
  },
} satisfies Config;
