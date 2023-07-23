import chalk from "chalk";
import { Art } from "../utils/art";

export class ApplicationView {
  private genericStyle = chalk.red;
  private highlightStyle = chalk.redBright.bold;
  private av = new Art(this.genericStyle, this.highlightStyle);

  public genericRender(input: string) {
    // chalkRender(input, chalkColor);
    process.stdout.write(input);
    // process.stdout.write(this.av.createMessage(input));
    process.stdout.write("\n");
  }

  public headerRender(input: string) {
    const str = this.av.createMessage(input);
    this.genericRender(str);
  }
}
