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

const headingWrapStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  paddingTop: 10,
  paddingBottom: 4,
  paddingLeft: 16,
  paddingRight: 16,
};

const quoteMarkStyle: CSSProperties = {
  opacity: 0.5,
  fontSize: '0.8em',
  fontWeight: 400,
  verticalAlign: 'middle',
};

type HomePageHeadingProps = {
  backgroundColor: string;
  textColor: string;
};

export function HomePageHeading({ backgroundColor, textColor }: HomePageHeadingProps) {
  const headingStyle: CSSProperties = {
    color: textColor,
    backgroundColor,
    fontSize: 'clamp(13px, 4vw, 17px)',
    fontWeight: 700,
    letterSpacing: 0.2,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    padding: '9px clamp(10px, 4vw, 18px)',
    margin: 0,
    lineHeight: 1.3,
    borderRadius: 999,
  };

  return (
    <div style={headingWrapStyle}>
      <h1 style={headingStyle}>
        <span style={quoteMarkStyle} aria-hidden="true">&ldquo;</span>
        {' '}Win Premium Prizes on JeetoBaz{' '}
        <span style={quoteMarkStyle} aria-hidden="true">&rdquo;</span>
      </h1>
    </div>
  );
}
