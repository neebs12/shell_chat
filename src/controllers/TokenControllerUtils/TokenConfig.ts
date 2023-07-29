export class TokenConfig {
  maxTokens: number = Number(process.env.MAX_TOKENS) || 16384;
  maxCompletionTokens: number =
    Number(process.env.MAX_COMPLETION_TOKENS) || 300;
  reservedConversationTokens: number =
    Number(process.env.RESERVED_CONVERSATION_TOKENS) || 2000;
  errorCorrectionTokens: number =
    Number(process.env.RESERVED_ERROR_CORRECTION_TOKENS) || 200;
}
