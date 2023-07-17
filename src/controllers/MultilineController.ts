// This controller stores the state of multiline mode (ie: if IS multiline in addition to the inputs)
import * as readline from "readline";
import { chalkString } from "../utils/chalk-util";
import { MultilineView } from "../views/MultilineView";
export class MultilineController {
  private _mode: boolean = false;
  private _delimiter: string = "";
  private _buffer: string[] = [];
  private _multilineView: MultilineView = new MultilineView();

  get mode(): boolean {
    return this._mode;
  }

  get delimiter(): string {
    return this._delimiter;
  }

  get buffer(): string[] {
    return [...this._buffer];
  }

  public setDelimiter(value: string): void {
    this._delimiter = value;
  }

  public setMode(value: boolean): void {
    this._mode = value;
  }

  public addToBuffer(input: string): void {
    this._buffer.push(input);
  }

  public clearBuffer(): void {
    this._buffer = [];
  }

  public initialize(input: string, prescribedDelim: string = ""): void {
    const delimeter =
      prescribedDelim === "" ? input.split(" ")[0].slice(2) : prescribedDelim;
    const firstInput = input.split(" ").slice(1).join(" ");
    this._mode = true;
    this._delimiter = delimeter;
    // conditionally accept firstInput IF the not empty
    firstInput.length !== 0 && this.addToBuffer(firstInput);
  }

  public returnBufferAndReset(): string {
    this._mode = false;
    this._delimiter = "";
    const nlBuffer = this._buffer.join("\n");
    // console.log({ receivedBuffer: this.buffer });
    this.clearBuffer();
    return nlBuffer;
  }

  private timestampArray: number[] = [];

  /**
   * Calculates the delay between the last two timestamps in the timestampArray
   * Used to delay following rl prints to prevent potential second rotation
   * @returns {number} The delay in milliseconds
   */
  private calculateDelay(): number {
    const latestTimestamp = this.timestampArray[this.timestampArray.length - 1];
    const defaultDelay = 200; // first delay
    const longDelay = 1500; // following delays
    const previousTimestamp =
      this.timestampArray[this.timestampArray.length - 2];
    const timeDiff = latestTimestamp - previousTimestamp;
    if (previousTimestamp !== undefined && timeDiff < defaultDelay) {
      return longDelay; // Increase delay to 1.5s if timestamps are too close
    } else {
      // console.log({ timestampArray: this.timestampArray });
      return defaultDelay; // Otherwise, use the default delay
    }
  }

  public async handleMultilineInput(
    rl: readline.Interface,
    input: string
  ): Promise<void> {
    if (input.slice(0, 2) === "<<" && !this.mode) {
      // Case: starting mode
      const delimeter = input.split(" ")[0].slice(2);
      delimeter.length === 0
        ? this.initialize(input, "eof")
        : this.initialize(input);
      this._multilineView.renderStartHeredocMode();
      // rl.setPrompt(chalkString(`(${this.delimiter})📝 `, "lightBlue"));
    } else if (input === this.delimiter && this.mode) {
      // Case: ending mode
      this.setMode(false);
      // rl.setPrompt(">>> ");
    } else if (this.mode) {
      this.addToBuffer(input);

      // Case: continuing mode
      // NOTE: HACKY attempt at preventing txt rotation
      //   at parts of buffer when user pastes large text, the longer the delay, the larger the piece of text that can be pasted in without encountering rotation. calculateDelay extends second rotation delay, but first rotation delay cannot be delayed due to logic of rendering
      this.timestampArray.push(Date.now()); // Store the current timestamp
      const delay = this.calculateDelay(); // Calculate the delay based on the timestamps
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
