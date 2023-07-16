import chalk from "chalk";
import { chalkRender, color } from "../utils/chalk-util";

export class ApplicationView {
  public render(input: string) {
    // chalkRender(input, chalkColor);
    process.stdout.write(chalk.red(input));
    process.stdout.write("\n");
  }
}
