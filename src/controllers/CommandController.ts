import { SystemPromptController } from "./SystemPromptController";
import { ConversationHistoryController } from "./ConversationHistoryController";
import { CommandView } from "../views/CommandView";

type CommandControllerDependencies = {
  systemPromptController: SystemPromptController;
  conversationHistoryController: ConversationHistoryController;
};
export class CommandController {
  private AVAILABLE_COMMANDS: string[] = [
    "/add",
    "/remove",
    "/verbose",
    "/debug",
    "/refresh",
  ];

  private systemPromptController: SystemPromptController;
  private conversationHistoryController: ConversationHistoryController;
  private commandView: CommandView = new CommandView();

  constructor({
    systemPromptController,
    conversationHistoryController,
  }: CommandControllerDependencies) {
    this.systemPromptController = systemPromptController;
    this.conversationHistoryController = conversationHistoryController;
  }

  public isCommandAvailable(command: string): boolean {
    return this.AVAILABLE_COMMANDS.includes(command);
  }

  // main command handler
  public handleCommand(commandInput: string): void {
    // this.commandView.render(`${command} not yet implemented`);
    const cmdArry = commandInput.split(" ");
    if (!this.isCommandAvailable(cmdArry[0])) {
      return this.commandView.render(`${cmdArry[0]} is not a valid command`);
    }

    this.commandView.render(`${cmdArry[0]} has not yet been implemented`);
  }
}
