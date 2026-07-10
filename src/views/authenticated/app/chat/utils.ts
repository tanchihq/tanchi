import { type ProspectDto } from '@/api/prospects/entities/response.entities';
import { type ChatActionName } from '@/api/chat/entities/response.entities';

export const MESSAGE_MAX_LENGTH = 8000;

export const ACTION_LABEL: Readonly<Record<ChatActionName, string>> = {
  create_lead: 'Creating the prospect card…',
  fetch_context: 'Fetching context…',
  rewrite_draft: 'Rewriting the message…',
};

export const conversationTitle = (title: string): string =>
  title.trim() === '' ? 'New conversation' : title;

export const conversationTime = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const matchesProspect = (prospect: ProspectDto, query: string): boolean => {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return true;
  return (
    `${prospect.firstName} ${prospect.lastName}`.toLowerCase().includes(needle) ||
    prospect.company.toLowerCase().includes(needle)
  );
};
