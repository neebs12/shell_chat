import chalk from "chalk";

export class StateView {
  public render(input: string) {
    process.stdout.write(chalk.green(input));
    process.stdout.write("\n");
  }

  public conversationStateRenamed(oldName: string, newName: string): void {
    this.render(
      `Current conversation state "${oldName}" renamed to "${newName}"...`
    );
  }

  public conversationStateSaved(saveName: string): void {
    this.render(`Conversation state "${saveName}" saved...`);
  }

  public conversationStateLoaded(saveName: string): void {
    this.render(`Conversation state loaded from "${saveName}..."`);
  }

  public conversationStateDeleted(saveName: string): void {
    this.render(`Conversation state "${saveName}" deleted...`);
  }

  public noSaveFound(saveName: string): void {
    this.render(`No save found with the name "${saveName}..."`);
  }

  public savedConversationStatesList(saveNames: string[]): void {
    if (saveNames.length > 0) {
      this.render("Saved conversation states:");
      saveNames.forEach((saveName) => this.render(`- ${saveName}`));
    } else {
      this.render("No conversation states saved...");
    }
  }

  public renderSaveOverwrite(saveName: string) {
    this.render(
      `Save "${saveName}" already exists. Use /save-overwrite or /so ${saveName} to overwrite...`
    );
  }

  public renderNoSaveName(): void {
    this.render("No save name provided and no save name currently set...");
  }

  public renderSuccessCacheMove(saveName: string) {
    this.render(`Successfully saved cache to "${saveName}", cache is reset...`);
  }

  public renderSaveOverwriteFromCache(saveName: string) {
    this.render(
      `Save "${saveName}" already exists. Use /save-cache-overwrite or /sco ${saveName} to overwrite from cache...`
    );
  }

  public renderCacheDoesNotExist() {
    this.render(`Cache does not exist...`);
  }

  public renderLoadingAlreadyCurrentState(saveName: string) {
    this.render(`Save "${saveName}" is already loaded...`);
  }

  public renderSavedToCacheBeforeLoad() {
    this.render(`To save cache to a proper name, use /sc <new-name>...`);
  }

  public allConversationStatesDeleted() {
    this.render(
      `All conversation states deleted. To delete a specific save, use /delete <save-name>...`
    );
  }
}
