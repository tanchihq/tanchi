import { env } from "../../env.ts";
import type { LlmProvider } from "./types.ts";
import { ClaudeCliProvider } from "./cli.ts";
import { AnthropicApiProvider } from "./api.ts";
import { DEFAULT_MODEL } from "./models.ts";

function createLlmProvider(): LlmProvider {
  if (env.LLM_PROVIDER === "api") {
    if (env.ANTHROPIC_API_KEY === undefined) {
      throw new Error("[llm] LLM_PROVIDER=api requires ANTHROPIC_API_KEY");
    }
    return new AnthropicApiProvider(env.ANTHROPIC_API_KEY, DEFAULT_MODEL);
  }
  return new ClaudeCliProvider(
    env.CLAUDE_CLI_BIN,
    env.CLAUDE_CLI_TIMEOUT_MS
  );
}

export const llm: LlmProvider = createLlmProvider();

export { agentModel, DEFAULT_MODEL } from "./models.ts";
export type { AgentKey } from "./models.ts";

export type {
  LlmProvider,
  LlmGenerateInput,
  LlmResearchInput,
  LlmAgentEvent,
  LlmAgentInput,
  LlmMcpServer,
  LlmToolInvocation,
  LlmToolSpec,
} from "./types.ts";
