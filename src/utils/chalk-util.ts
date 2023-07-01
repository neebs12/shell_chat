import chalk from "chalk";

export const color = {
  lightYellow: "#fddb45",
  lightOrange: "#f7a11b",
  lightGreen: "#98c379",
  lightBlue: "#61afef",
  lightRed: "#fc6777", // "#c24038"
};

export const chalkRender = (
  input: string,
  myColor: keyof typeof color = "lightGreen"
) => {
  // process.stdout.write(input);
  process.stdout.write(chalk.hex(color[myColor]).bold(input));
};
