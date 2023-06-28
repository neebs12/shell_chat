import path from "path";

import { TokenController } from "./TokenController";
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
    "/token-report", // all token breakdown
    "/tr",
    "/token-files", // token remaining + file breakdown only
    "/tf",
    "/verbose",
    "/debug",
    "/cwd",
    "/pwd",
  ];

  private tokenController: TokenController;
  private systemPromptController: SystemPromptController;
  private conversationHistoryController: ConversationHistoryController;
  private commandView: CommandView = new CommandView();

  constructor({
    systemPromptController,
    conversationHistoryController,
  }: CommandControllerDependencies) {
    this.systemPromptController = systemPromptController;
    this.conversationHistoryController = conversationHistoryController;
    this.tokenController = new TokenController({
      systemPromptController,
      conversationHistoryController,
    });
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
    } else if (cmd === "/token-report" || cmd === "/tr") {
      await this.handleTokenReport();
    } else if (cmd === "/token-files" || cmd === "/tf") {
      await this.handleTokenFiles();
    } else if (cmd === "/cwd" || cmd === "/pwd") {
      // NOTE: This is for debugging purposes only
      await this.commandView.render(process.cwd());
    } else {
      this.commandView.render(`${cmdArry[0]} has not yet been implemented`);
    }
  }

  private async handleResetConversation(render: boolean = true): Promise<void> {
    await this.conversationHistoryController.resetConversationHistory();
    render && this.commandView.render("Conversation has been reset 💬");
  }

  private async handlePathAdd(
    cmdArry: string[],
    render: boolean = true
  ): Promise<void> {
    const paths = cmdArry.slice(1);
    if (cmdArry.length < 2) {
      this.commandView.renderInvalidCommand([
        "<path/to/file>",
        "<path/to/file2>",
      ]);
      return;
    }

    const statuses = await this.systemPromptController.addFilePaths(paths);
    render && this.commandView.renderPathAdd(paths, statuses);
  }

  private async handleFileAdd(
    cmdArry: string[],
    render: boolean = true
  ): Promise<void> {
    const fileNames = cmdArry.slice(1);
    if (cmdArry.length < 2) {
      this.commandView.renderInvalidCommand(["<file>", "<partial/path/file2>"]);
      return;
    }

    const uniqueFilePaths = await this.handleFindByPaths(
      ["", ...fileNames],
      false
    );
    const existingFilePaths = await this.systemPromptController.getFilePaths();
    if (uniqueFilePaths.length !== 0) {
      await this.handlePathAdd(["", ...uniqueFilePaths], false);
    }

    // now I want to match the fileNames to the uniqueFilePaths
    // by using the path.basename() function, I want to assign this to `searchResults`, where the type is: { fileName: string; filePaths: string[] }[]
    const searchResults = fileNames.map((fileName) => {
      const filePaths = uniqueFilePaths.filter((filePath) => {
        // we don't want to add a file that already exists
        if (!existingFilePaths.includes(filePath)) {
          return path.basename(filePath) === fileName;
        }
      });
      return { fileName, filePaths };
    });
    render && this.commandView.renderFileAdd(searchResults);
  }

  private async handleRemoveFile(
    cmdArry: string[],
    render: boolean = true
  ): Promise<void> {
    const paths = cmdArry.slice(1);
    if (cmdArry.length < 2) {
      this.commandView.render(
        "Invalid `/<cmd>` command. Usage: /<cmd> <file> <path/file2>"
      );
      return;
    }

    const statuses = await this.systemPromptController.removeFilePaths(paths);
    render && this.commandView.renderRemoveFile(paths, statuses);
  }

  private async handleRemoveFileAll(render: boolean = true): Promise<void> {
    await this.systemPromptController.removeAllFilePaths();
    render && this.commandView.render(`All files have been removed 🗑️`);
  }

  private async handleResetAll(render: boolean = true): Promise<void> {
    await this.handleResetConversation(render);
    await this.handleRemoveFileAll(render);
  }

  private async handleListFilePaths(render: boolean = true): Promise<void> {
    const filePaths = await this.systemPromptController.getFilePaths();
    render && this.commandView.renderListFilePaths(filePaths);
  }

  private async handleFindByPaths(
    cmdArry: string[],
    render: boolean = true
  ): Promise<string[]> {
    const fileNames = cmdArry.slice(1);
    if (cmdArry.length < 2) {
      this.commandView.renderInvalidCommand(["<file>", "<partial/path/file2>"]);
      return [];
    }
    // TODO: ignore dirs and max depth can be changed by the user later
    const IGNORE_DIRS = ["node_modules", ".git", ".vscode", "dist", "build"];
    const MAX_DEPTH = 4;

    const searchPromises = fileNames.map(async (fileName) => {
      return {
        fileName,
        filePaths: await findFilesWithName(fileName, IGNORE_DIRS, MAX_DEPTH),
      };
    });

    const searchResults = await Promise.all(searchPromises);

    render && this.commandView.renderFindByPaths(searchResults);

    // flat & unique
    const flattenedSearchResults = searchResults
      .map(({ filePaths }) => filePaths)
      .flat();
    const uniqueFilePaths = Array.from(new Set(flattenedSearchResults));
    return uniqueFilePaths;
  }

  private async handleTokenReport(render: boolean = true): Promise<void> {
    await this.tokenController.handleTokenReport(render);
    // render && this.commandView.renderTokenReport(tokenReport);
  }

  private async handleTokenFiles(render: boolean = true): Promise<void> {
    // const tokenFiles = await this.tokenController.getTokenFiles();
    const tokenFiles = "unavailable command /token-files";
    render && this.commandView.render(tokenFiles);
  }
}
