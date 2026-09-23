import type { ReactNode } from 'react';

export interface PreviewVariant {
  name: string;
  element: ReactNode;
}

export interface ComponentPreview {
  name: string;
  /**
   * Which screen and section of `docs/Housing360 Portal.html` this component
   * mirrors, so a reviewer can put the two side by side rather than compare
   * against a remembered impression of the design.
   */
  reference: string;
  variants: PreviewVariant[];
}
