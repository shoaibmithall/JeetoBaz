import { type ReactNode } from 'react';

type HtmlProps = {
  children: ReactNode;
};

export default function RootHtml({ children }: HtmlProps) {
  return (
    <html lang="en">
      {children}
    </html>
  );
}
