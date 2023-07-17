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
  stateController: StateController;
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
    "/new", // creates a new convo state
    "/n",
    "/save", // saves convo and file state
    "/s",
    "/save-overwrite", // shows that we are overwritting a save
    "/so",
    "/save-cache", // saves cache to a proper named save
    "/sc",
    "/save-cache-overwrite", // saves cache to a currently named save
    "/sco",
    "/load", // loads convo and file state
    "/l",
    "/delete", // deletes convo and file state
    "/d",
    "/delete-all",
    // "/da", // not enabled due to risk of accidental deletion
    "/rename",
    "/rn",
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
  private stateController: StateController;
  private commandView: CommandView = new CommandView();

  constructor({
    systemPromptController,
    conversationHistoryController,
    stateController,
  }: CommandControllerDependencies) {
    this.systemPromptController = systemPromptController;
    this.conversationHistoryController = conversationHistoryController;
    this.stateController = stateController;
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
    const cmdArry = commandInput.split(" ");
    const cmd = cmdArry[0];
    const incl = (...commands: string[]): boolean => commands.includes(cmd);
    if (!this.isCommandAvailable(cmd)) {
      this.commandView.render(`${cmd} is not a valid command`);
    } else if (incl("/f", "/find")) {
      await this.handleFileFindByPatterns(cmdArry);
    } else if (incl("/fa", "/find-add", "/add")) {
      await this.handleFileAddByPatterns(cmdArry);
    } else if (incl("/rf", "/remove-file")) {
      await this.handleRemoveFileByPatterns(cmdArry);
    } else if (incl("/remove-file-all", "/rfa")) {
      await this.handleRemoveFileAll();
    } else if (incl("/list-files", "/lf")) {
      await this.handleListFilePaths();
    } else if (incl("/reset-conversation", "/rc")) {
      await this.handleResetConversation();
    } else if (incl("/reset-all", "/ra")) {
      await this.handleResetAll();
    } else if (incl("/token-report", "/tr")) {
      await this.handleTokenReport();
    } else if (incl("/token-files", "/tf")) {
      await this.handleTokenFiles();
    } else if (incl("/new", "/n")) {
      await this.handleNewState(cmdArry);
    } else if (incl("/save", "/s")) {
      await this.handleSaveState(cmdArry);
    } else if (incl("/save-overwrite", "/so")) {
      await this.handleSaveOverwrite(cmdArry);
    } else if (incl("/save-cache", "/sc")) {
      await this.handleSaveFromCache(cmdArry);
    } else if (incl("/save-cache-overwrite", "/sco")) {
      await this.handleSaveFromCacheOverwrite(cmdArry);
    } else if (incl("/load", "/l")) {
      await this.handleLoadState(cmdArry);
    } else if (incl("/delete", "/d")) {
      await this.handleDeleteState(cmdArry);
    } else if (incl("/delete-all" /*, "/da"*/)) {
      await this.stateController.deleteAllStates();
    } else if (incl("/rename", "/rn")) {
      await this.handleRename(cmdArry);
    } else if (incl("/list-saves", "/ls")) {
      await this.stateController.listSavedStates();
    } else if (incl("/cwd", "/pwd")) {
      // NOTE: This is for debugging purposes only
      await this.commandView.render(process.cwd());
    } else {
      this.commandView.render(`${cmdArry[0]} has not yet been implemented`);
    }
  }

  private async handleNewState(cmdArry: string[]): Promise<void> {
    const newStateName = cmdArry[1];
    if (!newStateName) {
      this.commandView.renderInvalidCommand(["<new-name>"]);
      return;
    }

    const newStateCallback = async (): Promise<void> => {
      await this.conversationHistoryController.resetConversationHistory();
      await this.systemPromptController.removeAllFilePaths();
    };

    await this.stateController.newStateInterface({
      newStateName,
      newStateCallback,
      conversationHistory:
        await this.conversationHistoryController.getConversationHistory(),
      trackedFiles: await this.systemPromptController.getFilePaths(),
    });
  }

  private async handleRename(cmdArry: string[]): Promise<void> {
    const newName = cmdArry[1];
    if (!newName) {
      this.commandView.renderInvalidCommand(["<new-name>"]);
      return;
    }

    await this.stateController.renameCurrentState(newName);
  }

  private async handleSaveState(cmdArry: string[]): Promise<void> {
    const saveName = cmdArry[1];
    return this.stateController.saveStateInterface({
      saveName,
      overwrite: false,
      conversationHistory:
        await this.conversationHistoryController.getConversationHistory(),
      trackedFiles: await this.systemPromptController.getFilePaths(),
    });
  }

  private async handleSaveOverwrite(cmdArry: string[]): Promise<void> {
    const saveName = cmdArry[1];
    if (!saveName) {
      this.commandView.renderInvalidCommand(["<save-name>"]);
      return;
    }

    return this.stateController.saveStateInterface({
      saveName,
      overwrite: true,
      conversationHistory:
        await this.conversationHistoryController.getConversationHistory(),
      trackedFiles: await this.systemPromptController.getFilePaths(),
    });
  }

  private async handleSaveFromCache(cmdArry: string[]): Promise<void> {
    const saveName = cmdArry[1];
    if (!saveName) {
      this.commandView.renderInvalidCommand(["<save-name>"]);
      return;
    }

    await this.stateController.moveCacheToSaveInterface({
      saveName,
      overwrite: false,
    });
  }

  private async handleSaveFromCacheOverwrite(cmdArry: string[]): Promise<void> {
    const saveName = cmdArry[1];
    if (!saveName) {
      this.commandView.renderInvalidCommand(["<save-name>"]);
      return;
    }

    await this.stateController.moveCacheToSaveInterface({
      saveName,
      overwrite: true,
    });
  }

  private async handleLoadState(cmdArry: string[]): Promise<void> {
    const loadName = cmdArry[1];
    if (!loadName) {
      this.commandView.renderInvalidCommand(["<load-name>"]);
      return;
    }

    const loadStateCallback = async (
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

    await this.stateController.loadStateInterface({
      loadName,
      loadStateCallback,
      conversationHistory:
        await this.conversationHistoryController.getConversationHistory(),
      trackedFiles: await this.systemPromptController.getFilePaths(),
    });
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
