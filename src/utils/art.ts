import chalk from "chalk";
import { type Chalk } from "chalk";

export const processCenterMessage = (
  componentsArray: Array<{ content: string; styler: (str: string) => string }>,
  paddingChar: { content: string; styler: (str: string) => string },
  fallbackConsoleWidth: number = 80
): string => {
  let msg = componentsArray.map((component) => component.content).join("");
  const consoleWidth = process.stdout.columns || fallbackConsoleWidth;
  let paddingLen = Math.floor((consoleWidth - msg.length) / 2);

  const paddingString = Array(paddingLen).join(paddingChar.content);
  const styledMsg = componentsArray
    .map((component) => component.styler(component.content))
    .join("");
  const paddedMsg =
    paddingChar.styler(paddingString) +
    styledMsg +
    paddingChar.styler(paddingString);

  // Adjust for odd numbers
  const finalMsg =
    consoleWidth % 2 === msg.length % 2
      ? paddedMsg
      : paddedMsg + paddingChar.styler(paddingChar.content);

  return finalMsg;
};

export const processLeftMessage = (
  componentsArray: Array<{ content: string; styler: (str: string) => string }>,
  paddingChar: { content: string; styler: (str: string) => string },
  leftPaddingLen: number,
  fallbackConsoleWidth: number = 80
): string => {
  let msg = componentsArray.map((component) => component.content).join("");
  const consoleWidth = process.stdout.columns || fallbackConsoleWidth;

  // calculate right padding length by subtracting message length and left padding from console width
  let rightPaddingLen = Math.max(consoleWidth - leftPaddingLen - msg.length, 0);

  // Use the string repeat method here
  const leftPaddingString = paddingChar.content.repeat(leftPaddingLen);
  // slight allowance on right padding
  const rightPaddingString = paddingChar.content.repeat(rightPaddingLen - 1);

  const styledMsg = componentsArray
    .map((component) => component.styler(component.content))
    .join("");
  const paddedMsg =
    paddingChar.styler(leftPaddingString) +
    styledMsg +
    paddingChar.styler(rightPaddingString);

  return paddedMsg;
};

export class Art {
  constructor(private genericStyle: Chalk, private highlightStyle: Chalk) {}

  public generic(input: string) {
    return {
      content: input,
      styler: this.genericStyle,
    };
  }

  public highlight(input: string) {
    return {
      content: input,
      styler: this.highlightStyle,
    };
  }

  public scarfedStringify(
    ...componentsArray: Array<{
      content: string;
      styler: (str: string) => string;
    }>
  ) {
    // built in `#` and space
    const str = processLeftMessage(
      [
        { content: "##", styler: this.genericStyle.dim },
        { content: "# ", styler: this.genericStyle },
        ...componentsArray,
        { content: " ", styler: this.genericStyle },
        // { content: " ##", styler: this.genericStyle },
        // { content: "###", styler: this.genericStyle.dim },
      ],
      { content: "#", styler: chalk.dim.gray },
      0
    );
    return str;
  }

  public createMessage(message: string): string {
    // Preprocessing: replace escaped asterisks with a special character.
    message = message.replace(/\\\*/g, "```");

    // Split the string into parts.
    let parts = message.split("**");

    // Process parts for escaped asterisks.
    for (let i = 0; i < parts.length; i++) {
      // If a part ends with a backslash, it was an escaped asterisk.
      if (parts[i].endsWith("\\")) {
        // Remove the backslash.
        parts[i] = parts[i].slice(0, -1);
        // Append the ** back to the part, along with the next part.
        parts[i] += `**${parts[i + 1]}`;
        // Remove the next part, as it has been appended to the current part.
        parts.splice(i + 1, 1);
      }
    }

    // Continue as before...
    const messageParts = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        messageParts.push(this.generic(parts[i]));
      } else {
        messageParts.push(this.highlight(parts[i]));
      }
    }

    let str = this.scarfedStringify(...messageParts);
    // Postprocessing: replace the special character back with an asterisk.
    str = str.replace(/```/g, "*");
    return str;
  }
}

const art = new Art(chalk.cyan, chalk.redBright.bold);
export const art7 = `${art.createMessage("**SHELL CHAT**")}}`;
