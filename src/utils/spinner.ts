// Manually implemented spinner to
import cliSpinners from "cli-spinners";
import { Art } from "./art";
import chalk from "chalk";
import { TokenConfig } from "../controllers/TokenControllerUtils/TokenConfig";
const { frames, interval } = cliSpinners.noise;
const FRAME_REPEAT_FACTOR = 4;
const actualFrames = frames.flatMap((frame) =>
  Array(FRAME_REPEAT_FACTOR).fill(frame)
);
const actualInterval = interval / FRAME_REPEAT_FACTOR;

export class Spinner {
  private genericStyle = chalk.gray;
  private highlightStyle = chalk.gray.bold;
  private av = new Art(this.genericStyle, this.highlightStyle);
  private interval: number;
  private frames: string[];
  private frameIndex: number;
  private timer: NodeJS.Timeout | null;
  private tokenCounter: number = 0;

  private leftFillCharacter = "#";
  private rightFillCharacter = " ";

  constructor() {
    this.interval = actualInterval;
    this.frames = actualFrames;
    this.frameIndex = 0;
    this.timer = null;
  }

  public start() {
    this.timer = setInterval(() => {
      const totalLength = process.stdout.columns - 1;
      const leftScarf = "## ";
      const rightScarf = " ##";
      let midStr = " ".repeat(totalLength - (leftScarf + rightScarf).length);
      const availableLength = midStr.length;
      const ratio = this.tokenCounter / new TokenConfig().maxCompletionTokens;
      const SPEEDFACTOR = 1;

      // let midFilledLen = Math.min(
      //   Math.floor(ratio * availableLength * SPEEDFACTOR) % availableLength,
      //   availableLength - 2
      // );
      let midFilledLen = Math.min(
        Math.floor(this.tokenCounter * SPEEDFACTOR) % availableLength,
        availableLength - 2
      );

      if (Math.floor(this.tokenCounter * SPEEDFACTOR) / availableLength > 1) {
        this.rightFillCharacter = "#"; // filled
      } else {
        this.rightFillCharacter = " ";
      }

      let currFrame =
        (midFilledLen === 0 ? "" : " ") + this.frames[this.frameIndex];
      const midUnfilledLen = availableLength - midFilledLen - currFrame.length;
      currFrame = currFrame + (midUnfilledLen > 0 ? " " : "");

      // format here ONLY
      midStr =
        chalk.dim.gray(this.leftFillCharacter.repeat(midFilledLen)) +
        chalk.bold.yellowBright(currFrame) +
        chalk.dim.gray(
          this.rightFillCharacter.repeat(
            midUnfilledLen > 0 ? midUnfilledLen : 0
          )
        );

      let str = chalk.dim.gray(leftScarf) + midStr + chalk.dim.gray(rightScarf);
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      process.stdout.write(str + "\r");
    }, this.interval);
  }

  public stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
    }
    process.stdout.cursorTo(0);
    process.stdout.clearLine(0);
  }

  public incrementTokenCounter(str: string) {
    if (str.includes("\n")) {
      this.tokenCounter = 0;
    } else {
      this.tokenCounter += str.length;
    }
  }

  public resetTokenCounter() {
    this.tokenCounter = 0;
  }
}
