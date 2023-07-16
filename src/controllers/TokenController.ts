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
  private spTLManager: SPComponentsTLManager;
  private fpTLManager: FPComponentsTLManager;
  private chTLManager: CHComponentsTLManager;
  private tokenConfig = new TokenConfig();
  private tokenView = new TokenView();

  constructor({
    systemPromptController,
    conversationHistoryController,
  }: TokenControllerDependencies) {
    this.spTLManager = new SPComponentsTLManager(systemPromptController);
    this.fpTLManager = new FPComponentsTLManager(systemPromptController);
    this.chTLManager = new CHComponentsTLManager(conversationHistoryController);
  }

  public async handleTokenReport(render: boolean = true): Promise<void> {
    const spComponentsWithTL = await this.spTLManager.getSPComponentsTL();

    const fpComponentsWithTL =
      await this.fpTLManager.getFPComponentsWithTLTotalAllFiles();

    const chComponentsWithTL = await this.chTLManager.getCHComponentsTL();

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
    const { conversationHistory } = await this.chTLManager.getCHComponentsTL();
    const spComponentsWithTL = await this.spTLManager.getSPComponentsTL();

    const tokenUsed =
      spComponentsWithTL.completeInstructionTokenLength +
      this.tokenConfig.errorCorrectionTokens +
      this.tokenConfig.maxCompletionTokens;

    const tokensRemaining = this.tokenConfig.maxTokens - tokenUsed;

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
    // INPUT_TL > (RESERVED_C_TL - COMPLETION_TL)
    const inputReserve =
      this.tokenConfig.reservedConversationTokens -
      this.tokenConfig.maxCompletionTokens;
    const condition = inputTL > inputReserve;

    if (condition)
      this.tokenView.renderNLInputTooLargeError({ inputTL, inputReserve });

    return condition;
  }

  private async getTotalTokensUsed(): Promise<number> {
    const spComponentsWithTL = await this.spTLManager.getSPComponentsTL();

    // SP + RC + ER
    return (
      spComponentsWithTL.completeInstructionTokenLength +
      this.tokenConfig.reservedConversationTokens +
      this.tokenConfig.errorCorrectionTokens
    );
  }
}
