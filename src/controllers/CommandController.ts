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
    "/find",
    "/verbose",
    "/debug",
    "/reset",
    "/cwd",
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
      await this.handleListFilePaths();
    } else if (cmd === "/find") {
      await this.handleFindByPaths(cmdArry);
    } else if (cmd === "/cwd") {
      // NOTE: This is for debugging purposes only
      await this.commandView.render(process.cwd());
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
        this.commandView.renderIgnoringCwd(`  ✅ ${currPath}`);
      } else {
        this.commandView.renderIgnoringCwd(`  ❌ ${currPath}`);
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

    const uniqueFilePaths = await this.handleFindByPaths(["", ...fileNames]);
    if (uniqueFilePaths.length !== 0) {
      this.commandView.render("--------------------------");
      await this.handleAdd(["", ...uniqueFilePaths]);
    }
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
        this.commandView.renderIgnoringCwd(`  ✅ ${currPath}`);
      } else {
        this.commandView.renderIgnoringCwd(`  ❌ ${currPath}`);
      }
    });
  }

  private async handleRemoveAll(): Promise<void> {
    await this.systemPromptController.removeAllFilePaths();
    this.commandView.render(`All files have been removed 🗑️`);
  }

  private async handleListFilePaths(): Promise<void> {
    const filePaths = await this.systemPromptController.getFilePaths();
    this.commandView.render(`The following files are being tracked 🕵️`);
    if (filePaths.length > 0) {
      filePaths.forEach((filePath) => {
        this.commandView.renderIgnoringCwd(`  🔎 ${filePath}`);
      });
    } else {
      this.commandView.render(`  ❌ No files are being tracked`);
    }
  }

  private async handleFindByPaths(cmdArry: string[]): Promise<string[]> {
    const fileNames = cmdArry.slice(1);
    if (cmdArry.length < 2) {
      this.commandView.render(
        "Invalid `/find` command. Usage: /find file1 partial/path/file2"
      );
      return [];
    }
    // TODO: ignore dirs and max depth can be changed by the user later
    const IGNORE_DIRS = ["node_modules", ".git", ".vscode", "dist", "build"];
    const MAX_DEPTH = 4;

    const searchPromises = fileNames.map((fileName) =>
      findFilesWithName(fileName, IGNORE_DIRS, MAX_DEPTH)
    );

    const searchResults = await Promise.all(searchPromises);
    // Create array of objects {fileName, filePaths}
    const filesAndPaths = fileNames.map((fileName, index) => ({
      fileName,
      filePaths: searchResults[index],
    }));

    // Sort array by number of found paths in ascending order
    const sortedFilesAndPaths = filesAndPaths.sort(
      (a, b) => b.filePaths.length - a.filePaths.length
    );

    this.commandView.render("For your paths and files, we have found:");

    sortedFilesAndPaths.forEach(({ fileName, filePaths }) => {
      if (filePaths.length === 0) {
        this.commandView.render(`  ❌ ${fileName} - files: (0)`);
      } else {
        this.commandView.render(
          `  🔎 ${fileName} - files: (${filePaths.length})`
        );
        filePaths.forEach((filePath) =>
          this.commandView.renderIgnoringCwd(`      ${filePath}`)
        );
      }
    });

    // flat & unique
    const flattenedSearchResults = searchResults.flat();
    const uniqueFilePaths = Array.from(new Set(flattenedSearchResults));
    return uniqueFilePaths;
  }
}
