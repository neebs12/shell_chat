import fs from "fs";

import { SystemPromptModel } from "../models/SystemPromptModel";
import { FilePathAndContent } from "../../types";

type SystemPromptComponents = {
  prefix: string;
  suffix: string;
  injection: string;
  filesAndPaths: FilePathAndContent[];
};

export class SystemPromptController {
  private systemPromptModel: SystemPromptModel;

  constructor(filePaths: string[] = []) {
    this.systemPromptModel = new SystemPromptModel(filePaths);
  }

  public async getSystemPrompt(): Promise<string> {
    return await this.systemPromptModel.getSystemPromptString();
  }

  public async getSystemPromptComponents(): Promise<SystemPromptComponents> {
    const prefix = await this.systemPromptModel.formatPrefixInstruction();
    const suffix = await this.systemPromptModel.formatSuffixInstruction();
    const injection = await this.systemPromptModel.formatInjectionInstruction();
    const filesAndPaths = await this.systemPromptModel.getFilePathAndContents();
    return { prefix, suffix, injection, filesAndPaths };
  }

  public addFilePath(filePath: string): void {
    // NOTE: Command Controller will /add here
    this.systemPromptModel.addFilePath(filePath);
  }

  public addFilePaths(filePaths: string[]): void {
    // NOTE: Command Controller will /add here
    filePaths.forEach((filePath) => {
      this.systemPromptModel.addFilePath(filePath);
    });
  }

  public removeFilePath(filePath: string): void {
    // NOTE: Command Controller will /remove here
    this.systemPromptModel.removeFilePath(filePath);
  }

  public static async isThisAFile(filePath: string): Promise<boolean> {
    try {
      const fileStats = await fs.promises.stat(filePath);
      return fileStats.isFile();
    } catch (error) {
      // Handle any potential errors, e.g., file not found
      console.error("Error:", error);
      return false;
    }
  }

  public static async isThisADirectory(filePath: string): Promise<boolean> {
    try {
      const fileStats = await fs.promises.stat(filePath);
      return fileStats.isDirectory();
    } catch (error) {
      // Handle any potential errors, e.g., file not found
      console.error("Error:", error);
      return false;
    }
  }
}
