import { marked, Renderer } from "marked";
import chalk from "chalk";
import { chalkRender, type color } from "../utils/chalk-util";

const renderer = new marked.Renderer();

// this is ONLY for line by line makdown rendering
// this will look weird on NORMAL markdown mode
renderer.code = function (code, language, isEscaped) {
  // const spaces = `\n`;
  // const trimmedCode = code.replace(/^\\n+|\\n+$/g, "");
  // const retainFences = `\`\`\`${language}\n${trimmedCode}\n\`\`\`${"\n".repeat(
  //   2
  // )}`;
  // return chalk.gray(retainFences);
  return chalk.gray("  " + code + "\n");
};

renderer.heading = function (text, level) {
  return chalk.redBright.bold.underline(`\n${"#".repeat(level)} ${text}\n`);
  // return chalk.yellow(`\n${"#".repeat(level)} ${text}\n`);
  // return chalk.bgGreen(`\n${"#".repeat(level)} ${text}\n`);
};

renderer.strong = function (text) {
  // return chalk.hex("#f48e95").bold.underline(`${text}`);
  return chalk.redBright.bold(`${text}`);
};

renderer.em = function (text) {
  return chalk.redBright.italic(`${text}`);
};

renderer.codespan = function (text) {
  const retainFences = `\`${text}\``;
  return chalk.yellow(retainFences);
};

renderer.paragraph = function (text) {
  // "#d1cbbf"
  // return chalk.hex("#858584")(`${text}\n`);
  return chalk.cyan(`${text}\n`);
};

renderer.list = function (body, ordered, start) {
  const lines = body.trim().split("\n");
  return lines
    .map((line, index) => {
      const prefix = ordered ? `${start + index}.` : "-";
      return `${chalk.cyan(prefix)} ${line}\n`;
    })
    .join("");
};

renderer.listitem = function (text) {
  return chalk.cyan(text.trim());
};

marked.setOptions({
  renderer,
  mangle: false, // prevent markdown from altering underscores
  headerIds: false, // prevent markdown from adding id's to headers
});

// markdown-specific rendering
export class NLMDView {
  public async renderLineNLMDAsCodeBlock(input: string) {
    input = this.postProcess(input);
    input = chalk.gray(input);
    process.stdout.write(input + "\n");
  }

  public async renderLineNLMD(input: string) {
    this.renderFullNLMD(input);
  }

  public async renderFullNLMD(input: string) {
    const mdStr = marked(input);
    let postProcessedStr = this.postProcess(mdStr);
    process.stdout.write(postProcessedStr);
  }

  private postProcess(input: string): string {
    input = input.replace(/<br>/g, "\n");

    const htmlDecode = (input: string) => {
      for (const [key, value] of Object.entries({
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        // add more if needed
      })) {
        input = input.replace(new RegExp(key, "g"), value);
      }
      return input;
    };

    return htmlDecode(input);
  }
}

// token-specific rendering
export class NLView {
  public async renderNLError(input: string) {
    chalkRender(input, "lightRed");
    process.stdout.write("\n");
  }

  public async render(
    input: string,
    isToken: boolean = true,
    colour: keyof typeof color = "lightGreen"
  ) {
    chalkRender(input, colour);
    if (!isToken) {
      process.stdout.write("\n");
    }
  }

  public renderNewLine() {
    process.stdout.write("\n");
  }
}
