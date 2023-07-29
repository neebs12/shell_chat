import chalk from "chalk";
import { Art } from "../utils/art";
export class MultilineView {
  private genericStyle = chalk.cyan.italic;
  private highlightStyle = chalk.redBright.bold;
  private av = new Art(this.genericStyle, this.highlightStyle);

  public render(input: string) {
    process.stdout.write(input);
    process.stdout.write("\n");
  }

  public headerRender(input: string) {
    const str = this.av.createMessage(input);
    this.render(str);
  }

  public renderStartHeredocMode(delimeter: string) {
    this.headerRender(
      `Multiline Mode Started: enter **${delimeter}** to submit`
    );
  }

  public renderEndHeredocMode(delimeter: string) {
    this.headerRender(
      `Multiline Mode Ended: detected **${delimeter}**, now submitting`
    );
  }
}
