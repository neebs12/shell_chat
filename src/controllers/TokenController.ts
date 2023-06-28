import { TokenConfig } from "./TokenControllerUtils/TokenConfig";
import { SystemPromptController } from "./SystemPromptController";
import { ConversationHistoryController } from "./ConversationHistoryController";
import { SPComponentsTLManager } from "./TokenControllerUtils/SPComponentsManager";
import { FPComponentsTLManager } from "./TokenControllerUtils/FPComponentsManager";
import { CHComponentsTLManager } from "./TokenControllerUtils/CHComponentsManager";
import { TokenReportBuilder } from "./TokenControllerUtils/TokenReportBuilder";
import { TokenView } from "../views/TokenView";

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

    const tokenReportBuilder = new TokenReportBuilder(
      this.tokenConfig,
      spComponentsWithTL,
      fpComponentsWithTL,
      chComponentsWithTL
    );

    const tokenReport = await tokenReportBuilder.build();
    render && this.tokenView.renderTokenReport(tokenReport);
  }
}
