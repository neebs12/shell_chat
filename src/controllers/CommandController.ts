import { SystemPromptController } from "./SystemPromptController";
import { ConversationHistoryController } from "./ConversationHistoryController";
import { CommandView } from "../views/CommandView";

import { findFilesWithName } from "../utils/file-search";

type CommandControllerDependencies = {
  systemPromptController: SystemPromptController;
  conversationHistoryController: ConversationHistoryController;
};
export class CommandController {
  private AVAILABLE_COMMANDS: string[] = [
    "/add",
    "/add-file",
    "/remove",
    "/remove-all",
    "/list",
    "/verbose",
    "/debug",
    "/reset",
  ];

  private systemPromptController: SystemPromptController;
  private conversationHistoryController: ConversationHistoryController;
  private commandView: CommandView = new CommandView();

  constructor({
    systemPromptController,
    conversationHistoryController,
  }: CommandControllerDependencies) {
    this.systemPromptController = systemPromptController;
    this.conversationHistoryController = conversationHistoryController;
  }

  public isCommandAvailable(command: string): boolean {
    return this.AVAILABLE_COMMANDS.includes(command);
  }

  // main command handler
  public async handleCommand(commandInput: string): Promise<void> {
    // this.commandView.render(`${command} not yet implemented`);
    const cmdArry = commandInput.split(" ");
    const cmd = cmdArry[0];
    if (!this.isCommandAvailable(cmd)) {
      this.commandView.render(`${cmd} is not a valid command`);
    } else if (cmd === "/reset") {
      await this.handleResetConversation();
    } else if (cmd === "/add") {
      await this.handleAdd(cmdArry);
    } else if (cmd === "/add-file") {
      await this.handleAddFile(cmdArry);
    } else if (cmd === "/remove") {
      await this.handleRemove(cmdArry);
    } else if (cmd === "/remove-all") {
      await this.handleRemoveAll();
    } else if (cmd === "/list") {
      await this.getAllFilePaths();
    } else {
      this.commandView.render(`${cmdArry[0]} has not yet been implemented`);
    }
  }

  private async handleResetConversation(): Promise<void> {
    await this.conversationHistoryController.resetConversationHistory();
    this.commandView.render("Conversation has been reset ♻️💬");
  }

  private async handleAdd(cmdArry: string[]): Promise<void> {
    const paths = cmdArry.slice(1);
    if (cmdArry.length < 2) {
      this.commandView.render(
        "Invalid `/add` command. Usage: /add <path/file> <path/file2>"
      );
      return;
    }

    const statuses = await this.systemPromptController.addFilePaths(paths);
    this.commandView.render(
      `The following files have been added(✅) or not added(❌):`
    );
    statuses.forEach((status, index) => {
      const currPath = paths[index];
      if (status) {
        this.commandView.render(`  ✅ ${currPath}`);
      } else {
        this.commandView.render(`  ❌ ${currPath}`);
      }
    });
  }

  private async handleAddFile(cmdArry: string[]): Promise<void> {
    const fileNames = cmdArry.slice(1);
    if (cmdArry.length < 2) {
      this.commandView.render(
        "Invalid `/add-file` command. Usage: /add-file file file2"
      );
      return;
    }
    // TODO: ignore dirs and max depth can be changed by the user later
    const IGNORE_DIRS = ["node_modules", ".git", ".vscode", "dist", "build"];
    const MAX_DEPTH = 4;

    const searchPromises = fileNames.map((fileName) =>
      findFilesWithName(fileName, IGNORE_DIRS, MAX_DEPTH)
    );

    const searchResults = await Promise.all(searchPromises);
    this.commandView.render(
      "The following files have been found for the given file names:"
    );

    fileNames.forEach((fileName, index) => {
      const filePaths = searchResults[index];
      if (filePaths.length === 0) {
        this.commandView.render(`  ❌ ${fileName} - None Found`);
      } else {
        this.commandView.render(
          `  ✅ ${fileName} - files: (${filePaths.length})`
        );
        filePaths.forEach((filePath) =>
          this.commandView.render(`    📁 ${filePath}`)
        );
      }
    });

    // flat & unique
    const flattenedSearchResults = searchResults.flat();
    const uniqueFilePaths = Array.from(new Set(flattenedSearchResults));
    // add the unique file paths, "" is a placeholder for the command to use this fn
    await this.handleAdd(["", ...uniqueFilePaths]);
  }

  private async handleRemove(cmdArry: string[]): Promise<void> {
    const paths = cmdArry.slice(1);
    if (cmdArry.length < 2) {
      this.commandView.render(
        "Invalid `/remove` command. Usage: /remove <filename> <path/file2>"
      );
      return;
    }

    const statuses = await this.systemPromptController.removeFilePaths(paths);
    this.commandView.render(
      `The following files have been removed(✅) or not removed(❌):`
    );
    statuses.forEach((status, index) => {
      const currPath = paths[index];
      if (status) {
        this.commandView.render(`  ✅ ${currPath}`);
      } else {
        this.commandView.render(`  ❌ ${currPath}`);
      }
    });
  }

  private async handleRemoveAll(): Promise<void> {
    await this.systemPromptController.removeAllFilePaths();
    this.commandView.render(`All files have been removed 🗑️`);
  }

  private async getAllFilePaths(): Promise<void> {
    const filePaths = await this.systemPromptController.getFilePaths();
    this.commandView.render(`The following files are being tracked 🕵️`);
    if (filePaths.length > 0) {
      filePaths.forEach((filePath) => {
        this.commandView.render(`  🔎 ${filePath}`);
      });
    } else {
      this.commandView.render(`  ❌ No files are being tracked`);
    }
  }
}
