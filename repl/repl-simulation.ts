import * as readline from "readline";
import { processLine } from "./process-line";

import { REPLSystemPrompt } from "../utils/system-prompt-components";
import { filesToObject } from "../utils/file-to-object";
import { Messages } from "../types";

const replSimulation = (filePaths: string[]): void => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // immediately set the prompt
  rl.setPrompt(">>> ");
  rl.prompt();

  let conversation: Messages = [];
  rl.on("line", async (input: string) => {
    try {
      if (input.trim() === "") {
        rl.prompt();
        return;
      }
      // console.log(conversation);
      const filesObject = filesToObject(filePaths);
      const systemPrompt = new REPLSystemPrompt({
        filePathsAndContent: filesObject,
      });
      await processLine(conversation, input, filesObject);

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
