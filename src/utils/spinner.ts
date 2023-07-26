// Manually implemented spinner to
import cliSpinners from "cli-spinners";
import { processCenterMessage, Art } from "./art";
import chalk from "chalk";

const { frames, interval } = cliSpinners.pong;
const longestFrameLength = frames.reduce((acc, curr) => {
  return curr.length > acc ? curr.length : acc;
}, 0);

const scarfedFrames = frames.map((frame) => {
  const str = processCenterMessage(
    [
      {
        content: "###",
        styler: chalk.dim.cyan,
      },
      { content: "##", styler: chalk.cyan.bold },
      { content: ` ${frame} `, styler: chalk.cyan.bold },
      { content: "##", styler: chalk.cyan.bold },
      {
        content: "###",
        styler: chalk.dim.cyan,
      },
    ],
    {
      content: "#",
      styler: chalk.dim.gray,
    }
  );
  return str;
});

export class Spinner {
  private genericStyle = chalk.cyan;
  private highlightStyle = chalk.cyan.bold;
  private av = new Art(this.genericStyle, this.highlightStyle);
  private interval: number;
  private frames: string[];
  private frameIndex: number;
  private timer: NodeJS.Timeout | null;

  constructor() {
    this.interval = interval;
    this.frames = frames;
    // this.frames = scarfedFrames;
    this.frameIndex = 0;
    this.timer = null;
  }

  public start() {
    this.timer = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      const currFrame = this.av.createMessage(
        `**${this.frames[this.frameIndex]}**`
      );
      process.stdout.write(currFrame + "\r");
      // process.stdout.write(this.frames[this.frameIndex] + "\r");
    }, this.interval);
  }

  public clearAndStopAtPosition(position: number) {
    if (this.timer !== null) {
      clearInterval(this.timer);
    }

    process.stdout.cursorTo(position);
    process.stdout.clearLine(1);
    process.stdout.cursorTo(position);
  }

  public stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
    }
    process.stdout.cursorTo(0);
    process.stdout.clearLine(0);
  }

  public clear() {
    process.stdout.cursorTo(0);
    process.stdout.clearLine(0);
  }
}
