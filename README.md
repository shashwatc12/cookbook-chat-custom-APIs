# Gilded Age Gourmet

_Cooking chatbot inspired by the Boston Cooking School Cookbook with Multi-Provider LLM Architecture_

This project contains the source code for the Gilded Age Gourmet, a full-stack retrieval augmented generation (RAG) chatbot that you can use to search for recipes and learn about the fundamentals of cooking.

The chatbot uses the [Boston Cooking School Cookbook](https://www.gutenberg.org/cache/epub/65061/pg65061-images.html) by Fannie Farmer as it's source of recipes and cooking knowledge. The cookbook, first published in 1896, was the best-selling cookbook of the turn of the 20th century. Conveniently, for our chatbot's purposes, the cookbook is also in the public domain.

The chatbot responds in the style of the cookbook, using the same language and tone as the original text. The chatbot is able to answer questions about cooking and recipes, and can also generate new recipes based on user input.

## Multi-Provider LLM Architecture

This enhanced version of the MongoDB Chatbot Framework includes a flexible architecture that supports multiple LLM providers. You can easily switch between different providers (currently Ollama and Gemini) by changing a single configuration value.

Key features of the multi-provider architecture:

- **Provider Interface**: Abstracts LLM functionality behind a common interface
- **Factory Pattern**: Dynamically selects the appropriate provider based on configuration
- **Multiple Providers**: Currently supports Ollama and Gemini, with an architecture that makes it easy to add more
- **Simple Configuration**: Control provider selection through environment variables

For detailed information about the multi-provider architecture, see:
- [README-LLM-PROVIDERS.md](./README-LLM-PROVIDERS.md) - Comprehensive documentation
- [CHANGELOG-LLM-PROVIDERS.md](./CHANGELOG-LLM-PROVIDERS.md) - Detailed changes from the original repository
- [CHALLENGES-AND-SOLUTIONS.md](./docs/CHALLENGES-AND-SOLUTIONS.md) - Development challenges and how they were resolved
- [Architecture Diagram](./docs/architecture-diagram.md) - Visual representation of the architecture

## Get Started

The chatbot is built using the MongoDB Chatbot Framework, following the structure of the [Quick Start](https://mongodb.github.io/chatbot/quick-start) guide, with enhancements for multi-provider support.

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure your `.env` file with the appropriate provider settings:
   ```
   # LLM Provider Selection
   LLM_PROVIDER="ollama" # Options: ollama, gemini
   ```
4. Run the ingest process: `cd packages/ingest && npm run ingest:all`
5. Start the server: `cd packages/server && npm run dev`
6. Start the UI: `cd packages/ui && npm run dev`

### Provider-Specific Setup

#### Ollama
1. Install Ollama: [https://ollama.ai/](https://ollama.ai/)
2. Pull the required models:
   ```
   ollama pull llama3
   ollama pull nomic-embed-text
   ```

#### Gemini
1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add your API key to the `GEMINI_API_KEY` field in the `.env` file

The main differences between this chatbot and the original Quick Start are:

1. The data ingested (in this case the cookbook)
2. The system prompt used to call the large language model
3. The UI text
4. The multi-provider LLM architecture

Happy cooking!
