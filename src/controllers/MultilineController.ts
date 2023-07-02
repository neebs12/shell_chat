// This controller stores the state of multiline mode (ie: if IS multiline in addition to the inputs)
import { type Interface } from "readline";
export class MultilineController {
  private _mode: boolean = false;
  private _delimiter: string = "";
  private _buffer: string[] = [];

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

  public initialize(input: string): void {
    const delimeter = input.split(" ")[0].slice(2);
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
    // console.log({ receivedBuffer: this.getBuffer() });
    this.clearBuffer();
    return nlBuffer;
  }
}
