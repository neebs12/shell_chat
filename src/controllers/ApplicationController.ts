import * as readline from "readline";
import chalk from "chalk";
import { CommandController } from "./CommandController";
import { SystemPromptController } from "./SystemPromptController";
import { ConversationHistoryController } from "./ConversationHistoryController";
import { NLController } from "./NLController";
import { ApplicationView } from "../views/ApplicationView";
import { MultilineController } from "./MultilineController";
import { StateController } from "./StateController";
import { art7 } from "../utils/art";

export class ApplicationController {
  private applicationView: ApplicationView = new ApplicationView();
  private stateController: StateController;
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
    this.stateController = new StateController();
    this.nlController = new NLController({
      filePaths: this.filePaths,
      conversationHistoryController: this.conversationHistoryController,
      systemPromptController: this.systemPromptController,
    });
    this.commandController = new CommandController({
      conversationHistoryController: this.conversationHistoryController,
      systemPromptController: this.systemPromptController,
      stateController: this.stateController,
    });
  }

  public run(): void {
    this.applicationView.render(art7);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // immediately set the prompt
    rl.setPrompt(this.defaultPrompt());
    rl.prompt();

    rl.on("line", async (input: string): Promise<void> => {
      try {
        await this.multilineController.handleMultilineInput(rl, input);

        if (this.multilineController.mode) {
          rl.setPrompt(this.multilinePrompt());
          return; // returning nothing prevents rotation
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
        rl.setPrompt(this.defaultPrompt());
        return rl.prompt();
      } catch (error) {
        console.error("Error occured:", error);
        return rl.prompt();
      }
    });

    rl.on("close", async () => {
      await this.exitHook();
    });
  }

  /**
   * Saves the state of the application before exiting
   */
  private async exitHook(): Promise<void> {
    process.stdout.write("\n");

    const currName = this.stateController.getSaveName();
    if (currName) {
      // save state
      await this.stateController.saveStateInterface({
        saveName: this.stateController.getSaveName(),
        overwrite: true,
        conversationHistory:
          await this.conversationHistoryController.getConversationHistory(),
        trackedFiles: await this.systemPromptController.getFilePaths(),
      });
    } else {
      this.applicationView.render(
        `State unavailable, current save discarded...`
      );
    }

    this.applicationView.render("Exiting the program...");
    process.exit(0);
  }

  private defaultPrompt(): string {
    const name = this.stateController.getSaveName();
    const bracketedName = chalk.gray(`(${name})`);
    const promptStr = chalk.gray`${
      this.stateController.getSaveName() ? `${bracketedName}` : "##"
    }`;
    // const promptStr = `${name}> `;
    return promptStr + (name ? chalk.white : chalk.gray)`> `;
  }

  private multilinePrompt(): string {
    return "";
  }
}

// util functions
// TODO: consider moving this to a separate file
const processInput = (input: string): string => {
  return input.trim();
};
