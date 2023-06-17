export class CommandView {
  public render(input: string) {
    process.stdout.write(input);
    process.stdout.write("\n");
  }
}
