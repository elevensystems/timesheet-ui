import * as React from 'react';

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';

// Re-export toast for convenience: import { toast } from '@/components/ui/sonner'
export const toast = sonnerToast;

// Drop-in Toaster with sensible defaults. Place once in the app shell.
export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster position='top-center' richColors closeButton {...props} />
  );
}
