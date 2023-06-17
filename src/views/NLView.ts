// import chalk from "chalk";

export class NLView {
  public async render(input: string, isToken: boolean = true) {
    // const chalk: any = (await import("chalk")).default;
    const chalkRender = (input: string) => {
      process.stdout.write(input);
      // return process.stdout.write(chalk.hex("#fddb45")(input));
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
