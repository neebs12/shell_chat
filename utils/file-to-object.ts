import fs from "fs";
import path from "path";

import { FilePathAndContent } from "../types";

export const filesToObject = async (
  filePaths: string[]
): Promise<FilePathAndContent[]> => {
  // Initialize an empty object that will hold the file paths and contents
  let fileMap: FilePathAndContent[] = [];

  const fileMapPromises = filePaths.map(async (filePath) => {
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
};
