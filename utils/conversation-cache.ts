// This file contains a conversation class that is used to store the conversation between the "user" and the "ai".

import { getTokenLengthByInput } from "./tiktoken-instance";
import { Messages, Message } from "../types";

export class ConversationCache {
  private conversationHistory: Messages = [];

  public appendAIMessage(content: string): void {
    this.conversationHistory.push({ key: "ai", content });
  }

  public appendUserMessage(content: string): void {
    this.conversationHistory.push({ key: "user", content });
  }

  public getConversationHistory(): Messages {
    return this.conversationHistory;
  }

  public resetConversationHistory(): void {
    this.conversationHistory = [];
  }

  public async getConversationTokenLength(): Promise<number> {
    let tokenCount = 0;
    const p = this.conversationHistory.map(async (message) => {
      tokenCount += await getTokenLengthByInput(message.content);
    });

    await Promise.all(p);
    tokenCount += 4 * p.length; // 4 accounting to special characters on openai's side
    return tokenCount;
  }
}
