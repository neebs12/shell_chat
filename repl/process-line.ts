import { Messages, FilePathAndContent } from "../types";
import { response } from "../agent/agent";

export const processLine = async (
  conversation: Messages,
  input: string,
  pathsAndContent: FilePathAndContent[]
) => {
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

  await response({
    input: conversation,
    startCB,
    streamCB,
    endCB,
  });
};
