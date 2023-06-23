import { type ConversationHistoryController } from "../ConversationHistoryController";
import { type Messages } from "../../types";
import { getTokenLengthByInput } from "../../utils/tiktoken-instance";

export type CHComponentsWithTL = {
  conversationHistory: Messages;
  conversationHistoryTokenLength: number;
};

export class CHComponentsTLManager {
  constructor(
    private conversationHistoryController: ConversationHistoryController
  ) {}

  public async getCHComponentsTokenLength(): Promise<CHComponentsWithTL> {
    const conversationHistory =
      await this.conversationHistoryController.getConversationHistory();

    // append conversation history in to a single string
    const CHString = conversationHistory
      .map((message) => message.content)
      .join(" ");

    const CHStringTokenLength = await getTokenLengthByInput(CHString);
    // Addn token length due to tokens (<|user|>, etc) prepended on actual conversation entries
    const CHArryTokenLength = conversationHistory.length * 3;

    return {
      conversationHistory,
      conversationHistoryTokenLength: CHStringTokenLength + CHArryTokenLength,
    };
  }
}
