import { ConversationHistoryModel } from "../models/ConversationHistoryModel";
import { getTokenLengthByInput } from "../utils/tiktoken-instance";
import { Messages } from "../types";
export class ConversationHistoryController {
  private conversationModel: ConversationHistoryModel =
    new ConversationHistoryModel();

  public async appendAIMessage(content: string): Promise<void> {
    const tokenLength = await getTokenLengthByInput(content);
    this.conversationModel.appendAIMessage({ content, tokenLength });
  }

  public async appendUserMessage(content: string): Promise<void> {
    const tokenLength = await getTokenLengthByInput(content);
    this.conversationModel.appendUserMessage({ content, tokenLength });
  }

  public async getConversationHistory(): Promise<Messages> {
    return this.conversationModel.getConversationHistory();
  }

  public async resetConversationHistory(): Promise<void> {
    this.conversationModel.resetConversationHistory();
  }

  public async setConversationHistory(messages: Messages): Promise<void> {
    // lets take advantage of existing interfaces, and use the append methods
    for (const message of messages) {
      if (message.key === "user") {
        await this.appendUserMessage(message.content);
      } else {
        await this.appendAIMessage(message.content);
      }
    }
  }
}
