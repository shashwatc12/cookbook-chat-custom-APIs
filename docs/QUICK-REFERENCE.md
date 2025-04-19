# Quick Reference Guide

This guide provides quick reference for common operations with the multi-provider LLM architecture.

## Switching LLM Providers

### Switch to Ollama

1. Update your `.env` file:
   ```
   LLM_PROVIDER="ollama"
   ```
2. Restart the server:
   ```bash
   cd packages/server && npm run dev
   ```

### Switch to Gemini

1. Ensure you have a Gemini API key
2. Update your `.env` file:
   ```
   LLM_PROVIDER="gemini"
   GEMINI_API_KEY="your-api-key-here"
   ```
3. Restart the server:
   ```bash
   cd packages/server && npm run dev
   ```

## Testing API Keys

### Test Gemini API Key

```bash
cd cookbook-chat
node test-gemini.js YOUR_API_KEY
```

## Running the Application

### Start the Server

```bash
cd packages/server && npm run dev -- --port 3001
```

### Start the UI

```bash
cd packages/ui && npm run dev
```

### Run the Ingest Process

```bash
cd packages/ingest && npm run ingest:all
```

## Troubleshooting

### Port Already in Use

If you get an error like `Error: listen EADDRINUSE: address already in use :::3001`:

```bash
# Find the process using the port
lsof -i :3001 | grep LISTEN

# Kill the process
kill -9 [PID]
```

### API Key Issues

If you're having issues with API keys:

1. Verify the API key is correct
2. Test the API key with a test script
3. Check that the API key is properly set in the `.env` file
4. Ensure you're using the correct model names for the provider

### Embedding Issues

If you're having issues with embeddings:

1. Check that the embedding model is available for your provider
2. Verify that the embedding model name is correct
3. For Ollama, ensure the embedding model is pulled:
   ```bash
   ollama pull nomic-embed-text
   ```

## Common Configuration Options

### Ollama Configuration

```
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_EMBEDDING_MODEL="nomic-embed-text"
OLLAMA_CHAT_MODEL="llama3"
```

### Gemini Configuration

```
GEMINI_API_KEY="your-api-key-here"
GEMINI_CHAT_MODEL="gemini-pro"
GEMINI_EMBEDDING_MODEL="embedding-001"
```

### Common Configuration

```
LLM_TIMEOUT_MS=60000  # Timeout in milliseconds
```
