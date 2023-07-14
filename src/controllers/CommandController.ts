import path from "path";

import { TokenController } from "./TokenController";
import { SystemPromptController } from "./SystemPromptController";
import { ConversationHistoryController } from "./ConversationHistoryController";
import { StateController } from "./StateController";
import { CommandView } from "../views/CommandView";

import { findFilesWithPatterns } from "../utils/file-search";

import { type Message } from "../types";

type CommandControllerDependencies = {
  systemPromptController: SystemPromptController;
  conversationHistoryController: ConversationHistoryController;
};

type FilePathsByPattern = {
  pattern: string;
  filePaths: string[];
};

export class CommandController {
  private AVAILABLE_COMMANDS: string[] = [
    "/find",
    "/f",
    "/find-add",
    "/fa",
    "/add", // same as file-add
    "/remove-file",
    "/rf",
    "/remove-file-all",
    "/rfa",
    "/list-files",
    "/lf",
    "/reset-conversation",
    "/rc",
    "/reset-all", // resets convo and revmoves files
    "/ra",
    "/save", // saves convo and file state
    "/s",
    "/load", // loads convo and file state
    "/l",
    "/delete", // deletes convo and file state
    "/d",
    "/list-saves", // lists all saves
    "/ls",
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
  private stateController: StateController = new StateController();
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
    } else if (cmd === "/find" || cmd === "/f") {
      await this.handleFileFindByPatterns(cmdArry);
    } else if (cmd === "/find-add" || cmd === "/fa" || cmd === "/add") {
      await this.handleFileAddByPatterns(cmdArry);
    } else if (cmd === "/remove-file" || cmd === "/rf") {
      await this.handleRemoveFileByPatterns(cmdArry);
    } else if (cmd === "/remove-file-all" || cmd === "/rfa") {
      await this.handleRemoveFileAll();
    } else if (cmd === "/list-files" || cmd === "/lf") {
      await this.handleListFilePaths();
    } else if (cmd === "/reset-conversation" || cmd === "/rc") {
      await this.handleResetConversation();
    } else if (cmd === "/reset-all" || cmd === "/ra") {
      await this.handleResetAll();
    } else if (cmd === "/token-report" || cmd === "/tr") {
      await this.handleTokenReport();
    } else if (cmd === "/token-files" || cmd === "/tf") {
      await this.handleTokenFiles();
    } else if (cmd === "/save" || cmd === "/s") {
      await this.handleSaveState(cmdArry);
    } else if (cmd === "/load" || cmd === "/l") {
      await this.handleLoadState(cmdArry);
    } else if (cmd === "/delete" || cmd === "/d") {
      await this.handleDeleteState(cmdArry);
    } else if (cmd === "/list-saves" || cmd === "/ls") {
      await this.stateController.listSavedStates();
    } else if (cmd === "/cwd" || cmd === "/pwd") {
      // NOTE: This is for debugging purposes only
      await this.commandView.render(process.cwd());
    } else {
      this.commandView.render(`${cmdArry[0]} has not yet been implemented`);
    }
  }

  private async handleSaveState(cmdArry: string[]): Promise<void> {
    const saveName = cmdArry[1];
    if (!saveName) {
      this.commandView.renderInvalidCommand(["<save-name>"]);
      return;
    }

    const conversationHistory =
      await this.conversationHistoryController.getConversationHistory();
    const trackedFiles = await this.systemPromptController.getFilePaths();
    await this.stateController.saveState(
      saveName,
      conversationHistory,
      trackedFiles
    );
  }

  private async handleLoadState(cmdArry: string[]): Promise<void> {
    const loadName = cmdArry[1];
    if (!loadName) {
      this.commandView.renderInvalidCommand(["<load-name>"]);
      return;
    }

    const cb = async (
      conversationHistory: Message[],
      trackedFiles: string[]
    ): Promise<void> => {
      await this.conversationHistoryController.resetConversationHistory();
      await this.systemPromptController.removeAllFilePaths();
      await this.conversationHistoryController.setConversationHistory(
        conversationHistory
      );
      await this.systemPromptController.addFilePaths(trackedFiles);
    };

    await this.stateController.loadState(loadName, cb);
  }

  private async handleDeleteState(cmdArry: string[]): Promise<void> {
    const deleteName = cmdArry[1];
    if (!deleteName) {
      this.commandView.renderInvalidCommand(["<delete-name>"]);
      return;
    }

    await this.stateController.deleteState(deleteName);
  }

  private async handleResetConversation(render: boolean = true): Promise<void> {
    await this.conversationHistoryController.resetConversationHistory();
    render && this.commandView.render("Conversation has been reset 💬");
  }

  private async handleFileAddByPatterns(
    cmdArry: string[],
    render: boolean = true
  ): Promise<void> {
    const patterns = Array.from(new Set(cmdArry.slice(1)));
    if (cmdArry.length < 2) {
      this.commandView.renderInvalidCommand(["<glob1>", "<glob2>"]);
      return;
    }

    const patternsFilePathsObj = await this.handleFileFindByPatterns(
      ["", ...patterns],
      false
    );

    const existingFilePaths = await this.systemPromptController.getFilePaths();
    const outersectionFPs = patternsFilePathsObj.filePaths.filter(
      (fp) => !existingFilePaths.includes(fp)
    );

    await this.systemPromptController.addFilePaths(outersectionFPs);
    render && this.commandView.renderFileAdd(patternsFilePathsObj);
  }

  private async handleRemoveFileByPatterns(
    cmdArry: string[],
    render: boolean = true
  ): Promise<void> {
    const patternsToRemove = Array.from(new Set(cmdArry.slice(1)));
    if (cmdArry.length < 2) {
      this.commandView.renderInvalidCommand(["<glob1>", "<glob2>"]);
      return;
    }

    // New code...
    // We need to get the available paths that pertain to the incoming patterns.
    const patternToRemoveFilePathObj = await this.handleFileFindByPatterns(
      ["", ...patternsToRemove],
      false
    );

    const existingFilePaths = await this.systemPromptController.getFilePaths();

    const intersectionFPs = patternToRemoveFilePathObj.filePaths.filter((fp) =>
      existingFilePaths.includes(fp)
    );

    await this.systemPromptController.removeFilePaths(intersectionFPs);

    render &&
      this.commandView.renderRemoveFile({
        pattern: patternsToRemove.join(" "),
        filePaths: intersectionFPs,
      });
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

  private async handleFileFindByPatterns(
    cmdArry: string[],
    render: boolean = true
  ): Promise<FilePathsByPattern> {
    const patterns = Array.from(new Set(cmdArry.slice(1)));
    if (cmdArry.length < 2) {
      this.commandView.renderInvalidCommand(["<glob1>", "<glob2>"]);
      return {} as FilePathsByPattern;
    }

    // glob patterns care about order when negation is involved
    const patternFilePathObj: FilePathsByPattern = {
      pattern: patterns.join(" "),
      filePaths: await findFilesWithPatterns(patterns),
    };

    render && this.commandView.renderFindByPaths(patternFilePathObj);
    return patternFilePathObj;
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
