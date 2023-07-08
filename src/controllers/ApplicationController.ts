import * as readline from "readline";
import { CommandController } from "./CommandController";
import { SystemPromptController } from "./SystemPromptController";
import { ConversationHistoryController } from "./ConversationHistoryController";
import { NLController } from "./NLController";
import { ApplicationView } from "../views/ApplicationView";
import { MultilineController } from "./MultilineController";
import { art6, art7 } from "../utils/art";
import { chalkString } from "../utils/chalk-util";

export class ApplicationController {
  private applicationView: ApplicationView = new ApplicationView();
  private multilineController: MultilineController;
  private conversationHistoryController: ConversationHistoryController;
  private systemPromptController: SystemPromptController;
  private nlController: NLController;
  private commandController: CommandController;

  constructor(private filePaths: string[]) {
    this.filePaths = filePaths;

    this.multilineController = new MultilineController();
    this.conversationHistoryController = new ConversationHistoryController();
    this.systemPromptController = new SystemPromptController();
    this.nlController = new NLController({
      filePaths: this.filePaths,
      conversationHistoryController: this.conversationHistoryController,
      systemPromptController: this.systemPromptController,
    });
    this.commandController = new CommandController({
      conversationHistoryController: this.conversationHistoryController,
      systemPromptController: this.systemPromptController,
    });
  }

  public run(): void {
    this.applicationView.render(art7);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // immediately set the prompt
    rl.setPrompt(">>> ");
    rl.prompt();

    rl.on("line", async (input: string): Promise<void> => {
      try {
        input = processInput(input);
        const shouldContinue = await this.handleMultilineInput(rl, input);

        if (!shouldContinue) {
          return rl.prompt();
        }

        if (input === "") {
          return rl.prompt();
        } else if (input[0] === "/") {
          await this.commandController.handleCommand(input);
        } else {
          await this.nlController.handleNL(input);
        }
        return rl.prompt();
      } catch (error) {
        console.error("Error occured:", error);
        return rl.prompt();
      }
    });

    rl.on("close", () => {
      process.stdout.write("Exiting the program...");
      process.exit(0);
    });
  }

  private async handleMultilineInput(
    rl: readline.Interface,
    input: string
  ): Promise<boolean> {
    let isMultilineModeIgnored = true;
    if (input.slice(0, 2) === "<<" && !this.multilineController.mode) {
      // Case: starting mode
      const delimeter = input.split(" ")[0].slice(2);
      if (delimeter.length === 0) {
        this.applicationView.renderInvalidDelimiter(input);
        isMultilineModeIgnored = true;
      } else {
        this.multilineController.initialize(input);
        // rl.setPrompt(chalkString(`${delimeter}> `, "lightBlue"));
        rl.setPrompt(chalkString("📝 ", "lightBlue"));
        isMultilineModeIgnored = false;
      }
    } else if (
      input === this.multilineController.delimiter &&
      this.multilineController.mode
    ) {
      // Case: ending mode
      const nlBuffer = this.multilineController.returnBufferAndReset();
      await this.nlController.handleNL(nlBuffer);
      rl.setPrompt(">>> ");
      isMultilineModeIgnored = false;
    } else if (this.multilineController.mode) {
      // Case: continuing mode
      this.multilineController.addToBuffer(input);
      isMultilineModeIgnored = false;
    }
    return isMultilineModeIgnored;
  }
}

// util functions
// TODO: consider moving this to a separate file
const processInput = (input: string): string => {
  return input.trim();
};
