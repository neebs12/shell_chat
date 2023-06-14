export type Message = {
  key: "ai" | "user";
  content: string;
};

export type Messages = Message[];
