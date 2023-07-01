import {
  SystemChatMessage,
  AIChatMessage,
  HumanChatMessage,
} from "langchain/schema";

import { CallbackManager } from "langchain/callbacks";
import { ChatOpenAI } from "langchain/chat_models/openai";

import { SystemPromptController } from "./SystemPromptController";
import { ConversationHistoryController } from "./ConversationHistoryController";
import { TokenController } from "./TokenController";
import { NLView } from "../views/NLView";

type NLControllerDependencies = {
  filePaths: string[];
  systemPromptController: SystemPromptController;
  conversationHistoryController: ConversationHistoryController;
};

export class NLController {
  private systemPromptController: SystemPromptController;
  private conversationHistoryController: ConversationHistoryController;
  private tokenController: TokenController;
  private nlView: NLView = new NLView();

  constructor({
    filePaths,
    systemPromptController,
    conversationHistoryController,
  }: NLControllerDependencies) {
    // NLController responsible for appending filepaths to SPC
    this.systemPromptController = systemPromptController;
    this.systemPromptController.addFilePaths(filePaths);
    this.conversationHistoryController = conversationHistoryController;
    this.tokenController = new TokenController({
      systemPromptController,
      conversationHistoryController,
    });
  }

  public async handleNL(nl: string): Promise<void> {
    if (
      (await this.tokenController.areTheAddedFilesTooLarge()) ||
      (await this.tokenController.isNLInputTooLarge(nl))
    ) {
      this.nlView.renderNLError("Natural Language input is ignored...");
      return;
    }

    // append the nl
    this.conversationHistoryController.appendUserMessage(nl);
    const chatMessages = await this.getChatMessages();
    const callbackManager = await this.getCallbackManager();

    const chat = new ChatOpenAI({
      modelName: process.env.MODEL_NAME ?? "gpt-3.5-turbo-16k",
      temperature: 0.5,
      maxTokens: Number(process.env.MAX_COMPLETION_TOKENS) ?? 100,
      streaming: true,
      callbackManager,
    });

    const aiReponse = await chat.call(chatMessages);
    // console.log(`\n===\nai reponse: ${aiReponse.text}\n===\n`);
    this.conversationHistoryController.appendAIMessage(aiReponse.text);
  }

  // private
  private async getChatMessages(): Promise<
    (SystemChatMessage | AIChatMessage | HumanChatMessage)[]
  > {
    const systemPromptString =
      await this.systemPromptController.getSystemPrompt();

    // truncation
    const truncatedCH =
      await this.tokenController.getTruncatedConversationhistory();

    console.log(
      "truncatedCHTL: ",
      truncatedCH.reduce((acm, curr) => acm + curr.tokenLength, 0)
    );

    const systemMessage = new SystemChatMessage(systemPromptString);
    const convoMessageArray = truncatedCH.map((message) => {
      if (message.key === "ai") {
        return new AIChatMessage(message.content);
      } else {
        return new HumanChatMessage(message.content);
      }
    });
    const fullMessageArray = [systemMessage, ...convoMessageArray];

    return fullMessageArray;
  }

  private async getCallbackManager(): Promise<CallbackManager> {
    // let cacheResponse = ""; // everytime fn is called, this is refreshed to ""
    const startCB = async () => {};
    const streamCB = async (token: string) => {
      // cacheResponse += token;
      await this.nlView.render(token);
    };
    const endCB = async () => {
      await this.nlView.renderNewLine();
    };

    const callbackManager = CallbackManager.fromHandlers({
      async handleLLMStart(llm, _prompts: string[]) {
        await startCB();
      },
      async handleLLMEnd(output) {
        await endCB();
      },
      async handleLLMNewToken(token) {
        await streamCB(token);
      },
    });

    return callbackManager;
  }
}
