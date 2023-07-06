import chalk from "chalk";

export const color = {
  lightYellow: "#fddb45",
  lightOrange: "#f7a11b",
  lightGreen: "#98c379",
  lightBlue: "#61afef",
  lightRed: "#fc6777", // "#c24038"
  steelBlue: "#abb2bf",
  gold: "#ffd700",
  lightGray: "#d3d3d3",
  mediumGray: "#7a828a",
  darkGray: "#4b5263",
};

export const chalkRender = (
  input: string,
  myColor: keyof typeof color = "lightGreen"
) => {
  // process.stdout.write(input);
  process.stdout.write(chalk.hex(color[myColor]).bold(input));
};

export const chalkString = (
  input: string,
  myColor: keyof typeof color = "lightGreen"
) => {
  return chalk.hex(color[myColor]).bold(input);
};
