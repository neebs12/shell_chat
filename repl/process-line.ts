import { Messages, FilePathAndContent } from "../types";
import { response } from "../agent/agent";

import { REPLSystemPrompt } from "../utils/system-prompt-components";
import { ConversationCache } from "../utils/conversation-cache";

export const processLine = async ({
  replSystemPrompt,
  conversationCache,
  input,
}: {
  replSystemPrompt: REPLSystemPrompt;
  conversationCache: ConversationCache;
  input: string;
}) => {
  conversationCache.appendUserMessage(input);

  const startCB = () => {};

  let totalAIResponse = "";
  const streamCB = (token: string) => {
    totalAIResponse += token;
    process.stdout.write(token);
  };

  const endCB = () => {
    // append to the overall conversation (is stored in the memory due to ephemeral feature)
    conversationCache.appendAIMessage(totalAIResponse);
    // to not overwrite the response
    process.stdout.write("\n");
  };

  const systemPromptString = replSystemPrompt.getSystemPromptString();
  await response({
    systemPromptString,
    input: conversationCache.getConversationHistory(),
    startCB,
    streamCB,
    endCB,
  });
};
