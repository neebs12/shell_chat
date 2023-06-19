import chalk from "chalk";
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

export class CommandView {
  public render(input: string) {
    chalkRender(input);
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
