import fs from 'fs';
import * as readline from 'readline';

import { Message, Messages } from './types';
import { response } from './agent';

const replSimulation = (filePaths: string[]): void => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // immediately set the prompt
  rl.setPrompt('>>> ');
  rl.prompt();

  let conversation: Messages = [];
  rl.on('line', async (input: string) => {
    try {

      if (input.trim() === "") {
        rl.prompt();
        return;
      }

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

      rl.prompt();
    } catch (error) {
      console.error('Error occured:', error);
    }
  });

  rl.on('close', () => {
    console.log('Exiting the program...');
    process.exit(0);
  });
}

export { replSimulation };
