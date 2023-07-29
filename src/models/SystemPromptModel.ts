import fs from "fs";
import path from "path";

import { FilePathAndContent } from "../types";

const PREFIX_INSTRUCTION = `You are a expert coding AI. You will answer queries provided to you in a short and concise manner. You will receive a list of files and their contents and their paths. Your task is to give clear and concise answers to any queries provided by the human given the files you are provided with. The files will given to you in the following format:

Example format:
===============
FILE: <filename>
ABSOLUTE_PATH: <file absolute path>
CONTENT:
---------------
<file content>
---------------
===============

Okay, here are the files:
`;

const SUFFIX_INSTRUCTION = `The files that I have given you above somehow interact with each other. Give clear, short and concise answers based on them`;
export class SystemPromptModel {
  private prefixInstruction: string = PREFIX_INSTRUCTION;
  private suffixInstruction: string = SUFFIX_INSTRUCTION;

  constructor(private _filePaths: string[] = []) {
    this._filePaths = _filePaths;
  }

  public get filePaths(): string[] {
    return [...this._filePaths];
  }

  public resetFilePaths(): void {
    this._filePaths = [];
  }

  public addFilePath(filePath: string) {
    this._filePaths.push(filePath);
  }

  public removeFilePath(filePath: string) {
    const index = this._filePaths.indexOf(filePath);
    if (index > -1) {
      this._filePaths.splice(index, 1);
    }
  }

  public async getFilePathsAndContents(): Promise<FilePathAndContent[]> {
    // NOTE: This is useful for token counting and general debugging
    return await this.filesToObject();
  }

  public async getSystemPromptString(): Promise<string> {
    // if there are no filePaths, return a "chat mode" system prompt.
    if (this._filePaths.length === 0) {
      return `You are a expert coding AI. You will answer queries provided to you in a short and concise manner. Do not show any warnings or information regarding your capabilities.

For clarity to the user, ONLY ANSWER IN MARKDOWN FORMAT.`;
    }

    // for any harcoded prompts, put them here
    const prefixInstruction = await this.formatPrefixInstruction();
    const suffixInstruction = await this.formatSuffixInstruction();
    const injectionInstruction = await this.formatInjectionInstruction();

    return `${prefixInstruction}\n\n${injectionInstruction}\n\n${suffixInstruction}`;
  }

  public async formatPrefixInstruction(): Promise<string> {
    return this.prefixInstruction;
  }

  public async formatSuffixInstruction(): Promise<string> {
    return `Further Comments: ${this.suffixInstruction}`;
  }

  public async formatInjectionInstruction(): Promise<string> {
    /**
    Format: filePathsAndContent to be of format below:
    ===============
    FILE: object.fileName
    ABSOLUTE_PATH: object.absolutePath
    CONTENT:
    ---------------
    object.content
    ---------------
    ===============
    ...
     */
    if (this._filePaths.length === 0) {
      return "YOU ARE PROVIDED NO FILES";
    }
    const largeDelimiter = "===============";
    const smallDelimiter = "---------------";
    const filePathsAndContent = await this.filesToObject();
    const filePathContentUnit = filePathsAndContent.map((fac) => {
      const { fileName, absolutePath, content } = fac;
      let returnStr = "";
      returnStr += `\nFILE: ${fileName}`;
      returnStr += `\nABSOLUTE_PATH: ${absolutePath}`;
      returnStr += `\nCONTENT:`;
      returnStr += `\n${smallDelimiter}`;
      returnStr += `\n${content}`;
      returnStr += `\n${smallDelimiter}`;
      return returnStr;
    });
    const filePathContentUnitStr =
      `\n${largeDelimiter}` +
      filePathContentUnit.join(`\n${largeDelimiter}`) +
      `\n${largeDelimiter}`;

    return filePathContentUnitStr;
  }

  // private
  private async filesToObject(): Promise<FilePathAndContent[]> {
    // Initialize an empty object that will hold the file paths and contents
    let fileMap: FilePathAndContent[] = [];

    const fileMapPromises = this._filePaths.map(async (filePath) => {
      // Resolve the absolute path
      const absolutePath = path.resolve(filePath);
      const fileContent = await fs.promises.readFile(absolutePath, "utf8");
      return {
        absolutePath: filePath,
        fileName: path.basename(filePath),
        content: fileContent,
      };
    });
    fileMap = await Promise.all(fileMapPromises);

    return fileMap;
  }
}
