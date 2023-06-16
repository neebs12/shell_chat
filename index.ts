import * as dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import { replSimulation } from './repl/repl-simulation';

const program = new Command();

// Define your command with options
program
  .option('--files <files...>', 'Input files to process')
  .action((): void => {
    const options = program.opts();
    let filePaths: string[] = []
    // determines if exists
    if (options.files) {
      filePaths = [...options.files]
      console.log(filePaths)
    }
    replSimulation(filePaths)
  });

program.parse(process.argv);
