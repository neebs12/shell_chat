import { Messages } from "../types";
import { response } from "../agent/agent";

export const processLine = async (
  conversation: Messages,
  input: string,
  pathsAndContent: string[]
) => {
  // append user input to the conversation
  conversation = [...conversation, { key: "user", content: input }];

  let totalAIResponse = "";
  const streamCB = (token: string) => {
    totalAIResponse += token;
    process.stdout.write(token);
  };

  const endCB = () => {
    // append to the overall conversation (is stored in the memory due to ephemeral feature)
    conversation = [...conversation, { key: "ai", content: totalAIResponse }];
    // to not overwrite the response
    process.stdout.write("\n");
  };

  await response(conversation, () => {}, streamCB, endCB);
};
