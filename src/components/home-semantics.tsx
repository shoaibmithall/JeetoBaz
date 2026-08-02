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

type HomePageHeadingProps = {
  backgroundColor: string;
  textColor: string;
};

export function HomePageHeading(_props: HomePageHeadingProps) {
  return null;
}
