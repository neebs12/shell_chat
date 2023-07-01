import * as glob from "glob";
import fs from "fs";
import path from "path";

const findFilesWithPatterns = async (
  patterns: string[],
  ignoreFile: string = ".gitignore"
): Promise<string[]> => {
  let ignoreDirs: string[] = [];

  // read .gitignore to get the ignoreDirs!
  // **/ prepended to to contents of .gitignore for it to work
  // ignore `!` negation glob patterns
  const fileContent = await fs.promises
    .readFile(ignoreFile, "utf8")
    .catch(() => {
      console.log("No `.gitignore` file found. Continuing...");
      return "";
    });

  const injectIgnoreDirs = fileContent + "\n" + ".git";
  ignoreDirs = injectIgnoreDirs
    .split("\n")
    .filter((s) => {
      // filter out empty lines and negation lines
      const isEmpty = s.trim().length > 0;
      const containsNegation = !s.includes("!");
      return isEmpty && containsNegation;
    })
    .map((s) => {
      // remove doubled up slashes and backslashes
      const newPatterns = `**/${s.trim()}/**`
        .replace(/\/\//g, "/")
        .replace(/\\\\/g, "\\");
      return newPatterns;
    });

  // negation patterns must be separated from addn glob patterns
  // https://github.com/isaacs/node-glob#comments-and-negation
  let addnPatterns: string[] = [];
  let negationPatterns: string[] = [];
  patterns.forEach((p) => {
    p.startsWith("!")
      ? negationPatterns.push(p.slice(1))
      : addnPatterns.push(p);
  });

  const finalIgnore = ignoreDirs.concat(negationPatterns);

  const relFiles = await glob.glob(addnPatterns, {
    ignore: finalIgnore,
    nodir: true,
    dot: true,
  });

  // console.log({ addnPatterns, negationPatterns, fileContent, ignoreDirs });

  const absFiles = relFiles.map((relFile) =>
    path.resolve(process.cwd(), relFile)
  );
  return absFiles;
};

export { findFilesWithPatterns };
