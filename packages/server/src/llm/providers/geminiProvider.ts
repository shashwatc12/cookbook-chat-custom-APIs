import { ChatLlm, LlmAnswerQuestionParams, OpenAiStreamingResponse } from "mongodb-chatbot-server";
import { Embedder, EmbedArgs, EmbedResult } from "mongodb-rag-core";
import { GoogleGenerativeAI, GenerativeModel, EmbedContentRequest, TaskType } from "@google/generative-ai";
import { LlmProvider, LlmProviderConfig } from "../llmProviderInterface";

/**
 * Implementation of LlmProvider for Google's Gemini
 */
export class GeminiProvider implements LlmProvider {
  getName(): string {
    return "gemini";
  }

  requiresApiKey(): boolean {
    return true; // Gemini requires an API key
  }

  createChatLlm(config: LlmProviderConfig): ChatLlm {
    if (!config.apiKey) {
      throw new Error("Gemini provider requires an API key");
    }

    const apiKey = config.apiKey;
    const model = config.model || "gemini-2.0-flash-thinking-exp-01-21";
    const timeout = config.timeout || 60000;
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    return {
      async answerQuestionAwaited({ messages }: LlmAnswerQuestionParams) {
        try {
          console.log(`Using Gemini model: ${model}`);

          // Convert messages to Gemini format
          // Gemini uses 'user' and 'model' roles instead of 'user' and 'assistant'
          const geminiMessages = messages.map(msg => ({
            role: msg.role === "assistant" ? "model" : msg.role,
            parts: [{ text: msg.content }],
          }));

          // Handle system messages - Gemini doesn't support them directly
          // We'll prepend them to the first user message
          const systemMessages = geminiMessages.filter(msg => msg.role === "system");
          const nonSystemMessages = geminiMessages.filter(msg => msg.role !== "system");

          let chatMessages = nonSystemMessages;

          // If there are system messages, prepend them to the first user message
          if (systemMessages.length > 0 && nonSystemMessages.length > 0) {
            const firstUserMessageIndex = nonSystemMessages.findIndex(msg => msg.role === "user");
            if (firstUserMessageIndex !== -1) {
              const systemContent = systemMessages.map(msg => msg.parts[0].text).join("\n\n");
              const userContent = nonSystemMessages[firstUserMessageIndex].parts[0].text;
              nonSystemMessages[firstUserMessageIndex].parts[0].text =
                `[System Instructions: ${systemContent}]\n\n${userContent}`;
            }
          }

          console.log(`Sending ${chatMessages.length} messages to Gemini`);

          // Set a timeout for the Gemini API call
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Gemini API call timed out')), timeout);
          });

          // Make the API call with a timeout
          const resultPromise = geminiModel.generateContent({
            contents: chatMessages,
          });

          // Race the API call against the timeout
          const result = await Promise.race([resultPromise, timeoutPromise]) as any;
          const response = result.response;

          return {
            role: "assistant",
            content: response.text(),
          };
        } catch (error: any) {
          console.error("Error calling Gemini:", error);

          // Check if it's a timeout error
          if (error.message && error.message.includes('timed out')) {
            console.error('Gemini API call timed out');
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
        throw new Error("Tool calling not implemented for Gemini LLM");
      },
    };
  }

  createEmbedder(config: LlmProviderConfig): Embedder {
    if (!config.apiKey) {
      throw new Error("Gemini provider requires an API key");
    }

    const apiKey = config.apiKey;
    const model = config.embeddingModel || "embedding-001";
    const genAI = new GoogleGenerativeAI(apiKey);
    const embeddingModel = genAI.getGenerativeModel({ model });

    return {
      embed: async (args: EmbedArgs): Promise<EmbedResult> => {
        try {
          const { text } = args;

          console.log(`Generating embeddings with Gemini model: ${model}`);

          // Create content according to the latest Gemini API documentation
          // https://ai.google.dev/gemini-api/docs/embeddings
          const content = {
            role: "user",
            parts: [{ text }]
          };

          const embeddingResult = await embeddingModel.embedContent({
            content,
            taskType: TaskType.RETRIEVAL_DOCUMENT,
          });

          const embedding = embeddingResult.embedding.values;
          console.log(`Generated embedding with ${embedding.length} dimensions`);

          return { embedding };
        } catch (error: any) {
          console.error("Error generating embeddings with Gemini:", error);
          throw new Error(`Failed to generate embeddings: ${error.message}`);
        }
      }
    };
  }
}
