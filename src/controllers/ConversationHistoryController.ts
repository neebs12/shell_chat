import { ConversationHistoryModel } from "../models/ConversationHistoryModel";
import { Messages } from "../types";
export class ConversationHistoryController {
  private conversationModel: ConversationHistoryModel =
    new ConversationHistoryModel();

  public appendAIMessage(content: string): void {
    this.conversationModel.appendAIMessage(content);
  }

  public appendUserMessage(content: string): void {
    this.conversationModel.appendUserMessage(content);
  }

  public getConversationHistory(): Messages {
    return this.conversationModel.getConversationHistory();
  }

  public resetConversationHistory(): void {
    this.conversationModel.resetConversationHistory();
  }
}
