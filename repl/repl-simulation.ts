import * as readline from "readline";
import { processLine } from "./process-line";

import { REPLSystemPrompt } from "../utils/system-prompt-components";
import { ConversationCache } from "../utils/conversation-cache";
import { filesToObject } from "../utils/file-to-object";
import { Messages } from "../types";

const AVAILABLE_COMMANDS = [
  "/add",
  "/remove",
  "/verbose",
  "/debug",
  "/refresh",
];
const MAX_TOKENS = Number(process.env.MAX_TOKENS) ?? 15999;

const replSimulation = (filePaths: string[]): void => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // immediately set the prompt
  rl.setPrompt(">>> ");
  rl.prompt();

  const conversationCache = new ConversationCache();
  rl.on("line", async (input: string) => {
    try {
      const processedInput = processInput(input);
      if (processedInput === "") {
        return rl.prompt();
      }

      // pre-process the input, scan for certain commands for control flow
      const filesObject = await filesToObject(filePaths);
      const replSystemPrompt = new REPLSystemPrompt({
        filePathsAndContent: filesObject,
      });

      const totalNumberOfTokens = await calculateTotalPromptTokens(
        replSystemPrompt,
        conversationCache
      );

      if (totalNumberOfTokens < MAX_TOKENS) {
        console.log(
          `You have too many tokens at ${totalNumberOfTokens}. With a max number of ${MAX_TOKENS}. You are over by ${
            MAX_TOKENS - totalNumberOfTokens
          } Please remove some of the files from the system prompt.`
        );
      }

      if (AVAILABLE_COMMANDS.includes(processedInput)) {
        if ("/debug" === processedInput) {
          // Print the:
          // - total number of tokens for all files
          // - total number of tokens for the conversation
          // - total number of tokens budgetted
          // - total number of tokens left
          // - total number of tokens for each files
          // - system prompt
          // - conversation history
          /**
           * So I want to see:
           *
           */
          console.log('You have hit the "/debug" command');
        } else if ("/verbose" === processedInput) {
          // Print the:
          // - total number of tokens for all files
          // - total number of tokens for the conversation
          // - total number of tokens budgetted
          // - total number of tokens left
          // - total number of tokens for each files
          console.log('You have hit the "/verbose" command');
        } else if ("/refresh" === processedInput) {
          conversationCache.resetConversationHistory();
          console.log(
            'You have hit the "/refresh" command, conversation history reset!'
          );
        } else {
          console.log(
            `The command: "${processInput}" has not been implemented yet.`
          );
        }
      } else {
        // non-command query, is NL
        await processLine({
          replSystemPrompt,
          conversationCache,
          input,
        });
      }

      rl.prompt();
    } catch (error) {
      console.error("Error occured:", error);
    }
  });

  rl.on("close", () => {
    process.stdout.write("Exiting the program...");
    process.exit(0);
  });
};

export { replSimulation };

const processInput = (input: string): string => {
  return input.trim();
};

const calculateTotalPromptTokens = async (
  replSystemPrompt: REPLSystemPrompt,
  conversationCache: ConversationCache
): Promise<number> => {
  // get the token length of the system prompt
  let totalNumberOfTokens = Number(process.env.BUFFER_TOKENS) ?? 100;
  totalNumberOfTokens += await replSystemPrompt.getSystemPromptTokenLength();
  totalNumberOfTokens += await conversationCache.getConversationTokenLength();

  return totalNumberOfTokens;
};
