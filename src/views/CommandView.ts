import chalk from "chalk";
export class CommandView {
  public render(input: string) {
    const chalkRender = (input: string) => {
      // process.stdout.write(input);
      const color = {
        lightYellow: "#fddb45",
        lightOrange: "#f7a11b",
        lightGreen: "#98c379",
        lightBlue: "#61afef",
      };

      process.stdout.write(chalk.hex(color.lightBlue).bold(input));
    };
    chalkRender(input);
    process.stdout.write("\n");
  }
}
