export type Message = {
  key: "ai" | "user";
  content: string;
};

export type Messages = Message[];

export type filePathsAndContent = {
  filePath: string;
  content: string;
};
