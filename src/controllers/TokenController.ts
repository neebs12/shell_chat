import { TokenConfig } from "./TokenControllerUtils/TokenConfig";
import { SystemPromptController } from "./SystemPromptController";
import { ConversationHistoryController } from "./ConversationHistoryController";
import { SPComponentsTLManager } from "./TokenControllerUtils/SPComponentsManager";
import { FPComponentsTLManager } from "./TokenControllerUtils/FPComponentsManager";
import { CHComponentsTLManager } from "./TokenControllerUtils/CHComponentsManager";
import { TokenReportBuilder } from "./TokenControllerUtils/TokenReportBuilder";
import { TokenView } from "../views/TokenView";

import { getTokenLengthByInput } from "../utils/tiktoken-instance";
import { Message } from "../types";

type TokenControllerDependencies = {
  systemPromptController: SystemPromptController;
  conversationHistoryController: ConversationHistoryController;
};

export class TokenController {
  private systemPromptController: SystemPromptController;
  private conversationHistoryController: ConversationHistoryController;
  private tokenConfig = new TokenConfig();
  private tokenView = new TokenView();

  constructor({
    systemPromptController,
    conversationHistoryController,
  }: TokenControllerDependencies) {
    this.systemPromptController = systemPromptController;
    this.conversationHistoryController = conversationHistoryController;
  }

  public async handleTokenReport(render: boolean = true): Promise<void> {
    const spComponentsTokenLengthManager = new SPComponentsTLManager(
      this.systemPromptController
    );
    const spComponentsWithTL =
      await spComponentsTokenLengthManager.getSPComponentsTokenLength();

    const fpComponentsTokenLengthManager = new FPComponentsTLManager(
      this.systemPromptController
    );
    const fpComponentsWithTL =
      await fpComponentsTokenLengthManager.getFPComponentsWithTLTotalAllFiles();

    const chComponentsTokenLengthManager = new CHComponentsTLManager(
      this.conversationHistoryController
    );
    const chComponentsWithTL =
      await chComponentsTokenLengthManager.getCHComponentsTokenLength();

    const totalTokensUsed = await this.getTotalTokensUsed();

    const tokenReportBuilder = new TokenReportBuilder(
      totalTokensUsed,
      this.tokenConfig,
      spComponentsWithTL,
      fpComponentsWithTL,
      chComponentsWithTL
    );

    const tokenReport = await tokenReportBuilder.build();
    render && this.tokenView.renderTokenReport(tokenReport);
  }

  public async getTruncatedConversationhistory(): Promise<Message[]> {
    const chComponentsTokenLengthManager = new CHComponentsTLManager(
      this.conversationHistoryController
    );
    const { conversationHistory } =
      await chComponentsTokenLengthManager.getCHComponentsTokenLength();

    const totalTokensUsed = await this.getTotalTokensUsed();
    const totalTokensUsedWithReservedTokens =
      totalTokensUsed + this.tokenConfig.reservedConversationTokens;
    // NOTE: usage of `this.tokenConfig.reservedInputTokens` is not necessary bc history already contains most-recent user nl

    const tokensRemaining =
      totalTokensUsedWithReservedTokens -
      (totalTokensUsed + this.tokenConfig.maxCompletionTokens);

    // truncation logic
    let truncatedCHArry = [...conversationHistory];
    let currCHTokens = await CHComponentsTLManager.calculateTLForCH(
      truncatedCHArry
    );
    while (currCHTokens > Math.abs(tokensRemaining)) {
      truncatedCHArry = truncatedCHArry.slice(1);
      currCHTokens = await CHComponentsTLManager.calculateTLForCH(
        truncatedCHArry
      );
    }

    return truncatedCHArry;
  }

  public async areTheAddedFilesTooLarge(): Promise<boolean> {
    const condition =
      (await this.getTotalTokensUsed()) > this.tokenConfig.maxTokens;

    if (condition) this.tokenView.renderFilesTooLargeError();

    return condition;
  }

  public async isNLInputTooLarge(input: string): Promise<boolean> {
    const inputTL = await getTokenLengthByInput(input);
    // INPUT_TL > (RC - COMPLETION_TL)
    const inputReserve =
      this.tokenConfig.reservedConversationTokens -
      this.tokenConfig.maxCompletionTokens;
    const condition = inputTL > inputReserve;

    if (condition)
      this.tokenView.renderNLInputTooLargeError({ inputTL, inputReserve });

    return condition;
  }

  private async getTotalTokensUsed(): Promise<number> {
    const spComponentsTokenLengthManager = new SPComponentsTLManager(
      this.systemPromptController
    );
    const spComponentsWithTL =
      await spComponentsTokenLengthManager.getSPComponentsTokenLength();

    // SP + RC + ER
    return (
      spComponentsWithTL.completeInstructionTokenLength +
      this.tokenConfig.reservedConversationTokens +
      this.tokenConfig.errorCorrectionTokens
    );
  }
}
