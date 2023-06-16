import fs from "fs";
import path from "path";

import { FilePathAndContent } from "../types";

export const filesToObject = (filePaths: string[]): FilePathAndContent[] => {
  // Initialize an empty object that will hold the file paths and contents
  let fileMap: FilePathAndContent[] = [];

  fileMap = filePaths.map((filePath) => {
    // Resolve the absolute path
    const absolutePath = path.resolve(filePath);
    const fileContent = fs.readFileSync(absolutePath, "utf8");
    return {
      absolutePath: filePath,
      fileName: path.basename(filePath),
      content: fileContent,
    };
  });

  return fileMap;
};
