import fs from "fs";
import * as readline from "readline";

import { processLine } from "./process-line";
import { Message, Messages } from "../types";
import { response } from "../agent/agent";

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

      await processLine(conversation, input, filePaths);

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
