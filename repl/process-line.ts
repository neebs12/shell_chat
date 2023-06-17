import { Messages, FilePathAndContent } from "../types";
import { response } from "../agent/agent";

import { REPLSystemPrompt } from "../utils/system-prompt-components";

export const processLine = async ({
  filesObject,
  conversation,
  input,
}: {
  filesObject: FilePathAndContent[];
  conversation: Messages;
  input: string;
}) => {
  // append user input to the conversation
  conversation.push({ key: "user", content: input });

  const startCB = () => {};

  let totalAIResponse = "";
  const streamCB = (token: string) => {
    totalAIResponse += token;
    process.stdout.write(token);
  };

  const endCB = () => {
    // append to the overall conversation (is stored in the memory due to ephemeral feature)
    conversation.push({ key: "ai", content: totalAIResponse });
    // to not overwrite the response
    process.stdout.write("\n");
  };

  const replSystemPrompt = new REPLSystemPrompt({
    filePathsAndContent: filesObject,
  });
  // console.log({
  //   systemPrompt: systemPrompt.getSystemPrompt(),
  //   systemPromptLength: await systemPrompt.getSystemPromptTokenLength(),
  // });

  await response({
    systemPromptString: replSystemPrompt.getSystemPromptString(),
    input: conversation,
    startCB,
    streamCB,
    endCB,
  });
};
