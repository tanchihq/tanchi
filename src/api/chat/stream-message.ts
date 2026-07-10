import { API_BASE_URL } from '@/api/utils';
import { ChatErrors } from './entities/errors';
import {
  type ChatStreamDeltaEvent,
  type ChatStreamDoneEvent,
  type ChatStreamErrorEvent,
  type ChatStreamUserEvent,
} from './entities/response.entities';

export type ChatStreamHandlers = Readonly<{
  onUser: (event: ChatStreamUserEvent) => void;
  onDelta: (event: ChatStreamDeltaEvent) => void;
  onDone: (event: ChatStreamDoneEvent) => void;
  onError: (code: string) => void;
}>;

const parseData = <T>(raw: string): T | null => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const readErrorCode = async (response: Response): Promise<string> => {
  try {
    const parsed = parseData<{ message?: string }>(await response.text());
    if (parsed !== null && typeof parsed.message === 'string') return parsed.message;
  } catch {
    return ChatErrors.sendFailed;
  }
  return ChatErrors.sendFailed;
};

const dispatchFrame = (frame: string, handlers: ChatStreamHandlers): void => {
  const lines = frame.split('\n');
  const eventLine = lines.find((line) => line.startsWith('event:'));
  if (eventLine === undefined) return;

  const eventName = eventLine.slice('event:'.length).trim();
  const dataRaw = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trimStart())
    .join('\n');
  if (dataRaw === '') return;

  if (eventName === 'user') {
    const data = parseData<ChatStreamUserEvent>(dataRaw);
    if (data !== null) handlers.onUser(data);
  } else if (eventName === 'delta') {
    const data = parseData<ChatStreamDeltaEvent>(dataRaw);
    if (data !== null) handlers.onDelta(data);
  } else if (eventName === 'done') {
    const data = parseData<ChatStreamDoneEvent>(dataRaw);
    if (data !== null) handlers.onDone(data);
  } else if (eventName === 'error') {
    const data = parseData<ChatStreamErrorEvent>(dataRaw);
    handlers.onError(data?.error ?? ChatErrors.llmFailed);
  }
};

const streamMessage = async (
  id: string,
  content: string,
  handlers: ChatStreamHandlers,
  signal: AbortSignal,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/chat/${id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    credentials: 'include',
    body: JSON.stringify({ content }),
    signal,
  });

  if (!response.ok || response.body === null) {
    handlers.onError(await readErrorCode(response));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const drainFrames = () => {
    let separator = buffer.indexOf('\n\n');
    while (separator !== -1) {
      const frame = buffer.slice(0, separator);
      buffer = buffer.slice(separator + 2);
      if (frame.trim() !== '') dispatchFrame(frame, handlers);
      separator = buffer.indexOf('\n\n');
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    drainFrames();
  }

  buffer += decoder.decode();
  drainFrames();
  if (buffer.trim() !== '') dispatchFrame(buffer, handlers);
};

export { streamMessage };
