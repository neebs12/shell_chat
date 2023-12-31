import * as fs from "fs";
import * as path from "path";
import { StateView } from "../views/StateView";
import { type Message } from "../types";

type SaveData = {
  conversationHistory: Message[];
  trackedFiles: string[];
  limit: number;
};

type SaveFile = {
  [saveName: string]: SaveData;
};

type LoadConversationCallback = (
  conversationHistory: Message[],
  trackedFiles: string[],
  limit: number
) => Promise<void>;

type NewStateCallback = () => Promise<void>;

type SaveStateParams = {
  saveName: string;
  conversationHistory: Message[];
  trackedFiles: string[];
  limit: number;
};

const STATE_FILE = path.join(
  process.env.HOME as any,
  ".cache",
  "shell-chat.json"
);

type SaveStateInterfaceParams = {
  saveName: string;
  overwrite: boolean;
  conversationHistory: Message[];
  trackedFiles: string[];
  limit: number;
};

type MoveCacheToSaveInterfaceParams = {
  saveName: string;
  overwrite: boolean;
};

type LoadStateInterface = {
  loadName: string;
  loadStateCallback: LoadConversationCallback;
} & SaveData;

type NewStateInterface = {
  newStateName: string;
  newStateCallback: NewStateCallback;
} & SaveData;

export class StateController {
  private saveFile: SaveFile;
  private stateView: StateView;
  private saveName: string = "";

  constructor() {
    this.stateView = new StateView();
    const exists = fs.existsSync(STATE_FILE);
    if (exists) {
      this.saveFile = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
      // if cache exists, delete it and rewrite savefile for every load
      if (this.saveFile["cache"]) {
        delete this.saveFile["cache"];
        fs.writeFileSync(STATE_FILE, JSON.stringify(this.saveFile, null, 2));
      }
    } else {
      this.saveFile = {};
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.saveFile, null, 2));
    }
  }

  public async renameCurrentState(newName: string): Promise<void> {
    if (this.saveFile[this.saveName]) {
      if (this.saveName === newName) {
        this.stateView.conversationCannotRenameToSameName(newName);
        return;
      }

      this.saveFile[newName] = this.saveFile[this.saveName];
      delete this.saveFile[this.saveName];
      await fs.promises.writeFile(
        STATE_FILE,
        JSON.stringify(this.saveFile, null, 2)
      );
      this.stateView.conversationStateRenamed(this.saveName, newName);
      this.saveName = newName;
    } else {
      this.stateView.headerRender("Save first prior to renaming");
    }
  }

  public async moveAndResetCache(saveName: string): Promise<void> {
    if (this.saveFile["cache"]) {
      this.saveFile[saveName] = this.saveFile["cache"];
      delete this.saveFile["cache"];
      await fs.promises.writeFile(
        STATE_FILE,
        JSON.stringify(this.saveFile, null, 2)
      );
    } else {
      this.stateView.noSaveFound("cache");
    }
  }

  public getSaveName(): string {
    return this.saveName;
  }

  public async saveState({
    saveName,
    conversationHistory,
    trackedFiles,
    limit,
  }: SaveStateParams): Promise<void> {
    this.saveFile[saveName] = { conversationHistory, trackedFiles, limit };
    await fs.promises.writeFile(
      STATE_FILE,
      JSON.stringify(this.saveFile, null, 2)
    );
    this.stateView.conversationStateSaved(saveName);
    this.saveName = saveName;
  }

  public async loadState(
    saveName: string,
    callback: LoadConversationCallback
  ): Promise<void> {
    if (this.saveFile[saveName]) {
      // Save name exists, load conversation history and tracked files
      const { conversationHistory, trackedFiles, limit } =
        this.saveFile[saveName];
      // Update conversation history and tracked files in current session
      await callback(conversationHistory, trackedFiles, limit);
      // notifies user that loading is successful
      this.stateView.conversationStateLoaded(saveName, conversationHistory);
      // then render the current history of the loaded save (as per conversationHistory) and trackedFiles(?)
      this.saveName = saveName;
    } else {
      this.stateView.noSaveFound(saveName);
    }
  }

  public async createEmptyState(
    saveName: string,
    callback: NewStateCallback
  ): Promise<void> {
    this.saveFile[saveName] = {
      conversationHistory: [],
      trackedFiles: [],
      limit: 1000000, // 1 mil token upperlimit
    };
    await fs.promises.writeFile(
      STATE_FILE,
      JSON.stringify(this.saveFile, null, 2)
    );
    this.saveName = saveName;
    await callback();
    this.stateView.headerRender(
      `Current conversation saved to **${saveName}**`
    );
  }

  public async deleteState(saveName: string): Promise<void> {
    // cannot delete the current state
    if (this.saveName === saveName) {
      this.stateView.headerRender(
        `Cannot delete the current state **${saveName}**`
      );
      return;
    }

    if (this.saveFile[saveName]) {
      delete this.saveFile[saveName];
      await fs.promises.writeFile(
        STATE_FILE,
        JSON.stringify(this.saveFile, null, 2)
      );
      this.stateView.conversationStateDeleted(saveName);
    } else {
      this.stateView.noSaveFound(saveName);
    }
  }

  public async deleteAllStates(): Promise<void> {
    const saveNames = Object.keys(this.saveFile);
    if (saveNames.length === 0) {
      // this.stateView.noSaveFound("any");
      this.stateView.allConversationStatesDeleted();
    } else {
      this.saveFile = {};
      this.saveName = "";
      await fs.promises.writeFile(
        STATE_FILE,
        JSON.stringify(this.saveFile, null, 2)
      );
      this.stateView.allConversationStatesDeleted();
    }
  }

  public listSavedStates(): void {
    const saveNames = Object.keys(this.saveFile);
    this.stateView.savedConversationStatesList(saveNames);
  }

  public async getSavedStateNames(): Promise<string[]> {
    return Object.keys(this.saveFile);
  }

  public async cacheExists(): Promise<boolean> {
    return !!this.saveFile["cache"];
  }

  public async saveStateInterface({
    saveName,
    overwrite = false,
    conversationHistory,
    trackedFiles,
    limit,
  }: SaveStateInterfaceParams): Promise<void> {
    const saveNames = await this.getSavedStateNames();
    const isNameTaken = saveName && saveNames.includes(saveName);

    // cannot overwrite existing save if overwrite flag is not false
    if (isNameTaken && !overwrite) {
      this.stateView.renderSaveOverwrite(saveName);
      return;
    }

    // if saveName is not provided, use the stateSaveName.
    // if the stateSaveName is not available, return early and notify the user
    if (!saveName) {
      if (!this.getSaveName()) {
        this.stateView.renderNoSaveName();
        return;
      } else {
        saveName = this.getSaveName();
      }
    }

    await this.saveState({
      saveName,
      conversationHistory,
      trackedFiles,
      limit,
    });
  }

  public async moveCacheToSaveInterface({
    saveName,
    overwrite,
  }: MoveCacheToSaveInterfaceParams): Promise<void> {
    const saveNames = await this.getSavedStateNames();
    const isNameTaken = saveName && saveNames.includes(saveName);

    if (!(await this.cacheExists())) {
      this.stateView.renderCacheDoesNotExist();
      return;
    }

    if (isNameTaken && !overwrite) {
      this.stateView.renderSaveOverwriteFromCache(saveName);
      return;
    }

    await this.moveAndResetCache(saveName);
    this.stateView.renderSuccessCacheMove(saveName);
  }

  public async loadStateInterface({
    loadName,
    loadStateCallback,
    conversationHistory,
    trackedFiles,
    limit,
  }: LoadStateInterface): Promise<void> {
    // keep this in commandcontroller
    // cannot load the cache (for ungodly amounts of simplicity)
    if (loadName === "cache") {
      this.stateView.headerRender(
        "Cannot specifically load the **cache** - sorry 🙇"
      );
      return;
    }

    const savedNames = await this.getSavedStateNames();
    if (!savedNames.includes(loadName)) {
      this.stateView.conversationStateLoadDoesNotExist(loadName);
      return;
    }

    const currSaveName = this.getSaveName();
    // user trying to load the current state, cannot do this
    if (currSaveName === loadName) {
      this.stateView.renderLoadingAlreadyCurrentState(loadName);
      return;
    }

    if (currSaveName) {
      await this.saveState({
        saveName: currSaveName,
        conversationHistory,
        trackedFiles,
        limit,
      });
    } else {
      await this.saveState({
        saveName: "cache",
        conversationHistory,
        trackedFiles,
        limit,
      });
      this.stateView.renderSavedToCacheBeforeLoad();
    }

    await this.loadState(loadName, loadStateCallback);
  }

  public async newStateInterface({
    newStateName,
    newStateCallback,
    conversationHistory,
    trackedFiles,
    limit,
  }: NewStateInterface): Promise<void> {
    if (newStateName === "cache") {
      this.stateView.headerRender(
        "Cannot specifically save the **cache** - sorry 🙇"
      );
      return;
    }

    const savedNames = await this.getSavedStateNames();
    if (savedNames.includes(newStateName)) {
      this.stateView.headerRender(
        `Cannot create new state **${newStateName}** - already exists`
      );
    }

    const currSaveName = this.getSaveName();
    if (currSaveName) {
      await this.saveState({
        saveName: currSaveName,
        conversationHistory,
        trackedFiles,
        limit,
      });
    } else {
      await this.saveState({
        saveName: "cache",
        conversationHistory,
        trackedFiles,
        limit,
      });
      this.stateView.renderSavedToCacheBeforeLoad();
    }

    await this.createEmptyState(newStateName, newStateCallback);
  }
}
