import { AtomaSDK } from "atoma-ts-sdk";
import OpenAI from "openai";

export class AIService {
  private atomaSDK?: AtomaSDK;
  private openai: any;

  constructor(private settings: {
    provider: 'openai' | 'atoma' | 'venice';
    apiKey: string;
    enablePrivateCompute?: boolean;
  }) {
    this.initializeProvider();
  }

  private initializeProvider() {
    switch (this.settings.provider) {
      case 'atoma':
        this.atomaSDK = new AtomaSDK({
          bearerAuth: this.settings.apiKey
        });
        break;
      
      case 'openai':
        this.openai = new OpenAI(
            {
                apiKey: this.settings.apiKey,
            }
        );
        break;
    }
  }

  async generateCompletion(prompt: string) {
    switch (this.settings.provider) {
      case 'atoma':
        return this.settings.enablePrivateCompute ? 
          this.atomaSDK?.confidentialChat.create({
            messages: [{ role: "user", content: prompt }],
            model: "meta-llama/Llama-3.3-70B-Instruct"
          }) :
          this.atomaSDK?.chat.create({
            messages: [{ role: "user", content: prompt }],
            model: "meta-llama/Llama-3.3-70B-Instruct"
          });

      case 'openai':
        return this.openai?.createChatCompletion({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }]
        });

    }
  }
} 