import { Messages } from "../types";

type AppendMessage = {
  content: string;
  tokenLength: number;
};

export class ConversationHistoryModel {
  private conversationHistory: Messages = [];

  public appendAIMessage({ content, tokenLength }: AppendMessage): void {
    this.conversationHistory.push({ key: "ai", content, tokenLength });
  }

  public appendUserMessage({ content, tokenLength }: AppendMessage): void {
    this.conversationHistory.push({ key: "user", content, tokenLength });
  }

  public getConversationHistory(): Messages {
    const deepCopy = JSON.parse(JSON.stringify(this.conversationHistory));
    return deepCopy;
  }

  public resetConversationHistory(): void {
    this.conversationHistory = [];
  }
}
