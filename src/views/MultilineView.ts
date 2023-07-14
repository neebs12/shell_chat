import chalk from "chalk";

export class MultilineView {
  public renderStartHeredocMode() {
    const str = chalk.dim.gray("Heredoc mode ...");
    process.stdout.write(str + "\n");
  }

  public renderEndHeredocMode() {
    const str = chalk.dim.gray("Heredoc mode deactivated...");
    process.stdout.write(str + "\n");
  }
}
