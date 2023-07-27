// Manually implemented spinner to
import cliSpinners from "cli-spinners";
import { Art } from "./art";
import chalk from "chalk";
import { TokenConfig } from "../controllers/TokenControllerUtils/TokenConfig";
const { frames, interval } = cliSpinners.dots12;

// get the longest frame
const longestFrameLength = frames.reduce((a, b) => Math.max(a, b.length), 0);

export class Spinner {
  private genericStyle = chalk.gray;
  private highlightStyle = chalk.gray.bold;
  private av = new Art(this.genericStyle, this.highlightStyle);
  private interval: number;
  private frames: string[];
  private frameIndex: number;
  private timer: NodeJS.Timeout | null;
  private tokenCounter: number = 0;

  private scarfCharcter = "#";
  private leftFillCharacter = "#";
  private rightFillCharacter = " ";

  constructor() {
    this.interval = interval;
    this.frames = frames;
    // this.frames = scarfedFrames;
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
      // const ratio = this.tokenCounter / new TokenConfig().maxCompletionTokens;
      // const midFilledLen = Math.min(
      //   Math.floor(ratio * availableLength),
      //   availableLength - 2
      // );
      const SPEEDFACTOR = 0.5;
      const midFilledLen = Math.floor(
        Math.min(
          (this.tokenCounter * SPEEDFACTOR) % availableLength,
          availableLength - 2
        )
      );

      let currFrame =
        (midFilledLen === 0 ? "" : " ") + this.frames[this.frameIndex];
      const midUnfilledLen = availableLength - midFilledLen - currFrame.length;
      currFrame = currFrame + (midUnfilledLen > 0 ? " " : "");

      // format here ONLY
      midStr =
        chalk.dim.gray(this.leftFillCharacter.repeat(midFilledLen)) +
        chalk.bold.gray(currFrame) +
        chalk.bold.gray(
          this.rightFillCharacter.repeat(
            midUnfilledLen > 0 ? midUnfilledLen : 0
          )
        );

      let str = chalk.dim.gray(leftScarf) + midStr + chalk.dim.gray(rightScarf);
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      process.stdout.write(str + "\r");
    }, this.interval);
  }

  // public start() {
  //   this.timer = setInterval(() => {
  //     const dynPosition = Math.max(
  //       Math.floor(
  //         (this.tokenCounter / new TokenConfig().maxCompletionTokens) *
  //           process.stdout.columns
  //       ),
  //       0
  //     );

  //     const actualPosition = Math.min(
  //       dynPosition,
  //       process.stdout.columns - longestFrameLength - 9
  //     );

  //     this.frameIndex = (this.frameIndex + 1) % this.frames.length;
  //     const currFrame = this.av.createMessage(
  //       `${"#".repeat(actualPosition)} **${this.frames[this.frameIndex]}**`
  //     );
  //     process.stdout.write(currFrame + "\r");
  //   }, this.interval);
  // }

  public stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
    }
    process.stdout.cursorTo(0);
    process.stdout.clearLine(0);
  }

  public incrementTokenCounter() {
    this.tokenCounter += 1;
  }

  public resetTokenCounter() {
    this.tokenCounter = 0;
  }
}
