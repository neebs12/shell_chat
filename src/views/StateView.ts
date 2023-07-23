import chalk from "chalk";
import { Art } from "../utils/art";

export class StateView {
  private genericStyle = chalk.green;
  private highlightStyle = chalk.redBright.bold;
  private av = new Art(this.genericStyle, this.highlightStyle);

  public render(input: string) {
    process.stdout.write(input);
    process.stdout.write("\n");
  }

  public headerRender(input: string) {
    const str = this.av.createMessage(input);
    this.render(str);
  }

  public conversationStateRenamed(oldName: string, newName: string): void {
    this.headerRender(
      `Current conversation state **${oldName}** renamed to **${newName}**`
    );
  }

  public conversationCannotRenameToSameName(newName: string): void {
    this.headerRender(`Cannot rename to the same name **${newName}**`);
  }

  public conversationStateSaved(saveName: string): void {
    this.headerRender(`Conversation state **${saveName}** saved`);
  }

  public conversationStateLoadDoesNotExist(saveName: string): void {
    this.headerRender(`Conversation state **${saveName}** does not exist`);
  }

  public conversationStateLoaded(saveName: string): void {
    this.headerRender(`Conversation state loaded from **${saveName}**`);
  }

  public conversationStateDeleted(saveName: string): void {
    this.headerRender(`Conversation state **${saveName}** deleted`);
  }

  public noSaveFound(saveName: string): void {
    this.headerRender(`No save found with the name **${saveName}**`);
  }

  public savedConversationStatesList(saveNames: string[]): void {
    if (saveNames.length > 0) {
      this.headerRender(`Saved conversation states:`);
      saveNames.forEach((saveName) => this.headerRender(`- ${saveName}`));
    } else {
      this.headerRender(`No conversation states saved`);
    }
  }

  public renderSaveOverwrite(saveName: string) {
    this.headerRender(
      `Save **${saveName}** already exists. Overwrite with **/so ${saveName}**`
    );
  }

  public renderNoSaveName(): void {
    this.headerRender("No save name provided and no save name currently set");
  }

  public renderSuccessCacheMove(saveName: string) {
    this.headerRender(`Saved cache to **${saveName}**, cache is reset`);
  }

  public renderSaveOverwriteFromCache(saveName: string) {
    this.headerRender(
      `Save **${saveName}** already exists. Use overwrite with **/sco ${saveName}**`
    );
  }

  public renderCacheDoesNotExist() {
    this.headerRender("Cache does not exist");
  }

  public renderLoadingAlreadyCurrentState(saveName: string) {
    this.headerRender(`Save **${saveName}** is already loaded`);
  }

  public renderSavedToCacheBeforeLoad() {
    this.headerRender("To properly save **cache**, use **/sc <new-name>**");
  }

  public allConversationStatesDeleted() {
    this.headerRender(
      "All convos deleted, use **/delete <save-name>** to delete by name"
    );
  }
}
