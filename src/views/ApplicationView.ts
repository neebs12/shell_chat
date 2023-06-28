import { chalkRender } from "../utils/chalk-util";

export class ApplicationView {
  public render(input: string) {
    chalkRender(input, "lightBlue");
    process.stdout.write("\n");
  }
}
