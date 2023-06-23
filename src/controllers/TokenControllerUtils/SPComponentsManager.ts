import {
  type SystemPromptComponents,
  type SystemPromptController,
} from "../SystemPromptController";
import { getTokenLengthByInput } from "../../utils/tiktoken-instance";

export type SPComponentsTLOnly = {
  [K in keyof SystemPromptComponents as `${K & string}TokenLength`]: number;
};

export type SPComponentsWithTL = SPComponentsTLOnly & SystemPromptComponents;
export class SPComponentsTLManager {
  constructor(private systemPromptController: SystemPromptController) {}

  public async getSPComponentsTokenLength(): Promise<SPComponentsWithTL> {
    const systemPromptComponents =
      await this.systemPromptController.getSystemPromptComponents();

    // get the token length for each of the components, in the same object, with object keys simply appended with "TokenLength"
    const systemPromptComponentsWithTokenLength: SPComponentsTLOnly =
      {} as SPComponentsTLOnly;

    await Promise.all(
      Object.keys(systemPromptComponents).map(async (key) => {
        const tokenLengthKey = `${key}TokenLength` as keyof SPComponentsTLOnly;

        systemPromptComponentsWithTokenLength[tokenLengthKey] =
          await getTokenLengthByInput(
            systemPromptComponents[key as keyof SystemPromptComponents]
          );
      })
    );

    return {
      ...systemPromptComponentsWithTokenLength,
      ...systemPromptComponents,
    };
  }
}
