export type Message = {
  key: "ai" | "user";
  content: string;
};

export type Messages = Message[];

export type FilePathAndContent = {
  absolutePath: string;
  fileName: string;
  content: string;
};

// adsfklhsdfkljsdhfkjlsdhfdk;jfhgkdjlsfhgdskfjghsd;kgjhsfd;kgjhdf;klgjdsf;kgjhdsf;gkljdsgk;jdshfgk;ljdshfgk;sdhfgl;kdsjfhgk;j
