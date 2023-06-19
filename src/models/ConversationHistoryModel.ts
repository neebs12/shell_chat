import { Messages } from "../../types";

export class ConversationHistoryModel {
  private conversationHistory: Messages = [];

  public appendAIMessage(content: string): void {
    this.conversationHistory.push({ key: "ai", content });
  }

  public appendUserMessage(content: string): void {
    this.conversationHistory.push({ key: "user", content });
  }

  public getConversationHistory(): Messages {
    return [...this.conversationHistory];
  }

  public resetConversationHistory(): void {
    this.conversationHistory = [];
  }
}
