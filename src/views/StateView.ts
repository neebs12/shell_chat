import chalk from "chalk";
import { Art, processCenterMessage } from "../utils/art";
import { mdBlockStr } from "../utils/marked-utils";
import { Message } from "../types";
import { stripAnsi } from "../utils/strip-ansi";

export class StateView {
  private genericStyle = chalk.green;
  private highlightStyle = chalk.redBright.bold;
  private av = new Art(this.genericStyle, this.highlightStyle);

  public render(input: string, withNewline: boolean = true) {
    process.stdout.write(input);
    if (withNewline) {
      process.stdout.write("\n");
    }
  }

  public renderAppendBg(input: string) {
    // Split input by `\n`
    const lines = input.split("\n");

    // For each line...
    for (const line of lines) {
      // Calculate length of line without ANSI characters
      const noAnsiLen = stripAnsi(line).length;

      // Calculate number of spaces needed to fill console width
      const numSpaces = process.stdout.columns - noAnsiLen;

      let paddedLine = line + "";
      if (numSpaces > 0) {
        // Append spaces to line
        paddedLine = line + " ".repeat(numSpaces);
      }

      // Write line with no background (any background makes it all look worse lol)
      process.stdout.write(paddedLine);

      // Write newline character to start a new line
      process.stdout.write("\n");
    }
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

  public conversationStateLoaded(saveName: string, ch: Message[]): void {
    if (ch.length === 0) {
      this.headerRender(
        `Conversation state **${saveName}** loaded, with **no history** found`
      );
      return;
    }
    this.headerRender(`Loading **${saveName}** conversation history ⌛`);
    ch.forEach((m, ind) => {
      const displayKey = processCenterMessage(
        [
          { content: "--", styler: chalk.dim.blue },
          {
            content: `${m.key === "user" ? "👋" : "🤖"}::`,
            styler: chalk.blue.bold,
          },
          { content: `${Math.floor(ind / 2)}::`, styler: chalk.blue },
          { content: `${saveName}`, styler: chalk.gray.italic },
          { content: "--", styler: chalk.dim.blue },
        ],
        { content: "-", styler: chalk.bold.blue }
      );
      this.render(displayKey);
      let displayContent = m.content;
      if (m.key === "user") {
        displayContent = chalk.gray(displayContent);
      } else {
        displayContent = mdBlockStr(displayContent);
      }
      this.render(displayContent, ind !== ch.length - 1);
    });
    this.render(
      processCenterMessage(
        [
          { content: "--", styler: chalk.dim.blue },
          {
            content: `👋 END 🤖`,
            styler: chalk.blue.bold,
          },

          { content: "--", styler: chalk.dim.blue },
        ],
        { content: "-", styler: chalk.bold.blue }
      )
    );
    this.headerRender(`Conversation history: **${saveName}** loaded 📝`);
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
