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
import { NLView, NLMDView } from "../views/NLView";
import chalk from "chalk";

type NLControllerDependencies = {
  filePaths: string[];
  systemPromptController: SystemPromptController;
  conversationHistoryController: ConversationHistoryController;
  tokenController: TokenController;
};

type StreamCallbacks = {
  startCB: () => Promise<void>;
  streamCB: (token: string) => Promise<void>;
  endCB: () => Promise<void>;
};

export class NLController {
  private systemPromptController: SystemPromptController;
  private conversationHistoryController: ConversationHistoryController;
  private tokenController: TokenController;
  private nlView: NLView = new NLView();
  private nlmdView: NLMDView = new NLMDView();

  constructor({
    filePaths,
    systemPromptController,
    conversationHistoryController,
    tokenController,
  }: NLControllerDependencies) {
    // NLController responsible for appending filepaths to SPC
    this.systemPromptController = systemPromptController;
    this.systemPromptController.addFilePaths(filePaths);
    this.conversationHistoryController = conversationHistoryController;
    this.tokenController = tokenController;
  }

  public async handleNL(nl: string): Promise<void> {
    if (
      (await this.tokenController.areTheAddedFilesTooLarge()) ||
      (await this.tokenController.isNLInputTooLarge(nl))
    ) {
      this.nlView.renderNLError("Natural Language input is ignored");
      return;
    }

    // append the nl
    this.conversationHistoryController.appendUserMessage(nl);
    const chatMessages = await this.getChatMessages();
    // const { startCB, streamCB, endCB } = await this.getStreamCBs();
    const { startCB, streamCB, endCB } = await this.getStreamMDCBs();
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

    const chat = new ChatOpenAI({
      modelName: process.env.MODEL_NAME ?? "gpt-3.5-turbo-16k",
      temperature: 0.4,
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

    const systemMessage = new SystemChatMessage(systemPromptString);
    const convoMessageArray = truncatedCH.map((message, ind) => {
      if (message.key === "ai") {
        return new AIChatMessage(message.content);
      } else {
        const content =
          message.content +
          (ind === truncatedCH.length - 1
            ? "\n\n<SILENT-NOTE-START> respond in standard markdown with italics & bolds but don't insert italics/bolds within codeblocks <SILENT-NOTE-END>"
            : "");
        return new HumanChatMessage(content);
      }
    });
    const fullMessageArray = [systemMessage, ...convoMessageArray];

    return fullMessageArray;
  }

  // can you give me multiple examples about typescript
  private async getStreamMDCBs(): Promise<StreamCallbacks> {
    this.nlmdView.buffer = [];
    this.nlmdView.isCodeBlock = false;

    let debugBuffer: string[] = [];

    const startCB = async () => {
      this.nlmdView.handleStartCB();
    };
    const streamCB = async (token: string) => {
      debugBuffer.push(token);
      this.nlmdView.handleStreamCB(token);
    };

    const endCB = async () => {
      const delayedNum = await this.tokenController.getTokensUsedBySPCH();
      const actualNum = delayedNum + debugBuffer.length;
      this.nlmdView.handleEndCB(actualNum);
      // console.log("--------------"); // check MD output
      // this.nlView.render(debugBuffer.join("|"));
    };

    return { startCB, streamCB, endCB };
  }
}
