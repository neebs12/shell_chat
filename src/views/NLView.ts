import { chalkRender } from "../utils/chalk-util";
export class NLView {
  public async renderNLError(input: string) {
    chalkRender(input, "lightRed");
    process.stdout.write("\n");
  }

  public async render(input: string, isToken: boolean = true) {
    chalkRender(input, "lightGreen");
    if (!isToken) {
      process.stdout.write("\n");
    }
  }

  public renderNewLine() {
    process.stdout.write("\n");
  }
}
