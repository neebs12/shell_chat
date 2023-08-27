import OpenAI from "openai";
import { PromiseType } from "utility-types";

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

  private startCB: (() => Promise<void>) | null = null;
  private streamCB: ((token: string) => Promise<void>) | null = null;
  private endCB: (() => Promise<void>) | null = null;

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

  public async stopNL(): Promise<void> {
    throw new Error("stopNL not implemented in old NLController");
  }

  public async handleNL(nl: string, rlCallback: () => void): Promise<void> {
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
    await this.getStreamMDCBs();
    const callbackManager = CallbackManager.fromHandlers({
      handleLLMStart: async (llm, _prompts: string[]) => {
        if (this.startCB) {
          await this.startCB();
        } else {
          throw new Error("startCB is null");
        }
      },

      handleLLMEnd: async (output) => {
        if (this.endCB) {
          await this.endCB();
        } else {
          throw new Error("endCB is null");
        }
      },

      handleLLMNewToken: async (token) => {
        if (this.streamCB) {
          await this.streamCB(token);
        } else {
          throw new Error("streamCB is null");
        }
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
    rlCallback();
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
            ? "\n\n<|BACKGROUND INSTRUCTION: respond in standard markdown with italics & bolds but don't insert italics/bolds within codeblocks|>"
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
      // delayedNum doesnt have the latest ai message yet
      const delayedNum = await this.tokenController.getTokensUsedBySPCH();
      const actualNum = delayedNum + debugBuffer.length;
      this.nlmdView.handleEndCB(actualNum, false);
      // console.log("--------------"); // check MD output
      // this.nlView.render(debugBuffer.join("|"));
    };

    this.startCB = startCB;
    this.streamCB = streamCB;
    this.endCB = endCB;
    return { startCB, streamCB, endCB }; // not needed
  }
}

type Role = "system" | "user" | "assistant";

export class OpenAIInterface {
  public isStreaming: boolean = false;

  private openai = new OpenAI();

  private systemPromptController: SystemPromptController;
  private conversationHistoryController: ConversationHistoryController;
  private tokenController: TokenController;
  private nlView: NLView = new NLView();
  private nlmdView: NLMDView = new NLMDView();

  private startCB: (() => Promise<void>) | null = null;
  private streamCB: ((token: string) => Promise<void>) | null = null;
  private endCB: (() => Promise<void>) | null = null;

  // private openAIStream: Stream<OpenAI.Chat.Completions.ChatCompletionChunk>;
  // dafuq lmao
  private openAIStream: PromiseType<
    ReturnType<OpenAI.Chat.Completions["create"]>
  > | null = null;

  private static SYSTEM_ROLE: Role = "system";
  private static USER_ROLE: Role = "user";
  private static ASSISTANT_ROLE: Role = "assistant";

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

  public stopNL(): void {
    // throw new Error("stopNL not implemented in new NLController");
    if (this.openAIStream) {
      // @ts-ignore
      this.openAIStream.controller.abort();
      this.openAIStream = null;
    }
  }

  public async handleNL(nl: string, rlCallback: () => void): Promise<void> {
    if (
      (await this.tokenController.areTheAddedFilesTooLarge()) ||
      (await this.tokenController.isNLInputTooLarge(nl))
    ) {
      this.nlView.renderNLError("Natural Language input is ignored");
      return;
    }

    // initialize the cbs
    await this.getStreamMDCBs();

    // append the nl
    this.conversationHistoryController.appendUserMessage(nl);

    const chatMessages = await this.getChatMessages();

    if (this.startCB && this.streamCB && this.endCB) {
      const aiResponse = await this.customInterface({
        startCB: this.startCB,
        streamCB: this.streamCB,
        endCB: this.endCB,
        chatMessages,
      });

      this.conversationHistoryController.appendAIMessage(aiResponse);
      rlCallback();
    } else {
      throw new Error(
        "one of the callbacks (startCB, streamCB, endCB) is null"
      );
    }
  }

  // private
  // custom interface, which takes in the callbacks and the conversation history
  private async customInterface({
    startCB,
    streamCB,
    endCB,
    chatMessages,
  }: StreamCallbacks & {
    chatMessages: OpenAI.Chat.Completions.ChatCompletionMessage[];
  }): Promise<string> {
    try {
      await startCB();

      this.openAIStream = await this.openai.chat.completions.create({
        model: process.env.MODEL_NAME ?? "gpt-3.5-turbo-16k",
        temperature: 0.4,
        max_tokens: Number(process.env.MAX_COMPLETION_TOKENS) ?? 100,
        messages: chatMessages,
        stream: true,
      });

      let collectedChunks: string[] = [];
      for await (const part of this.openAIStream) {
        const chunk = part.choices[0]?.delta?.content || "";
        collectedChunks.push(chunk);
        await streamCB(chunk);
      }

      await endCB();
      return collectedChunks.join("");
    } catch (e) {
      // some error
      this.stopNL();
      await endCB();
      return "";
    }
  }

  // get chat messages, but the interface has changed to reflect more openai's interface
  private async getChatMessages(): Promise<
    OpenAI.Chat.Completions.ChatCompletionMessage[]
  > {
    const systemPromptString =
      await this.systemPromptController.getSystemPrompt();

    // truncation
    const truncatedCH =
      await this.tokenController.getTruncatedConversationhistory();

    const convoMessageArray = truncatedCH.map((message, ind) => {
      if (message.key === "ai") {
        return {
          role: OpenAIInterface.ASSISTANT_ROLE,
          content: message.content,
        };
      } else {
        const content =
          message.content +
          (ind === truncatedCH.length - 1
            ? "\n\n<|BACKGROUND INSTRUCTION: respond in standard markdown with italics & bolds but don't insert italics/bolds within codeblocks|>"
            : "");
        return { role: OpenAIInterface.USER_ROLE, content };
      }
    });
    const fullMessageArray = [
      { role: OpenAIInterface.SYSTEM_ROLE, content: systemPromptString },
      ...convoMessageArray,
    ];

    return fullMessageArray;
  }

  private async getStreamMDCBs(): Promise<void> {
    this.nlmdView.buffer = [];
    this.nlmdView.isCodeBlock = false;

    let localBuffer: string[] = [];

    const startCB = async () => {
      this.nlmdView.handleStartCB();
    };
    const streamCB = async (token: string) => {
      localBuffer.push(token);
      this.nlmdView.handleStreamCB(token);
    };

    const endCB = async () => {
      // delayedNum doesnt have the latest ai message yet
      const delayedNum = await this.tokenController.getTokensUsedBySPCH();
      const actualNum = delayedNum + localBuffer.length;
      this.nlmdView.handleEndCB(actualNum, this.openAIStream === null);
      // console.log("--------------"); // check MD output
      // this.nlView.render(localBuffer.join("|"));
    };

    this.startCB = startCB;
    this.streamCB = streamCB;
    this.endCB = endCB;
  }
}
