import * as readline from "readline";
import { CommandController } from "./CommandController";
import { SystemPromptController } from "./SystemPromptController";
import { ConversationHistoryController } from "./ConversationHistoryController";
import { NLController } from "./NLController";
import { ApplicationView } from "../views/ApplicationView";
import { art1, art2, art3, art4, art5, art6 } from "../utils/art";

export class ApplicationController {
  constructor(private filePaths: string[]) {
    const applicationView = new ApplicationView();
    applicationView.render(art6);
    this.filePaths = filePaths;
  }

  public run(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // immediately set the prompt
    // TODO: consider pre-rendering some message
    rl.setPrompt(">>> ");
    rl.prompt();

    const conversationHistoryController = new ConversationHistoryController();
    const systemPromptController = new SystemPromptController();
    const nlController = new NLController({
      filePaths: this.filePaths,
      conversationHistoryController,
      systemPromptController,
    });
    const commandController = new CommandController({
      conversationHistoryController,
      systemPromptController,
    });

    rl.on("line", async (input: string): Promise<void> => {
      try {
        input = processInput(input);
        if (input === "") {
          return rl.prompt();
        } else if (input[0] === "/") {
          await commandController.handleCommand(input);
        } else {
          await nlController.handleNL(input);
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
