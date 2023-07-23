import chalk from "chalk";
import { Art } from "../utils/art";
import { chalkRender, color, chalkString } from "../utils/chalk-util";
import { type TokenReport } from "../controllers/TokenControllerUtils/TokenReportBuilder";

export class TokenView {
  private genericStyle = chalk.blue;
  private highlightStyle = chalk.redBright.bold;
  private av = new Art(this.genericStyle, this.highlightStyle);

  public headerRender(input: string) {
    const str = this.av.createMessage(input);
    this.render(str);
  }

  public render(input: string, renderColor: keyof typeof color = "lightBlue") {
    chalkRender(input, renderColor);
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
    let maxFileNameLength = Math.max(
      ...tokenReport.fileBreakdown.map((file) => file.fileName.length)
    );
    output += `\n| 📚 ${"Filename".padEnd(maxFileNameLength)}: Tokens`;

    tokenReport.fileBreakdown
      .sort((a, b) => b.tokenLength - a.tokenLength)
      .forEach((file) => {
        let paddedFileName = file.fileName.padEnd(maxFileNameLength);
        output += `\n| 📜 ${chalkString(
          `${paddedFileName}: ${file.tokenLength}`,
          "steelBlue"
        )}`;
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

  public renderFilesTooLargeError(tokenReport: TokenReport) {
    this.headerRender(
      `Files **exceed usage by ${
        tokenReport.totalTokensRemaining * -1
      }** tokens. Use:`
    );
    this.headerRender("- **/tr** to see tokens per file.");
    this.headerRender(
      "- **/rf <glob-pattern>** to remove reduce files tracked."
    );
  }

  public renderNLInputTooLargeError({
    inputTL,
    tokensRemaining,
  }: {
    inputTL: number;
    tokensRemaining: number;
  }) {
    this.headerRender("Natural Langauge input is **too long**.");
    this.headerRender(`- Input Token Length is: **${inputTL}**`);
    this.headerRender(`- Remaining tokens is is: **${tokensRemaining}**`);
  }
}
