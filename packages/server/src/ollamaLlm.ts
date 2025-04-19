import { ChatLlm, OpenAiChatMessage, LlmAnswerQuestionParams, OpenAiStreamingResponse } from "mongodb-chatbot-server";
import axios from "axios";

interface OllamaCompletionResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export function makeOllamaLlm({
  baseUrl,
  model,
}: {
  baseUrl: string;
  model: string;
}): ChatLlm {
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

        // Set a longer timeout for Ollama API calls (60 seconds)
        const response = await axios.post(`${baseUrl}/api/generate`, {
          model,
          prompt,
          stream: false,
        }, {
          timeout: 60000 // 60 seconds timeout
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
