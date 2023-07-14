import { marked } from "marked";
import chalk from "chalk";

const renderer = new marked.Renderer();

// this is ONLY for line by line makdown rendering
// this will look weird on NORMAL markdown mode
// renderer.code = function (code, language, isEscaped) {
// const spaces = `\n`;
// const trimmedCode = code.replace(/^\\n+|\\n+$/g, "");
// const retainFences = `\`\`\`${language}\n${trimmedCode}\n\`\`\`${"\n".repeat(
//   2
// )}`;
// return chalk.gray(retainFences);
// return chalk.gray("  " + code + "\n");
// };

renderer.code = function (code, language, isEscaped) {
  return chalk.gray("  " + code + "\n");
};

renderer.heading = function (text, level) {
  return chalk.redBright.bold.underline(`\n${"#".repeat(level)} ${text}\n`);
};

renderer.strong = function (text) {
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
  return chalk.cyan(`${text}\n`);
};

renderer.list = function (body, ordered, start) {
  const lines = body.trim().split("\n");
  return lines
    .map((line, index) => {
      const prefix = ordered ? `${start + index}.` : "-";
      return `${chalk.gray(prefix)} ${line}\n`;
    })
    .join("");
};

renderer.listitem = function (text) {
  return chalk.cyan(text.trim());
};

renderer.hr = function () {
  return chalk.bold.gray("" + "-".repeat(3) + "\n");
};

renderer.link = function (href, title, text) {
  const link = chalk.blue.underline(`${href}`);
  return `${chalk.cyan(text)} (${link})`;
};

renderer.blockquote = function (quote) {
  return chalk.dim.italic(`> ${quote}`);
};

renderer.del = function (text) {
  return chalk.dim.strikethrough(`${text}`);
};

marked.setOptions({
  renderer,
  mangle: false, // prevent markdown from altering underscores
  headerIds: false, // prevent markdown from adding id's to headers
});

export const mdLineStr = (input: string): string => {
  return marked(input);
};
