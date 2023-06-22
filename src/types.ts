export type Message = {
  key: "ai" | "user";
  content: string;
  tokenLength: number;
};

export type Messages = Message[];

export type FilePathAndContent = {
  absolutePath: string;
  fileName: string;
  content: string;
};
