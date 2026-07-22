import type { ReactNode } from 'react';

type ChildrenProps = {
  children: ReactNode;
};

export function HomeSkipLink() {
  return null;
}

export function HomeMain({ children }: ChildrenProps) {
  return <>{children}</>;
}

export function HomeNavigation({ children }: ChildrenProps) {
  return <>{children}</>;
}

export function HomePageHeading() {
  return null;
}
