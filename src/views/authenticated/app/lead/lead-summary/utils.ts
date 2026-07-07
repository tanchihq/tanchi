import { type LeadDetailDto } from '@/api/prospects/entities/response.entities';

const NOT_AVAILABLE = 'not available';

const whatsAppUrl = (phone: string): string =>
  `https://wa.me/${phone.replace(/\D/g, '')}`;

export type ChannelBadgeAction = Readonly<{
  href: string | null;
  tooltip: string;
}>;

export const channelBadgeAction = (lead: LeadDetailDto): ChannelBadgeAction => {
  switch (lead.channel) {
    case 'email':
      return { href: null, tooltip: lead.email ?? NOT_AVAILABLE };
    case 'linkedin':
      return { href: lead.linkedinUrl, tooltip: lead.linkedinUrl ?? NOT_AVAILABLE };
    case 'instagram':
      return { href: lead.instagramUrl, tooltip: lead.instagramUrl ?? NOT_AVAILABLE };
    case 'whatsapp':
      return {
        href: lead.phone ? whatsAppUrl(lead.phone) : null,
        tooltip: lead.phone ?? NOT_AVAILABLE,
      };
    case 'sms':
      return {
        href: lead.phone ? `sms:${lead.phone}` : null,
        tooltip: lead.phone ?? NOT_AVAILABLE,
      };
    case 'call':
      return {
        href: lead.phone ? `tel:${lead.phone}` : null,
        tooltip: lead.phone ?? NOT_AVAILABLE,
      };
  }
};
