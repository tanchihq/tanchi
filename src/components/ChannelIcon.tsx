import { type CSSProperties } from 'react';
import { Mail, MessageCircle, MessageSquare, Phone } from 'lucide-react';
import { type Channel } from '@/api/shared/enums';

type IconProps = Readonly<{
  size?: number;
  className?: string;
  style?: CSSProperties;
}>;

const LinkedinGlyph = ({ size = 14, className, style }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4" />
  </svg>
);

const InstagramGlyph = ({ size = 14, className, style }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.5 6.5v.01" />
  </svg>
);

type ChannelIconProps = IconProps & Readonly<{ channel: Channel }>;

const ChannelIcon = ({ channel, size = 14, className, style }: ChannelIconProps) => {
  const props = { size, className, style };
  switch (channel) {
    case 'email':
      return <Mail {...props} />;
    case 'linkedin':
      return <LinkedinGlyph {...props} />;
    case 'whatsapp':
      return <MessageCircle {...props} />;
    case 'instagram':
      return <InstagramGlyph {...props} />;
    case 'sms':
      return <MessageSquare {...props} />;
    case 'call':
      return <Phone {...props} />;
  }
};

export { ChannelIcon, LinkedinGlyph, InstagramGlyph };
