import { chalkRender } from "../utils/chalk-util";

export class ApplicationView {
  public renderInvalidDelimiter(input: string) {
    this.renderApplicationError(
      `You have given an invalid delimeter of: ("${input}")`
    );
    this.renderApplicationError(
      "Examples of valid delimeter inputs: `<<EOF` `<<HELLO_WORLD` `<<___`"
    );
  }

  public render(input: string) {
    chalkRender(input, "lightBlue");
    process.stdout.write("\n");
  }

  public renderApplicationError(input: string) {
    chalkRender(input, "lightRed");
    process.stdout.write("\n");
  }
}
