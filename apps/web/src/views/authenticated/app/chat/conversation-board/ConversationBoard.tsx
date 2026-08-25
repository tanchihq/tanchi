import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type ChatActionName,
  type ChatConversationDto,
  type ChatLeadDto,
  type ChatMessageDto,
} from '@/api/chat/entities/response.entities';
import useSendChatMessage from '../hooks/useSendChatMessage';
import useAttachLead from '../hooks/useAttachLead';
import useDetachLead from '../hooks/useDetachLead';
import useRetrieveProspects from '../hooks/useRetrieveProspects';
import useRefreshConversation from '../hooks/useRefreshConversation';
import MessageBubble from '../message-bubble/MessageBubble';
import AssistantStream from '../assistant-stream/AssistantStream';
import LeadAttachMenu from '../lead-attach/LeadAttachMenu';
import LeadChip from '../lead-attach/LeadChip';
import { conversationTitle, MESSAGE_MAX_LENGTH } from '../utils';

type ConversationBoardProps = Readonly<{
  conversation: ChatConversationDto;
  onConversationChanged: () => void;
}>;

const ConversationBoard = ({
  conversation,
  onConversationChanged,
}: ConversationBoardProps) => {
  const [messages, setMessages] = useState<ReadonlyArray<ChatMessageDto>>(
    conversation.messages,
  );
  const [leads, setLeads] = useState<ReadonlyArray<ChatLeadDto>>(conversation.leads);
  const [title, setTitle] = useState(conversation.title);
  const [draftUser, setDraftUser] = useState<string | null>(null);
  const [assistantText, setAssistantText] = useState<string | null>(null);
  const [actions, setActions] = useState<ReadonlyArray<ChatActionName>>([]);
  const [streaming, setStreaming] = useState(false);
  const [input, setInput] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const actedRef = useRef(false);

  const prospectsQuery = useRetrieveProspects();

  const { onFetch: refreshConversation } = useRefreshConversation({
    onRefreshed: (fresh) => {
      setLeads(fresh.leads);
      setTitle(fresh.title);
    },
  });

  const { send } = useSendChatMessage({
    onUser: (event) => {
      setMessages((current) => [...current, event.message]);
      setDraftUser(null);
      setTitle(event.title);
    },
    onAction: (name) => {
      actedRef.current = true;
      setActions((current) => [...current, name]);
    },
    onDelta: (text) => setAssistantText((current) => (current ?? '') + text),
    onDone: (event) => {
      setMessages((current) => [...current, event.message]);
      setAssistantText(null);
      setActions([]);
      setDraftUser(null);
      setTitle(event.title);
      setStreaming(false);
      onConversationChanged();
      if (actedRef.current) {
        refreshConversation(conversation.id);
        prospectsQuery.refetch();
      }
    },
    onError: (content) => {
      setDraftUser(null);
      setAssistantText(null);
      setActions([]);
      setStreaming(false);
      setInput(content);
    },
    onSettled: () => setStreaming(false),
  });

  const { onFetch: attach } = useAttachLead({
    onAttached: (lead) => setLeads((current) => [...current, lead]),
  });

  const { onFetch: detach } = useDetachLead({
    onDetached: (leadId) =>
      setLeads((current) => current.filter((lead) => lead.leadId !== leadId)),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, assistantText, draftUser, actions.length]);

  useEffect(() => {
    const element = inputRef.current;
    if (element === null) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }, [input]);

  const submit = () => {
    const content = input.trim();
    if (content === '' || streaming) return;
    actedRef.current = false;
    setInput('');
    setDraftUser(content);
    setAssistantText(null);
    setActions([]);
    setStreaming(true);
    send(conversation.id, content);
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="flex shrink-0 items-center border-b border-app-line px-6 py-3">
        <span className="truncate text-sm font-medium tracking-tight text-app-fg">
          {conversationTitle(title)}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto flex max-w-[760px] flex-col gap-3.5">
          {messages.length === 0 && draftUser === null && !streaming && (
            <div className="mt-10 text-center text-[13.5px] leading-relaxed text-app-faint">
              Ask anything about your prospects. Add leads to the chat bar below to give the
              assistant context.
            </div>
          )}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
            />
          ))}
          {draftUser !== null && <MessageBubble role="user" content={draftUser} />}
          {streaming && <AssistantStream actions={actions} text={assistantText} />}
          <div ref={bottomRef} />
        </div>
      </div>

      <footer className="shrink-0 px-6 pb-4 pt-1">
        <div className="mx-auto max-w-[760px]">
          <div className="rounded-2xl border border-app-line bg-app-well transition-colors focus-within:border-app-accent-line">
            <div className="flex flex-wrap items-center gap-1.5 px-2.5 pt-2.5">
              {leads.map((lead) => (
                <LeadChip
                  key={lead.leadId}
                  lead={lead}
                  onRemove={(leadId) => detach({ id: conversation.id, leadId })}
                />
              ))}
              <LeadAttachMenu
                candidates={prospectsQuery.data ?? []}
                attachedLeadIds={leads.map((lead) => lead.leadId)}
                onAttach={(leadId) => attach({ id: conversation.id, leadId })}
              />
            </div>
            <div className="flex items-end gap-2 px-2.5 pb-2.5 pt-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    submit();
                  }
                }}
                rows={1}
                maxLength={MESSAGE_MAX_LENGTH}
                placeholder="Message the copilot…"
                className="text-app-fg placeholder:text-app-faint max-h-[160px] min-h-[40px] flex-1 resize-none overflow-y-auto bg-transparent px-1.5 py-2 text-sm leading-relaxed outline-none"
              />
              <Button
                size="icon"
                className="size-9 shrink-0"
                disabled={input.trim() === '' || streaming}
                onClick={submit}
                aria-label="Send message"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
          <div className="mt-1.5 px-1 text-[11px] text-app-faint">
            Enter to send · Shift+Enter for a new line · attached leads give the assistant
            context
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ConversationBoard;
