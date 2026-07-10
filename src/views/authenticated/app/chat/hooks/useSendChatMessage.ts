import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { streamMessage } from '@/api/chat';
import { ChatErrors } from '@/api/chat/entities/errors';
import {
  type ChatStreamDoneEvent,
  type ChatStreamUserEvent,
} from '@/api/chat/entities/response.entities';

type UseSendChatMessageProps = Readonly<{
  onUser: (event: ChatStreamUserEvent) => void;
  onDelta: (text: string) => void;
  onDone: (event: ChatStreamDoneEvent) => void;
  onError: (content: string) => void;
}>;

const errorToast = (code: string): void => {
  switch (code) {
    case ChatErrors.invalidContent:
      toast.error('Message must be between 1 and 8000 characters.');
      break;
    case ChatErrors.llmFailed:
      toast.error('The assistant could not respond. Please try again.');
      break;
    default:
      toast.error("Couldn't send the message, please try again.");
  }
};

const useSendChatMessage = ({
  onUser,
  onDelta,
  onDone,
  onError,
}: UseSendChatMessageProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const send = async (id: string, content: string) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    let failed = false;
    const fail = (code: string) => {
      if (!mountedRef.current || failed) return;
      failed = true;
      errorToast(code);
      onError(content);
    };

    try {
      await streamMessage(
        id,
        content,
        {
          onUser: (event) => {
            if (mountedRef.current) onUser(event);
          },
          onDelta: (event) => {
            if (mountedRef.current) onDelta(event.text);
          },
          onDone: (event) => {
            if (mountedRef.current) onDone(event);
          },
          onError: (code) => fail(code),
        },
        controller.signal,
      );
    } catch {
      if (!controller.signal.aborted) fail(ChatErrors.sendFailed);
    } finally {
      if (mountedRef.current) setIsStreaming(false);
    }
  };

  return { send, isStreaming };
};

export default useSendChatMessage;
