import chalk from "chalk";

export class NLView {
  public async render(input: string, isToken: boolean = true) {
    // const chalk: any = (await import("chalk")).default;
    const chalkRender = (input: string) => {
      // process.stdout.write(input);
      const color = {
        lightYellow: "#fddb45",
        lightOrange: "#f7a11b",
        lightGreen: "#98c379",
        lightBlue: "#61afef",
      };

      process.stdout.write(chalk.hex(color.lightGreen).bold(input));
      // process.stdout.write(chalk.hex("#f7a11b").bold(input));
    };
    // process.stdout.write(input);
    chalkRender(input);
    if (!isToken) {
      process.stdout.write("\n");
    }
  }

  public renderNewLine() {
    process.stdout.write("\n");
  }
}
