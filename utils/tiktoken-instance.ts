import { Tiktoken } from 'tiktoken/lite';
import { load } from 'tiktoken/load';
import registry from 'tiktoken/registry.json';
import models from 'tiktoken/model_to_encoding.json';

type EncoderCache = {
  [key in keyof typeof models]?: Tiktoken
}

let encoderCache: EncoderCache = {}

export const getEncoder = async (modelName: keyof typeof models = 'gpt-3.5-turbo'): Promise<Tiktoken> => {
  let encoder = encoderCache[modelName];
  // if cache does not exists
  if (encoder === undefined) {
    const properEncoding = models[modelName] as keyof typeof registry
    const model = await load(registry[properEncoding]);
    encoder = new Tiktoken(model.bpe_ranks, model.special_tokens, model.pat_str);
    encoderCache[modelName] = encoder;
  }
  return encoder;
}

export const getTokenLength = async (
  text: string,
  modelName: keyof typeof models = 'gpt-3.5-turbo'
  ): Promise<number> => {
    const encoder = await getEncoder(modelName);
    return encoder.encode(text).length;
}
