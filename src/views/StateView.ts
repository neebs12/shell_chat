import { CommandView } from "./CommandView";

export class StateView {
  private commandView: CommandView;

  constructor() {
    this.commandView = new CommandView();
  }

  public conversationStateSaved(saveName: string): void {
    this.commandView.render(`Conversation state "${saveName}" saved`);
  }

  public conversationStateLoaded(saveName: string): void {
    this.commandView.render(`Conversation state loaded from "${saveName}"`);
  }

  public conversationStateDeleted(saveName: string): void {
    this.commandView.render(`Conversation state "${saveName}" deleted`);
  }

  public noSaveFound(saveName: string): void {
    this.commandView.render(`No save found with the name "${saveName}"`);
  }

  public savedConversationStatesList(saveNames: string[]): void {
    if (saveNames.length > 0) {
      this.commandView.render("Saved conversation states:");
      saveNames.forEach((saveName) => this.commandView.render(`- ${saveName}`));
    } else {
      this.commandView.render("No conversation states saved");
    }
  }
}
