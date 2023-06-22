import {
  SystemPromptController,
  type SystemPromptComponents,
} from "./SystemPromptController";
import { type FilePathAndContent } from "../types";
import { ConversationHistoryController } from "./ConversationHistoryController";

import { getTokenLengthByInput } from "../utils/tiktoken-instance";

type TokenControllerDependencies = {
  systemPromptController: SystemPromptController;
  conversationHistoryController: ConversationHistoryController;
};

type SystemPromptComponentsWithTokenLength = {
  [K in keyof SystemPromptComponents as `${K & string}TokenLength`]: number;
};

type FilePathAndContentWithTokenLength = {
  contentTokenLength: number;
} & FilePathAndContent;

export class TokenController {
  private systemPromptController: SystemPromptController;
  private conversationHistoryController: ConversationHistoryController;

  constructor({
    systemPromptController,
    conversationHistoryController,
  }: TokenControllerDependencies) {
    this.systemPromptController = systemPromptController;
    this.conversationHistoryController = conversationHistoryController;
  }

  public async getTokenReport(): Promise<string> {
    // this function will interact with the SPC to get the token report
    // this token report will display the following
    // - Total Tokens Remaining:
    // - Tokens Budgetted:
    // - Tokens Used:
    // - Total for Files: `<>`
    //   - File1: `<>`
    //   - File2: `<>`
    //   - File3: `<>`
    // - System Prompt Total Tokens:
    //   - Prefix Instruction:
    //   - Injection Files:
    //   - Sufffix Instruction:
    // - Conversation Buffer: `<>`
    // - (Unaccounted) Conversation History: `<>`
    // All of this information will be outputted to an object

    const systemPromptComponents =
      await this.systemPromptController.getSystemPromptComponents();

    // get the token length for each of the components, in the same object, with object keys simply appended with "TokenLength"
    const systemPromptComponentsWithTokenLength: SystemPromptComponentsWithTokenLength =
      {} as SystemPromptComponentsWithTokenLength;

    await Promise.all(
      Object.keys(systemPromptComponents).map(async (key) => {
        const tokenLengthKey =
          `${key}TokenLength` as keyof SystemPromptComponentsWithTokenLength;

        systemPromptComponentsWithTokenLength[tokenLengthKey] =
          await getTokenLengthByInput(
            systemPromptComponents[key as keyof typeof systemPromptComponents]
          );
      })
    );

    let returnObject = { ...systemPromptComponentsWithTokenLength };
    // now for the file components
    const filePathsAndContents =
      await this.systemPromptController.getFilePathsAndContents();

    const filePathsAndContentWithTokenLength: FilePathAndContentWithTokenLength[] =
      await Promise.all(
        filePathsAndContents.map(async (filePathAndContent) => {
          const contentTokenLength = await getTokenLengthByInput(
            filePathAndContent.content
          );
          return {
            ...filePathAndContent,
            contentTokenLength,
          };
        })
      );

    return "";
  }
  public async getTokenFiles(): Promise<string> {
    return "";
  }
}
