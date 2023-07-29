import * as readline from "readline";
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

  public async handleMultilineInput(
    rl: readline.Interface,
    input: string
  ): Promise<void> {
    if (input.endsWith("\\") && !this.mode) {
      // Case: starting mode
      const DEFAULT_DELIMETER = "eof";
      this.initialize(input.slice(0, input.length - 1), DEFAULT_DELIMETER);
      this._multilineView.renderStartHeredocMode(DEFAULT_DELIMETER);
    } else if (input === this.delimiter && this.mode) {
      // Case: ending mode
      this.setMode(false);
      this._multilineView.renderEndHeredocMode(this.delimiter);
    } else if (this.mode) {
      this.addToBuffer(input);
    }
  }
}
