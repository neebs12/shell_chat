import { chalkRender } from "../utils/chalk-util";
import chalk from "chalk";

export class CommandView {
  public rendeeReserConversation() {
    this.render("Conversation has been reset 💬");
  }

  public renderPathAdd(paths: string[], statuses: boolean[]) {
    this.render(`The following files have been added(✅) or not added(❌):`);
    statuses.forEach((status, index) => {
      const currPath = paths[index];
      if (status) {
        this.renderIgnoringCwd(`  ✅ ${currPath}`);
      } else {
        this.renderIgnoringCwd(`  ❌ ${currPath}`);
      }
    });
  }

  public renderFileAdd(
    searchResults: { fileName: string; filePaths: string[] }[]
  ) {
    // Sort array by number of found paths in ascending order
    const sortedFilesAndPaths = searchResults.sort(
      (a, b) => b.filePaths.length - a.filePaths.length
    );

    this.render("For your files, we have found AND added:");

    sortedFilesAndPaths.forEach(({ fileName, filePaths }) => {
      if (filePaths.length === 0) {
        this.render(`  ❌ ${fileName} - files: (0)`);
      } else {
        this.render(`  🔎 ${fileName} - files: (${filePaths.length})`);
        filePaths.forEach((filePath) =>
          this.renderIgnoringCwd(`      ${filePath}`)
        );
      }
    });
  }

  public renderRemoveFile(paths: string[], statuses: boolean[]) {
    this.render(
      `The following files have been removed(✅) or not removed(❌):`
    );
    statuses.forEach((status, index) => {
      const currPath = paths[index];
      if (status) {
        this.renderIgnoringCwd(`  ✅ ${currPath}`);
      } else {
        this.renderIgnoringCwd(`  ❌ ${currPath}`);
      }
    });
  }

  public renderListFilePaths(filePaths: string[]) {
    this.render(`The following files are being tracked 🕵️`);
    if (filePaths.length > 0) {
      filePaths.forEach((filePath) => {
        this.renderIgnoringCwd(`  🔎 ${filePath}`);
      });
    } else {
      this.render(`  ❌ No files are being tracked`);
    }
  }

  public renderFindByPaths(
    searchResults: { fileName: string; filePaths: string[] }[]
  ) {
    // Sort array by number of found paths in ascending order
    const sortedFilesAndPaths = searchResults.sort(
      (a, b) => b.filePaths.length - a.filePaths.length
    );

    this.render("For your paths and files, we have found:");

    sortedFilesAndPaths.forEach(({ fileName, filePaths }) => {
      if (filePaths.length === 0) {
        this.render(`  ❌ ${fileName} - files: (0)`);
      } else {
        this.render(`  🔎 ${fileName} - files: (${filePaths.length})`);
        filePaths.forEach((filePath) =>
          this.renderIgnoringCwd(`      ${filePath}`)
        );
      }
    });
  }

  public renderInvalidCommand(examples: string[]) {
    this.render(`Invalid use. Usage: /<cmd> ${examples.join(" ")}`);
  }

  public render(input: string) {
    chalkRender(input, "lightBlue");
    process.stdout.write("\n");
  }

  public renderIgnoringCwd(input: string) {
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
