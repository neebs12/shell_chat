import { chalkRender } from "../utils/chalk-util";
import { type TokenReport } from "../controllers/TokenControllerUtils/TokenReportBuilder";

export class TokenView {
  public render(input: string) {
    chalkRender(input, "lightBlue");
    process.stdout.write("\n");
  }

  public renderTokenReport(tokenReport: TokenReport) {
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
    // start rendering here via this.render(...)
    const tokensRemainingEmoji =
      tokenReport.totalTokensRemaining > 0 ? "✅" : "❌";
    let output = "";
    output += "Token Report";
    output += "\n-------------";
    output += `\nTotal Tokens Remaining: ${tokenReport.totalTokensRemaining} ${tokensRemainingEmoji}`;
    output += `\nTokens Budgetted: ${tokenReport.tokensBudgeted}`;
    output += `\nTokens Used: ${tokenReport.tokensUsed}`;
    output += `\nTotal for Files: ${tokenReport.totalForFiles}`;
    output += `\nFile Breakdown:`;
    tokenReport.fileBreakdown.forEach((file) => {
      output += `\n  ${file.fileName}: ${file.tokenLength}`;
    });
    output += `\nSystem Prompt Total Tokens: ${tokenReport.systemPromptTotalTokens}`;
    output += `\nSystem Prompt Breakdown:`;
    output += `\n  Prefix Instruction: ${tokenReport.systemPromptBreakdown.prefixInstruction}`;
    output += `\n  Injection Instruction: ${tokenReport.systemPromptBreakdown.injectionInstruction}`;
    output += `\n  Suffix Instruction: ${tokenReport.systemPromptBreakdown.suffixInstruction}`;
    output += `\nConversation Buffer: ${tokenReport.conversationBuffer}`;
    output += `\nError Correction: ${tokenReport.errorCorrection}`;
    output += `\n(Unaccounted) Conversation History: ${tokenReport.unaccountedConversationHistory}`;
    this.render(output);
  }
}
