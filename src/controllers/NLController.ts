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

    // console.log(
    //   "truncatedCHTL: ",
    //   truncatedCH.reduce((acm, curr) => acm + curr.tokenLength, 0)
    // );

    const systemMessage = new SystemChatMessage(systemPromptString);
    const convoMessageArray = truncatedCH.map((message, ind) => {
      if (message.key === "ai") {
        return new AIChatMessage(message.content);
      } else {
        const content =
          message.content +
          (ind === truncatedCH.length - 1
            ? "- ANSWER IN STANDARD MARKDOWN, use bolds and italics"
            : "");
        return new HumanChatMessage(content);
      }
    });
    const fullMessageArray = [systemMessage, ...convoMessageArray];

    return fullMessageArray;
  }

  // can you give me multiple examples about typescript
  private async getStreamMDCBs(): Promise<StreamCallbacks> {
    let buffer: string[] = [];
    let isCodeBlock = false;

    let debugText = "";

    const startCB = async () => {};
    const streamCB = async (token: string) => {
      debugText += token;
      const subTokenArry = token.split("\n");

      for (let ind = 0; ind < subTokenArry.length; ind += 1) {
        const currSubToken = subTokenArry[ind];
        const canFlipState = canFlipCodeBlockState({
          buffer,
          currSubToken,
        });
        if (canFlipState) {
          isCodeBlock = !isCodeBlock;
        }
        // now at last subToken
        if (ind === subTokenArry.length - 1) {
          if (subTokenArry.length == 1) {
            // if only one subToken, append
            buffer.push(currSubToken);
          } else {
            // else, start a new token
            buffer = [currSubToken];
          }
          continue;
        } else {
          buffer.push(currSubToken);
          // const tmpBuffer = buffer.map((bf) => (bf === "" ? "\n" : bf));
          const bufferStr = buffer.join("");
          // now either at start or middle of the overarching token
          // render as normally with normal conditionals
          if (isCodeBlock || canFlipState) {
            // render as codeblock
            await this.nlmdView.renderLineNLMDAsCodeBlock(bufferStr);
          } else if (bufferStr === "") {
            this.nlView.renderNewLine();
          } else {
            // render normally (if it contains valu)
            await this.nlmdView.renderLineNLMD(bufferStr);
          }
          // reset buffer
          buffer = [];
        }
      }
    };

    const endCB = async () => {
      const bufferStr = buffer.join("");

      isCodeBlock || bufferStr === "```"
        ? await this.nlmdView.renderLineNLMDAsCodeBlock(bufferStr)
        : await this.nlmdView.renderLineNLMD(bufferStr);

      buffer = [];
      isCodeBlock = false;

      // console.log("--------------"); // check MD output
      // await this.nlView.render(debugText);
      // await this.nlView.renderNewLine();
    };

    return { startCB, streamCB, endCB };
  }

  private async getStreamCBs(): Promise<StreamCallbacks> {
    const startCB = async () => {};
    const streamCB = async (token: string) => {
      // cacheResponse += token;
      await this.nlView.render(token);
    };
    const endCB = async () => {
      await this.nlView.renderNewLine();
    };

    return { startCB, streamCB, endCB };
  }

  private async getFullMDCBs(): Promise<StreamCallbacks> {
    let cachedResponse = "";
    const startCB = async () => {
      await this.nlView.render("Rendering...", false, "darkGray");
    };
    const streamCB = async (token: string) => {
      cachedResponse += token;
      // await this.nlView.render(token);
    };
    const endCB = async () => {
      // await this.nlView.renderNewLine();
      await this.nlmdView.renderFullNLMD(cachedResponse);
      await this.nlView.renderNewLine();
    };

    return { startCB, streamCB, endCB };
  }
}

// we know currSubToken is split by "\n"
const canFlipCodeBlockState = ({
  currSubToken,
  buffer,
}: {
  currSubToken: string;
  buffer: string[];
}): boolean => {
  const isFirstThreeBackticks = currSubToken.slice(0, 3) === "```";

  // three backtick case
  if (isFirstThreeBackticks) {
    return true;
  }

  const isFirstTwoBackTicks = currSubToken.slice(0, 2) === "``";
  // two backtick case
  if (isFirstTwoBackTicks) {
    // need to check buffer (enuf len to check last val)
    if (buffer.length >= 1) {
      const lastBufferVal = buffer[buffer.length - 1];
      // this last bufferVal needs to end in a backtick to complete a three-set
      const lastBufferValEndsWithBacktick = lastBufferVal === "`";
      if (lastBufferValEndsWithBacktick) {
        return true;
      }
    }
  }

  const isFirstBackTick = currSubToken[0] === "`";
  // one backtick case
  if (isFirstBackTick) {
    // need to check buffer length
    const lastBufferVal = buffer[buffer.length - 1];
    if (buffer.length >= 2) {
      const penultimateBufferVal = buffer[buffer.length - 2];
      if (
        (lastBufferVal === "`" && penultimateBufferVal === "`") ||
        lastBufferVal === "``"
      ) {
        return true;
      }
    } else if (buffer.length >= 1) {
      if (lastBufferVal === "``") {
        return true;
      }
    }
  }

  return false;
};
