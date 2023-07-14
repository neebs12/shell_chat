import * as readline from "readline";
import { CommandController } from "./CommandController";
import { SystemPromptController } from "./SystemPromptController";
import { ConversationHistoryController } from "./ConversationHistoryController";
import { NLController } from "./NLController";
import { ApplicationView } from "../views/ApplicationView";
import { MultilineController } from "./MultilineController";
import { art7 } from "../utils/art";
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
        await this.multilineController.handleMultilineInput(rl, input);

        if (this.multilineController.mode) {
          return rl.prompt();
        }

        input = processInput(input);
        if (input === "") {
          return rl.prompt();
        } else if (input[0] === "/") {
          await this.commandController.handleCommand(input);
        } else {
          if (input === this.multilineController.delimiter) {
            input = this.multilineController.returnBufferAndReset();
          }
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
}

// util functions
// TODO: consider moving this to a separate file
const processInput = (input: string): string => {
  return input.trim();
};
