# Multi-Provider LLM Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                           Server                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Request Processing                      │    │
│  └──────────────────────────────┬──────────────────────────┘    │
│                                 │                                │
│                                 ▼                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 LLM Provider Factory                     │    │
│  └───┬─────────────────────┬───────────────────────┬───────┘    │
│      │                     │                       │            │
│      ▼                     ▼                       ▼            │
│  ┌─────────┐         ┌─────────┐             ┌─────────┐        │
│  │ Ollama  │         │ Gemini  │             │ Other   │        │
│  │Provider │         │Provider │             │Providers│        │
│  └────┬────┘         └────┬────┘             └────┬────┘        │
│       │                   │                       │             │
│       ▼                   ▼                       ▼             │
│  ┌─────────┐         ┌─────────┐             ┌─────────┐        │
│  │ Ollama  │         │ Gemini  │             │ Other   │        │
│  │  API    │         │  API    │             │  APIs   │        │
│  └─────────┘         └─────────┘             └─────────┘        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MongoDB Atlas                           │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │  Conversations  │    │  Embedded       │    │  Vector     │  │
│  │  Collection     │    │  Content Store  │    │  Search     │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Flow Diagram for RAG Process

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ User Query  │────▶│ Query       │────▶│ Vector      │────▶│ Content     │
│             │     │ Embedding   │     │ Search      │     │ Retrieval   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Response to │◀────│ LLM         │◀────│ Prompt      │◀────│ Context     │
│ User        │     │ Generation  │     │ Construction│     │ Integration │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Provider Selection Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────────┐
│ Environment │────▶│ Provider    │────▶│ Provider Factory        │
│ Variables   │     │ Selection   │     │                         │
└─────────────┘     └─────────────┘     │  ┌─────────┐            │
                                        │  │ Ollama  │◀───┐       │
                                        │  └─────────┘    │       │
                                        │                 │       │
                                        │  ┌─────────┐    │       │
                                        │  │ Gemini  │◀───┼───────┼─── LLM_PROVIDER
                                        │  └─────────┘    │       │    environment
                                        │                 │       │    variable
                                        │  ┌─────────┐    │       │
                                        │  │ Other   │◀───┘       │
                                        │  └─────────┘            │
                                        └─────────────────────────┘
                                                   │
                                        ┌─────────┴─────────┐
                                        │                   │
                                        ▼                   ▼
                                ┌─────────────┐     ┌─────────────┐
                                │ Chat LLM    │     │ Embedder    │
                                │ Instance    │     │ Instance    │
                                └─────────────┘     └─────────────┘
```
