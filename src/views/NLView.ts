import chalk from "chalk";
import { chalkRender, type color } from "../utils/chalk-util";
import { mdLineStr } from "../utils/marked-utils";
import { processCenterMessage } from "../utils/art";
import { Art } from "../utils/art";
import { Spinner } from "../utils/spinner";

// token-specific rendering
export class NLView {
  private genericStyle = chalk.blue;
  private highlightStyle = chalk.redBright.bold;
  private av = new Art(this.genericStyle, this.highlightStyle);

  public renderNLError(input: string) {
    const str = this.av.createMessage(input);
    process.stdout.write(str + "\n");
  }

  public render(
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

  public renderBgGrayColunm() {
    let width = process.stdout.columns;
    if (width === undefined) {
      width = 3;
    }
    process.stdout.write(chalk.dim.gray("#".repeat(width)) + "\n");
  }
}

// markdown-specific rendering
export class NLMDView {
  private spinner: Spinner = new Spinner();
  private genericStyle = chalk.gray;
  private highlightStyle = chalk.gray.bold;
  private av = new Art(this.genericStyle, this.highlightStyle);
  public nlView = new NLView();
  public isCodeBlock: boolean = false;
  public buffer: string[] = [];
  public isFirstRender: boolean = true;

  public handleStartCB() {
    // const str = processCenterMessage([], {
    //   content: "#",
    //   styler: chalk.dim.gray,
    // });
    // process.stdout.write(chalk.italic(str + "\n"));
    // process.stdout.write("\n");
    this.spinner.start();
  }

  public handleStreamCB(token: string) {
    this.spinner.incrementTokenCounter(token);
    const subTokenArry = token.split("\n");

    for (let ind = 0; ind < subTokenArry.length; ind += 1) {
      const currSubToken = subTokenArry[ind];
      const canFlipState = canFlipCodeBlockState({
        buffer: this.buffer,
        currSubToken,
      });
      if (canFlipState) {
        this.isCodeBlock = !this.isCodeBlock;
      }
      // now at last subToken
      if (ind === subTokenArry.length - 1) {
        if (subTokenArry.length == 1) {
          // if only one subToken, append
          this.buffer.push(currSubToken);
        } else {
          // else, start a new token
          this.buffer = [currSubToken];
        }
        continue;
      } else {
        this.buffer.push(currSubToken);
        const bufferStr = this.buffer.join("");
        // now either at start or middle of the overarching token
        // render as normally with normal conditionals
        if (this.isFirstRender) {
          this.isFirstRender = false;
          this.spinner.stop();
          process.stdout.write("\n");
          this.spinner.start();
        }

        if (this.isCodeBlock || canFlipState) {
          // render as codeblock
          // ora <--- clear & stop
          this.spinner.stop();
          this.renderLineNLMDAsCodeBlock(bufferStr);
          // ora <--- start
          this.spinner.start();
        } else if (bufferStr === "") {
          // ora <--- clear & stop
          this.spinner.stop();
          this.nlView.renderNewLine();
          // ora <--- start
          this.spinner.start();
        } else {
          // render normally (if it contains valu)
          // ora <--- clear & stop
          this.spinner.stop();
          this.renderLineNLMD(bufferStr);
          // ora <--- start
          this.spinner.start();
        }
        // reset buffer
        this.buffer = [];
      }
    }
  }

  public handleEndCB(tokensUsed: number) {
    const bufferStr = this.buffer.join("");
    if (this.isCodeBlock || bufferStr === "```") {
      // ora <--- clear & stop
      this.spinner.stop();
      this.spinner.resetTokenCounter();
      this.renderLineNLMDAsCodeBlock(bufferStr);
    } else {
      // ora <--- clear & stop
      this.spinner.stop();
      this.spinner.resetTokenCounter();
      this.renderLineNLMD(bufferStr);
    }
    this.buffer = [];
    this.isCodeBlock = false;
    // better than av.createMessage
    const str = chalk.italic(
      processCenterMessage(
        [
          { content: "##", styler: chalk.bold.gray },
          { content: ` ${tokensUsed.toString()}`, styler: chalk.gray.bold },
          { content: " tokens ", styler: chalk.gray.bold },
          { content: "##", styler: chalk.bold.gray },
        ],
        { content: "#", styler: chalk.dim.gray }
      )
    );
    process.stdout.write(str + "\n");
    this.isFirstRender = true;
  }

  public renderLineNLMDAsCodeBlock(input: string) {
    input = this.postProcess(input);
    if (input.startsWith("```")) {
      input = chalk.gray("```") + chalk.bold.yellow(input.slice(3));
    } else {
      input = chalk.italic.gray(input);
    }

    process.stdout.write(input + "\n");
  }

  public renderLineNLMD(input: string) {
    this.renderFullNLMD(input);
  }

  public renderFullNLMD(input: string) {
    const mdStr = mdLineStr(input);
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

// we know currSubToken is split by "\n"
const canFlipCodeBlockState = ({
  currSubToken,
  buffer,
}: {
  currSubToken: string;
  buffer: string[];
}): boolean => {
  const isFirstThreeBackticks = currSubToken.slice(0, 3) === "```";

  // three backtick case
  if (isFirstThreeBackticks) {
    return true;
  }

  const isFirstTwoBackTicks = currSubToken.slice(0, 2) === "``";
  // two backtick case
  if (isFirstTwoBackTicks) {
    // need to check buffer (enuf len to check last val)
    if (buffer.length >= 1) {
      const lastBufferVal = buffer[buffer.length - 1];
      // this last bufferVal needs to end in a backtick to complete a three-set
      const lastBufferValEndsWithBacktick = lastBufferVal === "`";
      if (lastBufferValEndsWithBacktick) {
        return true;
      }
    }
  }

  const isFirstBackTick = currSubToken[0] === "`";
  // one backtick case
  if (isFirstBackTick) {
    // need to check buffer length
    const lastBufferVal = buffer[buffer.length - 1];
    if (buffer.length >= 2) {
      const penultimateBufferVal = buffer[buffer.length - 2];
      if (
        (lastBufferVal === "`" && penultimateBufferVal === "`") ||
        lastBufferVal === "``"
      ) {
        return true;
      }
    } else if (buffer.length >= 1) {
      if (lastBufferVal === "``") {
        return true;
      }
    }
  }

  return false;
};
