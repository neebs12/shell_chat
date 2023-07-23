import { marked } from "marked";
import chalk from "chalk";

const renderer = new marked.Renderer();

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

function postProcess(input: string): string {
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

export const mdLineStr = (input: string): string => {
  // this is ONLY for line by line makdown rendering
  renderer.code = function (code, language, isEscaped) {
    return chalk.gray("  " + code + "\n");
  };

  marked.setOptions({
    renderer,
    mangle: false, // prevent markdown from altering underscores
    headerIds: false, // prevent markdown from adding id's to headers
  });

  return postProcess(marked(input));
};

export const mdBlockStr = (input: string): string => {
  // this is ONLY for block makdown rendering
  renderer.code = function (code, language, isEscaped) {
    const spaces = `\n`;
    const trimmedCode = code.replace(/^\\n+|\\n+$/g, "");
    const retainFences = `\`\`\`${chalk.yellow(
      language
    )}\n${trimmedCode}\n\`\`\`${"\n".repeat(2)}`;
    return chalk.gray(retainFences);
  };

  marked.setOptions({
    renderer,
    mangle: false, // prevent markdown from altering underscores
    headerIds: false, // prevent markdown from adding id's to headers
  });

  return postProcess(marked(input));
};
