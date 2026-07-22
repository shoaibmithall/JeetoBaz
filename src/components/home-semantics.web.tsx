import { useState, type CSSProperties, type ReactNode } from 'react';

type ChildrenProps = {
  children: ReactNode;
};

const visuallyHidden: CSSProperties = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
};

export function HomeSkipLink() {
  const [focused, setFocused] = useState(false);

  return (
    <a
      href="#main-content"
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      style={focused ? {
        background: '#FFD700',
        borderRadius: 8,
        color: '#000',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 14,
        fontWeight: 700,
        left: 12,
        padding: '10px 14px',
        position: 'fixed',
        top: 12,
        zIndex: 2147483647,
      } : visuallyHidden}
    >
      Skip to main content
    </a>
  );
}

export function HomeMain({ children }: ChildrenProps) {
  return <main id="main-content" tabIndex={-1} style={{ display: 'contents' }}>{children}</main>;
}

export function HomeNavigation({ children }: ChildrenProps) {
  return <nav aria-label="Prize categories" style={{ display: 'contents' }}>{children}</nav>;
}

const headingStyle: CSSProperties = {
  color: '#FFD700',
  fontSize: 24,
  fontWeight: 700,
  textAlign: 'center',
  padding: '14px 20px 4px',
  margin: 0,
  lineHeight: 1.3,
};

export function HomePageHeading() {
  return <h1 style={headingStyle}>Transparent Prize Campaigns in Pakistan</h1>;
}
