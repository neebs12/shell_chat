import { CommandView } from "./CommandView";

export class StateView {
  private commandView: CommandView;

  constructor() {
    this.commandView = new CommandView();
  }

  public render(input: string) {
    this.commandView.render(input);
  }

  public conversationStateSaved(saveName: string): void {
    this.render(`Conversation state "${saveName}" saved`);
  }

  public conversationStateLoaded(saveName: string): void {
    this.render(`Conversation state loaded from "${saveName}"`);
  }

  public conversationStateDeleted(saveName: string): void {
    this.render(`Conversation state "${saveName}" deleted`);
  }

  public noSaveFound(saveName: string): void {
    this.render(`No save found with the name "${saveName}"`);
  }

  public savedConversationStatesList(saveNames: string[]): void {
    if (saveNames.length > 0) {
      this.render("Saved conversation states:");
      saveNames.forEach((saveName) => this.render(`- ${saveName}`));
    } else {
      this.render("No conversation states saved");
    }
  }

  public renderSaveOverwrite(saveName: string) {
    this.render(
      `Save "${saveName}" already exists. Use /save-overwrite or /so ${saveName} to overwrite`
    );
  }

  public renderNoSaveName(): void {
    this.render("No save name provided and no save name currently set");
  }

  public renderSuccessCacheMove(saveName: string) {
    this.render(`Successfully saved cache to "${saveName}", cache is reset`);
  }

  public renderSaveOverwriteFromCache(saveName: string) {
    this.render(
      `Save "${saveName}" already exists. Use /save-cache-overwrite or /sco ${saveName} to overwrite from cache`
    );
  }

  public renderCacheDoesNotExist() {
    this.render(`cache does not exist`);
  }

  public renderLoadingAlreadyCurrentState(saveName: string) {
    this.render(`Save "${saveName}" is already loaded`);
  }

  public renderSavedToCacheBeforeLoad() {
    this.render(
      `Saved to cache. To save this to a proper named save, use /sc <new-name>`
    );
  }
}
