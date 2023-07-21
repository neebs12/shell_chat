import chalk from "chalk";

export class ApplicationView {
  public render(input: string) {
    // chalkRender(input, chalkColor);
    process.stdout.write(chalk.red(input));
    process.stdout.write("\n");
  }
}
