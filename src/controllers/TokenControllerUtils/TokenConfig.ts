export class TokenConfig {
  maxTokens: number = Number(process.env.MAX_TOKENS) || 16000;
  maxCompletionTokens: number =
    Number(process.env.MAX_COMPLETION_TOKENS) || 300;
  reservedInputTokens: number =
    Number(process.env.RESERVED_INPUT_TOKENS) || 250;
  reservedConversationTokens: number =
    Number(process.env.RESERVED_CONVERSATION_TOKENS) || 2000;
  errorCorrectionTokens: number =
    Number(process.env.RESERVED_ERROR_CORRECTION_TOKENS) || 200;
}
