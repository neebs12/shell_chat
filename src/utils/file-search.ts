import fs from "fs";
import path from "path";

const IGNORE_DIRS = ["node_modules", ".git", ".vscode"];
const MAX_DEPTH = 3;

const walk = async (
  dir: string,
  fileCallback: (filePath: string) => Promise<void>,
  ignoreDirs: string[],
  maxDepth: number,
  depth = 0
) => {
  if (depth > maxDepth) return;

  const files = await fs.promises.readdir(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    if (ignoreDirs.includes(file)) continue;

    const stats = await fs.promises.stat(fullPath);

    if (stats.isDirectory()) {
      await walk(fullPath, fileCallback, ignoreDirs, maxDepth, depth + 1);
    } else {
      await fileCallback(fullPath);
    }
  }
};

const findFilesWithName = async (
  fileName: string,
  ignoreDirs: string[],
  maxDepth: number = 3
): Promise<string[]> => {
  const filePaths: string[] = [];

  const filePathCB = async (filePath: string): Promise<void> => {
    // const doFilenamesMatch = path.basename(filePath) === fileName;
    const doEndDirsMatch = filePath.endsWith(fileName);
    if (doEndDirsMatch) {
      const stats = await fs.promises.stat(filePath);
      if (stats.isFile()) {
        filePaths.push(filePath);
      }
    }
  };

  await walk(process.cwd(), filePathCB, ignoreDirs, maxDepth);

  return filePaths;
};

export { findFilesWithName };
