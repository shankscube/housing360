import type { ReactNode } from 'react';

export interface PreviewVariant {
  name: string;
  element: ReactNode;
}

export interface ComponentPreview {
  name: string;
  variants: PreviewVariant[];
}
