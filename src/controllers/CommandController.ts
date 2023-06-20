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
    "/path-add",
    "/pa",
    "/find",
    "/f",
    "/find-add",
    "/fa",
    "/add", // same as file-add
    "/remove-file",
    "/rf",
    "/remove-file-all",
    "/rfa",
    "/list",
    "/ls",
    "/reset-conversation",
    "/rc",
    "/reset-all", // resets convo and revmoves files
    "/ra",
    "/save",
    "/s",
    "/verbose",
    "/debug",
    "/cwd",
    "/pwd",
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
    } else if (cmd === "/path-add" || cmd === "/pa") {
      await this.handlePathAdd(cmdArry);
    } else if (cmd === "/find" || cmd === "/f") {
      await this.handleFindByPaths(cmdArry);
    } else if (cmd === "/find-add" || cmd === "/fa" || cmd === "/add") {
      await this.handleFileAdd(cmdArry);
    } else if (cmd === "/remove-file" || cmd === "/rf") {
      await this.handleRemoveFile(cmdArry);
    } else if (cmd === "/remove-file-all" || cmd === "/rfa") {
      await this.handleRemoveFileAll();
    } else if (cmd === "/list" || cmd === "/ls") {
      await this.handleListFilePaths();
    } else if (cmd === "/reset-conversation" || cmd === "/rc") {
      await this.handleResetConversation();
    } else if (cmd === "/reset-all" || cmd === "/ra") {
      await this.handleResetAll();
    } else if (cmd === "/cwd" || cmd === "/pwd") {
      // NOTE: This is for debugging purposes only
      await this.commandView.render(process.cwd());
    } else {
      this.commandView.render(`${cmdArry[0]} has not yet been implemented`);
    }
  }

  private async handleResetConversation(): Promise<void> {
    await this.conversationHistoryController.resetConversationHistory();
    this.commandView.render("Conversation has been reset 💬");
  }

  private async handlePathAdd(cmdArry: string[]): Promise<void> {
    const paths = cmdArry.slice(1);
    if (cmdArry.length < 2) {
      this.commandView.render(
        "Invalid usage command. Usage: /<cmd> <path/to/file> <path/to/file2>"
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

  private async handleFileAdd(cmdArry: string[]): Promise<void> {
    const fileNames = cmdArry.slice(1);
    if (cmdArry.length < 2) {
      this.commandView.render(
        "Invalid `/<cmd>` command. Usage: /<cmd> <file> <partial/path/file2>"
      );
      return;
    }

    const uniqueFilePaths = await this.handleFindByPaths(["", ...fileNames]);
    if (uniqueFilePaths.length !== 0) {
      this.commandView.render("--------------------------");
      await this.handlePathAdd(["", ...uniqueFilePaths]);
    }
  }

  private async handleRemoveFile(cmdArry: string[]): Promise<void> {
    const paths = cmdArry.slice(1);
    if (cmdArry.length < 2) {
      this.commandView.render(
        "Invalid `/<cmd>` command. Usage: /<cmd> <file> <path/file2>"
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

  private async handleRemoveFileAll(): Promise<void> {
    await this.systemPromptController.removeAllFilePaths();
    this.commandView.render(`All files have been removed 🗑️`);
  }

  private async handleResetAll(): Promise<void> {
    await this.handleResetConversation();
    await this.handleRemoveFileAll();
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
        "Invalid `/<cmd>` command. Usage: /<cmd> <file> <partial/path/file2>"
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
