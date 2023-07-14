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

const STATE_FILE = path.join(
  process.env.HOME as any,
  ".cache",
  "shell-chat.json"
);

export class StateController {
  private saveFile: SaveFile;
  private stateView: StateView;

  constructor() {
    this.stateView = new StateView();
    const exists = fs.existsSync(STATE_FILE);
    if (exists) {
      this.saveFile = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    } else {
      this.saveFile = {};
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.saveFile, null, 2));
    }
  }

  public async saveState(
    saveName: string,
    conversationHistory: Message[],
    trackedFiles: string[]
  ): Promise<void> {
    this.saveFile[saveName] = { conversationHistory, trackedFiles };
    await fs.promises.writeFile(
      STATE_FILE,
      JSON.stringify(this.saveFile, null, 2)
    );
    this.stateView.conversationStateSaved(saveName);
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
}
