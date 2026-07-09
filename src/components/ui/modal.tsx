import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}>;

const Modal = ({ open, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass-card shadow-glass relative z-10 w-full max-w-[440px] rounded-[18px] border border-white/[0.08] bg-[#171733] p-[22px_24px]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-[15px] font-medium tracking-tight text-[#F3F2F8]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-0.5 shrink-0 text-[#6F6C85] transition-colors hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
};

export { Modal };
