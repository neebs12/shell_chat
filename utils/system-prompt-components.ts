// This file contains the code for creating the instruction, filePathsAndContent and suffix description of a prompt
import { FilePathAndContent } from "../types";
import { getTokenLengthByInput } from "./tiktoken-instance";

const PREFIX_INSTRUCTION = `You are an assistant coding AI. You will receive a list of files and their contents and their paths. Your task is to answer the queries provided by the human given the files you are provided with. The files will given to you in the following format:

example format:
=============================
FILE: <filename>
ABSOLUTE_PATH: <file absolute path>
CONTENT:
-----------------------------
<file content>
-----------------------------
=============================

okay, here are the files:
`;

const SUFFIX_INSTRUCTION = `The files that I have given you above somehow interact with each other. Answer my queries based on them. I am a junior software engineer.`;

export class REPLSystemPrompt {
  private formattedInjection: string;
  private filePathsAndContent: FilePathAndContent[];
  private prefixInstruction: string = PREFIX_INSTRUCTION;
  private suffixInstruction: string = SUFFIX_INSTRUCTION;

  constructor({
    prefixInstruction,
    filePathsAndContent,
    suffixDescription,
  }: {
    prefixInstruction?: string;
    filePathsAndContent: FilePathAndContent[];
    suffixDescription?: string;
  }) {
    if (prefixInstruction) {
      this.prefixInstruction = prefixInstruction;
    }

    if (suffixDescription) {
      this.suffixInstruction = suffixDescription;
    }

    // need to format the filePathsAndContent to be something that is more friendly
    this.filePathsAndContent = filePathsAndContent;
    this.formattedInjection =
      this.formatFilePathsAndContent(filePathsAndContent);
  }
  // public methods
  public getSystemPrompt(): string {
    const fullSystemPrompt = `${this.prefixInstruction}

${this.formattedInjection}

Description of files: ${this.suffixInstruction}`;

    return fullSystemPrompt;
  }

  public printSystemPrompt(): void {
    console.log(this.getSystemPrompt());
  }

  public async getSystemPromptTokenLength(): Promise<number> {
    return await getTokenLengthByInput(this.getSystemPrompt());
  }

  public async getTokenlengthByPromptComponents(): Promise<object> {
    // this function returns the token length of each component of the prompt
    // this component includes:
    // - instruction
    // - each of the file paths
    // - suffix description
    // - and TOTAL token length of the prompt (get the token length of the prompt itself)

    const prefixInstructionTokenLength = await getTokenLengthByInput(
      this.prefixInstruction
    );

    const suffixInstructionTokenLength = await getTokenLengthByInput(
      this.suffixInstruction
    );

    // filepaths will look different, we will map through the filepaths and get the token length of each of them, and the token length will be injected in to the returned object
    const filePathsTokenLength = await Promise.all(
      this.filePathsAndContent.map(async (filePathAndContent) => {
        const { content } = filePathAndContent;
        const tokenLength = await getTokenLengthByInput(content);
        return { ...filePathAndContent, tokenLength };
      })
    );

    // sum
    const sumTokenLength =
      prefixInstructionTokenLength +
      suffixInstructionTokenLength +
      filePathsTokenLength.reduce(
        (acc, filePathTokenLength) => acc + filePathTokenLength.tokenLength,
        0
      );

    return {
      prefixInstructionTokenLength,
      suffixInstructionTokenLength,
      filePathsTokenLength,
      sumTokenLength,
    };
  }

  // private methods
  private formatFilePathsAndContent(filePathsAndContent: FilePathAndContent[]) {
    /**
    Format: filePathsAndContent to be of format below:
    ============================
    FILE: object.fileName
    ABSOLUTE_PATH: object.absolutePath
    CONTENT:
    ----------------------------
    object.content
    ----------------------------
    ============================
    ...
     */
    const strArry: string[] = [];
    for (const filePathContent of filePathsAndContent) {
      const { fileName, absolutePath, content } = filePathContent;
      const filePathContentUnit = `=============================
FILE: ${fileName}
ABSOLUTE_PATH: ${absolutePath}
CONTENT:
-----------------------------
${content}
-----------------------------
=============================`;
      strArry.push(filePathContentUnit);
    }

    return strArry.join("\n");
  }
}
