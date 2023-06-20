import * as dotenv from "dotenv";
dotenv.config();

import { Command } from "commander";
import { ApplicationController } from "./controllers/ApplicationController";

const program = new Command();

// Define your command with options
program
  .option("--files <files...>", "Input files to process")
  .action((): void => {
    const options = program.opts();
    let filePaths: string[] = [];
    // determines if exists
    if (options.files) {
      filePaths = [...options.files];
    }
    // replSimulation(filePaths);
    const app = new ApplicationController(filePaths);
    app.run();
  });

program.parse(process.argv);
