import { Loader2 } from 'lucide-react';

const FullPageLoader = () => (
  <div className="bg-background flex min-h-svh items-center justify-center">
    <Loader2 className="text-muted-foreground size-6 animate-spin" />
  </div>
);

export { FullPageLoader };
