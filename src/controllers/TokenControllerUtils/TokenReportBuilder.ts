import { TokenConfig } from "./TokenConfig";
import { type SPComponentsWithTL } from "./SPComponentsManager";
import { type FPComponentsWithTLTotal } from "./FPComponentsManager";
import { type CHComponentsWithTL } from "./CHComponentsManager";

export type TokenReport = {
  totalTokensRemaining: number;
  tokensBudgeted: number;
  tokensUsed: number;
  totalForFiles: number;
  fileBreakdown: { fileName: string; tokenLength: number }[];
  systemPromptTotalTokens: number;
  systemPromptBreakdown: {
    prefixInstruction: number;
    injectionInstruction: number;
    suffixInstruction: number;
  };
  conversationBuffer: number;
  errorCorrection: number;
  unaccountedConversationHistory: number;
};

export class TokenReportBuilder {
  constructor(
    private totalTokensUsed: number,
    private tokenConfig: TokenConfig,
    private spComponentsWithTL: SPComponentsWithTL,
    private fpComponentsWithTL: FPComponentsWithTLTotal,
    private chComponentsWithTL: CHComponentsWithTL
  ) {}

  public async build(): Promise<TokenReport> {
    // this function will interact with the SPC to get the token report
    // this token report will display the following
    // - Total Tokens Remaining:
    // - Tokens Budgetted: (just max tokens)
    // - Tokens Used: (SP + CB + ER)
    // - Total for Files: `<>`
    //   - File1: `<>`
    //   - File2: `<>`
    //   - File3: `<>`
    // - System Prompt Total Tokens: `<>`
    //   - Prefix Instruction: `<>`
    //   - Injection Files: `<>`
    //   - Sufffix Instruction: `<>`
    // - Conversation Buffer: `<>`
    // - Error Correction: `<>`
    // - (Unaccounted) Conversation History: `<>`
    // All of this information will be outputted to an object

    const fileBreakdown =
      this.fpComponentsWithTL.filePathsAndContentWithTokenLength.map((fpc) => {
        return {
          fileName: fpc.fileName,
          tokenLength: fpc.contentTokenLength,
        };
      });

    const systemPromptBreakdown = {
      prefixInstruction: this.spComponentsWithTL.prefixInstructionTokenLength,
      injectionInstruction:
        this.spComponentsWithTL.injectionInstructionTokenLength,
      suffixInstruction: this.spComponentsWithTL.suffixInstructionTokenLength,
    };

    const returnObject = {
      totalTokensRemaining: this.tokenConfig.maxTokens - this.totalTokensUsed,
      tokensBudgeted: this.tokenConfig.maxTokens,
      tokensUsed: this.totalTokensUsed,
      totalForFiles: this.fpComponentsWithTL.filesTotalTokenLength,
      fileBreakdown: fileBreakdown,
      systemPromptTotalTokens:
        this.spComponentsWithTL.completeInstructionTokenLength,
      systemPromptBreakdown: systemPromptBreakdown,
      conversationBuffer: this.tokenConfig.reservedConversationTokens,
      errorCorrection: this.tokenConfig.errorCorrectionTokens,
      unaccountedConversationHistory:
        this.chComponentsWithTL.conversationHistoryTokenLength,
    };

    return returnObject;
  }
}
