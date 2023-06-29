import { type ConversationHistoryController } from "../ConversationHistoryController";
import { type Messages } from "../../types";
import { getTokenLengthByInput } from "../../utils/tiktoken-instance";

export type CHComponentsWithTL = {
  conversationHistory: Messages;
  conversationHistoryTokenLength: number;
};

export class CHComponentsTLManager {
  public static async calculateTLForCH(chistory: Messages): Promise<number> {
    const CHString = chistory.map((message) => message.content).join(" ");
    const CHStringTokenLength = await getTokenLengthByInput(CHString);
    // Addn token length due to tokens (<|user|>, etc) prepended on actual conversation entries
    const CHArryTokenLength = chistory.length * 3;
    return CHStringTokenLength + CHArryTokenLength;
  }

  constructor(
    private conversationHistoryController: ConversationHistoryController
  ) {}

  public async getCHComponentsTokenLength(): Promise<CHComponentsWithTL> {
    const conversationHistory =
      await this.conversationHistoryController.getConversationHistory();

    const conversationHistoryTokenLength =
      await CHComponentsTLManager.calculateTLForCH(conversationHistory);

    return {
      conversationHistory,
      conversationHistoryTokenLength,
    };
  }
}
