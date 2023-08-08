import chalk from "chalk";
import { Art } from "../utils/art";

export class CommandView {
  public genericStyle = chalk.blue.bold;
  public highlightStyle = chalk.redBright.bold;
  private av = new Art(this.genericStyle, this.highlightStyle);

  public render(input: string) {
    process.stdout.write(input);
    process.stdout.write("\n");
  }

  public headerRender(input: string) {
    const str = this.av.createMessage(input);
    this.render(str);
  }

  private headerPattern(pattern: string) {
    return pattern.replace(/\*\*/g, "\\*\\*");
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
    this.headerRender(
      `Glob (**${this.headerPattern(pattern)}**) added **${
        filePaths.length
      }** files ${headerEmoji}`
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
    this.headerRender(
      `Glob (**${this.headerPattern(pattern)}**) removed **${
        filePaths.length
      }** files ${headerEmoji}:`
    );
    this.renderPatternAndFileNames({ emoji, pattern, filePaths });
  }

  public renderListFilePaths(filePaths: string[]) {
    this.headerRender(
      `We are tracking **${filePaths.length || "no"}** files 🕵️`
    );
    if (filePaths.length > 0) {
      filePaths.forEach((filePath) => {
        this.renderIgnoringCwd(`| 🔎 ${filePath}`);
      });
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
    this.headerRender(
      `Glob (**${this.headerPattern(pattern)}**) found **${
        filePaths.length
      }** files ${headerEmoji}`
    );
    this.renderPatternAndFileNames({ emoji, pattern, filePaths });
  }

  public renderInvalidCommand(examples: string[]) {
    this.headerRender(`Invalid use. Usage: **/<cmd> ${examples.join(" ")}**`);
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
      this.render(this.genericStyle(`${emoji} None found...`));
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

    if (cwdRegex.test(input)) {
      const simplifiedInput = input.replace(cwdRegex, ".");
      this.render(chalk.hex("#abb2bf").bold(simplifiedInput));
    } else {
      this.render(this.genericStyle(input));
    }
  }
}
