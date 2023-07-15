import * as fs from "fs";
import * as path from "path";
import { StateView } from "../views/StateView";
import { type Message } from "../types";

type SaveData = {
  conversationHistory: Message[];
  trackedFiles: string[];
};

type SaveFile = {
  [saveName: string]: SaveData;
};

type LoadConversationCallback = (
  conversationHistory: Message[],
  trackedFiles: string[]
) => Promise<void>;

type SaveStateParams = {
  saveName: string;
  conversationHistory: Message[];
  trackedFiles: string[];
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
};

type moveCacheToSaveInterfaceParams = {
  saveName: string;
  overwrite: boolean;
};

type loadStateInterface = {
  loadName: string;
  loadStateCallback: LoadConversationCallback;
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
  }: SaveStateParams): Promise<void> {
    this.saveFile[saveName] = { conversationHistory, trackedFiles };
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
      const { conversationHistory, trackedFiles } = this.saveFile[saveName];
      // Update conversation history and tracked files in current session
      await callback(conversationHistory, trackedFiles);
      this.stateView.conversationStateLoaded(saveName);
      this.saveName = saveName;
    } else {
      this.stateView.noSaveFound(saveName);
    }
  }

  public async deleteState(saveName: string): Promise<void> {
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
    });
  }

  public async moveCacheToSaveInterface({
    saveName,
    overwrite,
  }: moveCacheToSaveInterfaceParams): Promise<void> {
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
  }: loadStateInterface): Promise<void> {
    // keep this in commandcontroller
    // cannot load the cache (for ungodly amounts of simplicity)
    if (loadName === "cache") {
      this.stateView.render(
        `The "cache" cannot be specifically loaded - sorry 🙇`
      );
      return;
    }

    const savedNames = await this.getSavedStateNames();
    if (!savedNames.includes(loadName)) {
      this.stateView.render(`The save ${loadName} does not exist`);
      return;
    }

    const currSaveName = this.getSaveName();
    if (currSaveName) {
      if (currSaveName === loadName) {
        this.stateView.renderLoadingAlreadyCurrentState(loadName);
        return;
      } else {
        await this.saveState({
          saveName: currSaveName,
          conversationHistory,
          trackedFiles,
        });

        // Notify the user if the current chat is saved as cache.
        if (currSaveName === "cache") {
          this.stateView.renderSavedToCacheBeforeLoad();
        }
      }
    } else {
      await this.saveState({
        saveName: "cache",
        conversationHistory,
        trackedFiles,
      });
      this.stateView.renderSavedToCacheBeforeLoad();
    }

    await this.loadState(loadName, loadStateCallback);
  }
}
