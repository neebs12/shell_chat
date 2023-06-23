import { type TiktokenModel, type Tiktoken } from "js-tiktoken";
import { encodingForModel } from "js-tiktoken";

type EncoderCache = {
  [key in TiktokenModel]?: Tiktoken;
};

let encoderCache: EncoderCache = {};

export const getTokenLengthByInput = async (
  text: string,
  modelName: TiktokenModel = "gpt-3.5-turbo"
): Promise<number> => {
  let encoder = encoderCache[modelName];

  if (!encoder) {
    encoder = await encodingForModel(modelName);
    encoderCache[modelName] = encoder;
    if (!encodingForModel(modelName)) {
      throw new Error(`Unknown model ${modelName}`);
    }
  }

  // automatically free
  const numTokens = encoder.encode(text).length;
  return numTokens;
};
