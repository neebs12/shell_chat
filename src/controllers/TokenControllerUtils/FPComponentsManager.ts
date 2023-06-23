import { type SystemPromptController } from "../SystemPromptController";
import { type FilePathAndContent } from "../../types";
import { getTokenLengthByInput } from "../../utils/tiktoken-instance";

export type FPComponentsWithTL = {
  filePathsAndContentWithTokenLength: ({
    contentTokenLength: number;
  } & FilePathAndContent)[];
};

export type FPComponentsWithTLTotal = {
  filesTotalTokenLength: number;
} & FPComponentsWithTL;

export class FPComponentsTLManager {
  constructor(private systemPromptController: SystemPromptController) {}

  public async getFPComponentsWithTLTotalAllFiles(): Promise<FPComponentsWithTLTotal> {
    const filePathsAndContents =
      await this.systemPromptController.getFilePathsAndContents();

    const allFileNames = filePathsAndContents.map(
      (filePathAndContent) => filePathAndContent.fileName
    );

    return await this.getFPComponentWithTLTotalByFileNames(allFileNames);
  }

  public async getFPComponentWithTLTotalByFileNames(
    fileNames: string[]
  ): Promise<FPComponentsWithTLTotal> {
    // this function will interact with the SPC to get the token report

    const filePathsAndContents =
      await this.systemPromptController.getFilePathsAndContents();

    const filteredFilePathsAndContents = filePathsAndContents.filter(
      (filePathAndContent) => {
        return fileNames.includes(filePathAndContent.fileName);
      }
    );
    const filePathsAndContentWithTokenLength = await Promise.all(
      filteredFilePathsAndContents.map(async (filePathAndContent) => {
        return {
          ...filePathAndContent,
          contentTokenLength: await getTokenLengthByInput(
            filePathAndContent.content
          ),
        };
      })
    );
    const filesTotalTokenLength = filePathsAndContentWithTokenLength.reduce(
      (acc, curr) => acc + curr.contentTokenLength,
      0
    );

    return {
      filePathsAndContentWithTokenLength,
      filesTotalTokenLength, // selection-specific total
    };
  }
}
