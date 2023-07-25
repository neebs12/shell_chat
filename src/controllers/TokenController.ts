import { TokenConfig } from "./TokenControllerUtils/TokenConfig";
import { SystemPromptController } from "./SystemPromptController";
import { ConversationHistoryController } from "./ConversationHistoryController";
import { SPComponentsTLManager } from "./TokenControllerUtils/SPComponentsManager";
import { FPComponentsTLManager } from "./TokenControllerUtils/FPComponentsManager";
import { CHComponentsTLManager } from "./TokenControllerUtils/CHComponentsManager";
import {
  TokenReportBuilder,
  type TokenReport,
} from "./TokenControllerUtils/TokenReportBuilder";
import { TokenView } from "../views/TokenView";

import { getTokenLengthByInput } from "../utils/tiktoken-instance";
import { Message } from "../types";

type TokenControllerDependencies = {
  systemPromptController: SystemPromptController;
  conversationHistoryController: ConversationHistoryController;
};

const DEFAULT_LIMIT = 1000000;

export class TokenController {
  private conversationTLimit: number = DEFAULT_LIMIT;
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
    const tokenReport = await this.configureTokenReport();
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

    const controllingLimit = Math.min(
      this.conversationTLimit,
      Math.abs(tokensRemaining)
    );

    while (currCHTokens > controllingLimit) {
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

    if (condition)
      this.tokenView.renderFilesTooLargeError(
        await this.configureTokenReport()
      );

    return condition;
  }

  public async isNLInputTooLarge(input: string): Promise<boolean> {
    const inputTL = await getTokenLengthByInput(input);
    const tokenUsed =
      (await this.spTLManager.getSPComponentsTL())
        .completeInstructionTokenLength +
      this.tokenConfig.errorCorrectionTokens +
      this.tokenConfig.maxCompletionTokens;

    const tokensRemaining = this.tokenConfig.maxTokens - tokenUsed;
    const tokenRemainingCondition = inputTL > tokensRemaining;
    const tokenRemainingConditionWithLimit = inputTL > this.conversationTLimit;

    if (tokenRemainingCondition) {
      this.tokenView.renderNLInputTooLargeError({ inputTL, tokensRemaining });
    } else if (tokenRemainingConditionWithLimit) {
      this.tokenView.headerRender(`The input is **${inputTL}** tokens long`);
      this.tokenView.headerRender(
        `Use **/tl <number>** to increase the current conversation token limit of **${this.conversationTLimit}**`
      );
    }

    return tokenRemainingCondition;
  }

  public async getTokensUsedBySPCH(): Promise<number> {
    const spComponentsWithTL = await this.spTLManager.getSPComponentsTL();
    // We dont want the whole history, we want what is being used in the truncation
    // const chComponentsWithTL = await this.chTLManager.getCHComponentsTL();
    const truncatedCHArry = await this.getTruncatedConversationhistory();
    const chTruncatedTL = await CHComponentsTLManager.calculateTLForCH(
      truncatedCHArry
    );

    // SP + CH
    return spComponentsWithTL.completeInstructionTokenLength + chTruncatedTL;
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

  private async configureTokenReport(): Promise<TokenReport> {
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
    return tokenReport;
  }

  public async handleSetConversationLimit(value: string) {
    let numValue = Number(value);
    if (!Number.isInteger(numValue)) {
      this.tokenView.headerRender(`Input **${numValue}** is not an integer`);
    } else if (numValue < 0) {
      this.tokenView.headerRender(
        `Input **${numValue}** is not a **positive** integer`
      );
    } else {
      this.setConversationLimit(numValue);
      if (this.getConversationLimit() === DEFAULT_LIMIT) {
        this.tokenView.headerRender(
          `Conversation token limit is set to **${numValue}** 👍`
        );
      } else {
        this.tokenView.headerRender(
          `Conversation token limit is set from **${this.getConversationLimit()}** to **${numValue}** 👍`
        );
      }
    }
  }

  public getConversationLimit(): number {
    return this.conversationTLimit;
  }

  public setConversationLimit(value: number): void {
    this.conversationTLimit = value;
  }

  public resetConversationLimit(): void {
    this.conversationTLimit = 1000000;
  }
}
