import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type AuthSubmitProps = Readonly<{
  loading: boolean;
  children: ReactNode;
}>;

const AuthSubmit = ({ loading, children }: AuthSubmitProps) => (
  <button
    type="submit"
    disabled={loading}
    className="shadow-brand mt-2 flex h-[52px] items-center justify-center rounded-well bg-brand-600 text-[15px] font-medium tracking-tight text-white transition-colors hover:bg-brand-700 active:bg-brand-800 disabled:opacity-70"
  >
    {loading ? <Loader2 className="size-5 animate-spin" /> : children}
  </button>
);

export { AuthSubmit };
