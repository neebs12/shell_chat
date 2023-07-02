import { chalkRender } from "../utils/chalk-util";
import chalk from "chalk";

export class CommandView {
  public render(input: string) {
    chalkRender(input, "lightBlue");
    process.stdout.write("\n");
  }

  public rendeeReserConversation() {
    this.render("Conversation has been reset 💬");
  }

  public renderFileAdd({
    pattern,
    filePaths,
  }: {
    pattern: string;
    filePaths: string[];
  }) {
    const headerEmoji = filePaths.length > 0 ? "✅" : "❌";
    const emoji = filePaths.length > 0 ? "📜" : "❌";
    this.render(
      `Glob (${pattern}), we have found AND added - (${filePaths.length}) ${headerEmoji}`
    );
    this.renderPatternAndFileNames({ emoji, pattern, filePaths });
  }

  public renderRemoveFile({
    pattern,
    filePaths,
  }: {
    pattern: string;
    filePaths: string[];
  }) {
    const headerEmoji = filePaths.length > 0 ? "✅" : "😔";
    const emoji = filePaths.length > 0 ? "🗑️" : "❌";
    this.render(
      `Glob (${pattern}), we have removed - (${filePaths.length}) ${headerEmoji}:`
    );
    this.renderPatternAndFileNames({ emoji, pattern, filePaths });
  }

  public renderListFilePaths(filePaths: string[]) {
    this.render(`The following files are being tracked 🕵️`);
    if (filePaths.length > 0) {
      filePaths.forEach((filePath) => {
        this.renderIgnoringCwd(`| 🔎 ${filePath}`);
      });
    } else {
      this.render(`❌ No files are being tracked`);
    }
  }

  public renderFindByPaths({
    pattern,
    filePaths,
  }: {
    pattern: string;
    filePaths: string[];
  }) {
    const headerEmoji = filePaths.length > 0 ? "✅" : "😔";
    const emoji = filePaths.length > 0 ? "🔎" : "❌";
    this.render(
      `Glob (${pattern}), we have found - (${filePaths.length}) ${headerEmoji}`
    );
    this.renderPatternAndFileNames({ emoji, pattern, filePaths });
  }

  public renderInvalidCommand(examples: string[]) {
    this.render(`Invalid use. Usage: /<cmd> ${examples.join(" ")}`);
  }

  private renderPatternAndFileNames({
    emoji,
    pattern,
    filePaths,
  }: {
    emoji?: string;
    pattern: string;
    filePaths: string[];
  }) {
    if (filePaths.length === 0) {
      this.render(`${emoji} None found...`);
      return;
    }

    // Sort array by number of found paths in ascending order
    const sortedFilepaths = filePaths.sort((a, b) => a.length - b.length);
    sortedFilepaths.forEach((filePath) =>
      this.renderIgnoringCwd(`| ${emoji} ${filePath}`)
    );
  }

  private renderIgnoringCwd(input: string) {
    const cwd = process.cwd();
    const cwdRegex = new RegExp(cwd, "g");
    const cwdMatches = input.match(cwdRegex);
    if (cwdMatches) {
      const cwdMatch = cwdMatches[0];
      const cwdIndex = input.indexOf(cwdMatch);
      const cwdLength = cwdMatch.length;
      const cwdEndIndex = cwdIndex + cwdLength;
      const cwdStart = input.slice(0, cwdIndex);
      const cwdEnd = input.slice(cwdEndIndex);
      const cwd = input.slice(cwdIndex, cwdEndIndex);
      const cwdColor = chalk.hex("#61afef").bold(cwd);
      const cwdIgnored = chalk.hex("#abb2bf").bold(cwdStart + cwdEnd);
      process.stdout.write(cwdIgnored + "\n");
    } else {
      chalkRender(input);
      process.stdout.write("\n");
    }
  }
}
