import fs from "fs";
import path from "path";

import { SystemPromptModel } from "../models/SystemPromptModel";
import { FilePathAndContent } from "../types";

export type SystemPromptComponents = {
  prefixInstruction: string;
  suffixInstruction: string;
  injectionInstruction: string;
  completeInstruction: string;
};

export class SystemPromptController {
  private systemPromptModel: SystemPromptModel;

  constructor() {
    this.systemPromptModel = new SystemPromptModel();
  }

  public async getSystemPrompt(): Promise<string> {
    return await this.systemPromptModel.getSystemPromptString();
  }

  public async getSystemPromptComponents(): Promise<SystemPromptComponents> {
    const prefixInstruction =
      await this.systemPromptModel.formatPrefixInstruction();
    const suffixInstruction =
      await this.systemPromptModel.formatSuffixInstruction();
    const injectionInstruction =
      await this.systemPromptModel.formatInjectionInstruction();
    const completeInstruction =
      await this.systemPromptModel.getSystemPromptString();
    // const filesAndPaths = await this.systemPromptModel.getFilePathAndContents();
    return {
      prefixInstruction,
      suffixInstruction,
      injectionInstruction,
      completeInstruction,
      // filesAndPaths,
    };
  }

  /**
   * @param {string[]} filePaths - list of file paths to be added (can be relative)
   * @returns {boolean[]} - list of booleans determining which has been added and which has been unsuccessfully added
   */
  public async addFilePaths(filePaths: string[]): Promise<boolean[]> {
    const fileBooleanMap = filePaths.map(async (filePath) => {
      try {
        const absolutePath = path.resolve(filePath);
        const existingFilePaths = this.systemPromptModel.filePaths;

        // prevent non-file to be added and duplication
        const isFile = await SystemPromptController.isThisAFile(absolutePath);
        const isDuplicate = existingFilePaths.includes(absolutePath);

        if (!isFile || isDuplicate) {
          return false;
        } else {
          this.systemPromptModel.addFilePath(absolutePath);
          return true;
        }
      } catch (error) {
        return false;
      }
    });

    const addedStatuses: boolean[] = await Promise.all(fileBooleanMap);
    return addedStatuses;
  }

  public async removeFilePaths(filePaths: string[]): Promise<boolean[]> {
    const existingFilePaths = this.systemPromptModel.filePaths;
    const removedStatuses: boolean[] = [];

    for (const filePath of filePaths) {
      const fileName = filePath.split("/").pop(); // Extract the filename from the path
      const matchingPaths = existingFilePaths.filter((path) => {
        const pathFileName = path.split("/").pop(); // Extract the filename from the registered path
        return pathFileName === fileName;
      });

      if (matchingPaths.length > 0) {
        for (const matchingPath of matchingPaths) {
          this.systemPromptModel.removeFilePath(matchingPath);
          removedStatuses.push(true);
        }
      } else {
        removedStatuses.push(false);
      }
    }

    return removedStatuses;
  }

  public async removeAllFilePaths(): Promise<void> {
    await this.systemPromptModel.resetFilePaths();
  }

  public async getFilePaths(): Promise<string[]> {
    return this.systemPromptModel.filePaths;
  }

  public async getFilePathsAndContents(): Promise<FilePathAndContent[]> {
    return await this.systemPromptModel.getFilePathsAndContents();
  }

  public static async isThisAFile(filePath: string): Promise<boolean> {
    try {
      const fileStats = await fs.promises.stat(filePath);
      return fileStats.isFile();
    } catch (error) {
      // Handle any potential errors, e.g., file not found
      // console.error("Error:", error);
      return false;
    }
  }

  public static async isThisADirectory(filePath: string): Promise<boolean> {
    try {
      const fileStats = await fs.promises.stat(filePath);
      return fileStats.isDirectory();
    } catch (error) {
      // Handle any potential errors, e.g., file not found
      // console.error("Error:", error);
      return false;
    }
  }
}
