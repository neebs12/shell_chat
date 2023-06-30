import * as readlineSync from "readline-sync";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";
import { ApplicationController } from "./controllers/ApplicationController";

const program = new Command();
// Define your command with options
program
  .option("--files <files...>", "Input files to process")
  .action(async (): Promise<void> => {
    const options = program.opts();
    let filePaths: string[] = [];
    // determines if exists
    if (options.files) {
      filePaths = [...options.files];
    }

    // Define the path for your .env file
    const envPath = path.join(process.env.HOME as any, ".config", "shell-chat");
    const envFile = path.join(envPath, ".env");

    if (!fs.existsSync(envFile)) {
      fs.mkdirSync(envPath, { recursive: true });
      const apiKey = await getAPIKey();
      await writeSensibleDefaultsToEnv({ envFile, apiKey });
    }

    dotenv.config({ path: envFile }); // wsl/linux

    const app = new ApplicationController(filePaths);
    app.run();
  });

program.parse(process.argv);

async function getAPIKey(): Promise<string> {
  let apiKey: string = "";
  let isApiKeyValid: boolean = false;

  const validateAPIKey = async (apiKey: string): Promise<boolean> => {
    // TODO: Complete actual validation
    return apiKey.length > 0;
  };

  while (!isApiKeyValid) {
    // The hideEchoBack option masks user input
    apiKey = readlineSync.question("Please enter your OPENAI_API_KEY: ", {
      hideEchoBack: true,
    });

    // Here's a placeholder for your validation logic
    isApiKeyValid = await validateAPIKey(apiKey);

    if (!isApiKeyValid) {
      console.log("Invalid API Key, please try again.");
    }
  }

  return apiKey;
}

async function writeSensibleDefaultsToEnv({
  envFile,
  apiKey,
}: {
  envFile: string;
  apiKey: string;
}): Promise<void> {
  const objContent = {
    OPENAI_API_KEY: apiKey,
    MODEL_NAME: "gpt-3.5-turbo-16k",
    MAX_TOKENS: 16000,
    MAX_COMPLETION_TOKENS: 300,
    RESERVED_INPUT_TOKENS: 250,
    RESERVED_CONVERSATION_TOKENS: 2000,
    RESERVED_ERROR_CORRECTION_TOKENS: 200,
  };
  const content = Object.entries(objContent).reduce((acc, [key, value]) => {
    acc += `${key}=${value}\n`;
    return acc;
  }, "");

  fs.writeFileSync(envFile, content, "utf8");
}
