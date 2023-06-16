import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
  AIMessagePromptTemplate,
} from "langchain/prompts";
import { ConsoleCallbackHandler, CallbackManager } from "langchain/callbacks";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";

import { Messages, FilePathAndContent } from "../types";

const response = async ({
  input,
  startCB,
  streamCB,
  endCB,
}: {
  input: Messages;
  startCB: () => void;
  streamCB: (token: string) => void;
  endCB: () => void;
}): Promise<void> => {
  // handling callbacks
  const callbackManager = CallbackManager.fromHandlers({
    async handleLLMStart(llm, _prompts: string[]) {
      startCB();
    },
    async handleLLMEnd(output) {
      endCB();
    },
    async handleLLMNewToken(token) {
      streamCB(token);
    },
  });

  const systemPrompt = SystemMessagePromptTemplate.fromTemplate(
    "You are a super sassy human. You are talking to an AI. And you are super sassy to this AI that you are talking to."
  );
  // construct current chat
  const currentChatPromptArray = input.map((message) => {
    if (message.key === "ai") {
      return AIMessagePromptTemplate.fromTemplate(message.content);
    } else {
      return HumanMessagePromptTemplate.fromTemplate(message.content);
    }
  });

  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    systemPrompt,
    ...currentChatPromptArray,
  ]);

  const chat = new ChatOpenAI({
    temperature: 0.5,
    maxTokens: 250,
    streaming: true,
    callbackManager,
  });

  // const prompt = JSON.parse(await chatPrompt.format({}));
  // const systemFormattedSystemPrompt
  // console.log({ chatPrompt: await chatPrompt.format({}) });

  const llm = new LLMChain({
    llm: chat,
    prompt: chatPrompt,
    callbackManager,
  });

  const response = await llm.call({});
};

export { response };
