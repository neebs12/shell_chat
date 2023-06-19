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
  public async handleCommand(commandInput: string): Promise<void> {
    // this.commandView.render(`${command} not yet implemented`);
    const cmdArry = commandInput.split(" ");
    const cmd = cmdArry[0];
    if (!this.isCommandAvailable(cmd)) {
      this.commandView.render(`${cmd} is not a valid command`);
    } else if (cmd === "/add") {
      await this.handleAdd(cmdArry);
    } else if (cmd === "/remove") {
      await this.handleRemove(cmdArry);
    } else {
      this.commandView.render(`${cmdArry[0]} has not yet been implemented`);
    }
  }

  private async handleAdd(cmdArry: string[]): Promise<void> {
    const paths = cmdArry.slice(1);
    if (cmdArry.length < 2) {
      this.commandView.render(
        "Invalid `/add` command. Usage: /add <path/file> <path/file2>"
      );
      return;
    }

    const statuses = await this.systemPromptController.addFilePaths(paths);
    this.commandView.render(
      `The following files have been added(✅) or not added(❌):`
    );
    statuses.forEach((status, index) => {
      const currPath = paths[index];
      if (status) {
        this.commandView.render(`  ✅ ${currPath}`);
      } else {
        this.commandView.render(`  ❌ ${currPath}`);
      }
    });
  }

  private async handleRemove(cmdArry: string[]): Promise<void> {
    const paths = cmdArry.slice(1);
    if (cmdArry.length < 2) {
      this.commandView.render(
        "Invalid `/remove` command. Usage: /remove <filename> <path/file2>"
      );
      return;
    }

    const statuses = await this.systemPromptController.removeFilePaths(paths);
    this.commandView.render(
      `The following files have been removed(✅) or not removed(❌):`
    );
    statuses.forEach((status, index) => {
      const currPath = paths[index];
      if (status) {
        this.commandView.render(`  ✅ ${currPath}`);
      } else {
        this.commandView.render(`  ❌ ${currPath}`);
      }
    });
  }
}
