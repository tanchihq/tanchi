import { useState } from 'react';
import { Pencil, Server, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type SenderStatus } from '@/api/shared/enums';
import { type SenderDto } from '@/api/senders/entities/response.entities';
import SenderEditForm from '../sender-edit-form/SenderEditForm';
import useTestSender from '../hooks/useTestSender';
import useDeleteSender from '../hooks/useDeleteSender';

const STATUS_VARIANT: Readonly<
  Record<SenderStatus, 'warning' | 'success' | 'danger'>
> = {
  unverified: 'warning',
  active: 'success',
  error: 'danger',
};

type SenderCardProps = Readonly<{
  sender: SenderDto;
  onChanged: () => void;
}>;

const SenderCard = ({ sender, onChanged }: SenderCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { onFetch: test, isLoading: testing } = useTestSender({ onDone: onChanged });
  const { onFetch: remove, isLoading: removing } = useDeleteSender({ onDone: onChanged });

  if (isEditing) {
    return (
      <div className="rounded-[14px] border border-app-line bg-app-surface p-[18px_20px]">
        <div className="mb-4 flex items-center gap-2">
          <Pencil size={15} className="text-app-faint shrink-0" />
          <span className="truncate text-sm font-medium text-app-fg">
            Edit {sender.fromName}
          </span>
        </div>
        <SenderEditForm
          sender={sender}
          onCancel={() => setIsEditing(false)}
          onSaved={(updated) => {
            setIsEditing(false);
            if (updated.status === 'unverified') {
              toast.info(
                'Connection settings changed — run the connection test to reactivate this mailbox.',
              );
            } else {
              toast.success('Mailbox updated.');
            }
            onChanged();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-app-line bg-app-surface p-[16px_18px]">
      <Server size={18} className="text-app-faint shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-app-fg">
            {sender.fromName}
          </span>
          <Badge variant={STATUS_VARIANT[sender.status]}>{sender.status}</Badge>
        </div>
        <div className="truncate text-xs text-app-faint">
          {sender.fromEmail} · {sender.smtpHost} · cap {sender.dailyCap}/day
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditing(true)}
        aria-label="Edit mailbox"
      >
        <Pencil size={14} />
        Edit
      </Button>
      <Button variant="outline" size="sm" isLoading={testing} onClick={() => test(sender.id)}>
        Test
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="size-8 hover:text-app-danger-fg"
        isLoading={removing}
        onClick={() => remove(sender.id)}
        aria-label="Delete mailbox"
      >
        {!removing && <Trash2 size={15} />}
      </Button>
    </div>
  );
};

export default SenderCard;
