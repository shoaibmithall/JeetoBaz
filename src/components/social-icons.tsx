import { Svg, Path, Circle, Stop, Defs, LinearGradient } from 'react-native-svg';

type IconProps = { size?: number };

export function FacebookIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#1877F2" />
      <Path
        d="M16.67 15.49l.54-3.53h-3.39v-2.29c0-.97.47-1.91 1.99-1.91h1.54V4.56s-1.4-.24-2.74-.24c-2.8 0-4.63 1.7-4.63 4.78v2.71H7.8v3.53h2.78v8.54a11.07 11.07 0 003.44 0v-8.54h2.65z"
        fill="white"
      />
    </Svg>
  );
}

export function InstagramIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="instagram-gradient" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#F58529" />
          <Stop offset="0.3" stopColor="#DD2A7B" />
          <Stop offset="0.65" stopColor="#8134AF" />
          <Stop offset="1" stopColor="#515BD4" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="12" fill="url(#instagram-gradient)" />
      <Path
        d="M12 7.2a4.8 4.8 0 100 9.6 4.8 4.8 0 000-9.6zm0 7.84a3.04 3.04 0 110-6.08 3.04 3.04 0 010 6.08z"
        fill="white"
      />
      <Path
        d="M17.6 7.24a1.12 1.12 0 11-2.24 0 1.12 1.12 0 012.24 0z"
        fill="white"
      />
      <Path
        d="M12 2.4c-2.6 0-2.92-.01-3.94-.06-.93-.04-1.56.2-2.02.42-.47.23-.87.53-1.27.93-.4.4-.7.8-.93 1.27-.22.46-.46 1.09-.42 2.02-.05 1.02-.06 1.34-.06 3.94s.01 2.92.06 3.94c.04.93.28 1.56.5 2.02.23.47.53.87.93 1.27.4.4.8.7 1.27.93.46.22 1.09.46 2.02.42 1.02.05 1.34.06 3.94.06s2.92-.01 3.94-.06c.93-.04 1.56-.28 2.02-.5.47-.23.87-.53 1.27-.93.4-.4.7-.8.93-1.27.22-.46.46-1.09.42-2.02.05-1.02.06-1.34.06-3.94s-.01-2.92-.06-3.94c-.04-.93-.28-1.56-.5-2.02a3.41 3.41 0 00-.93-1.27 3.41 3.41 0 00-1.27-.93c-.46-.22-1.09-.46-2.02-.42-1.02-.05-1.34-.06-3.94-.06z"
        fill="white"
        fillRule="evenodd"
      />
    </Svg>
  );
}

export function TikTokIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#010101" />
      <Path
        d="M16.6 5.82A4.28 4.28 0 0113.4 4h-2.7v10.32a2.58 2.58 0 01-2.58 2.52 2.58 2.58 0 01-2.58-2.52A2.58 2.58 0 018.12 12.2c.28 0 .55.04.8.11V9.6a5.28 5.28 0 00-.8-.06 5.26 5.26 0 00-5.26 5.26 5.26 5.26 0 005.26 5.26 5.26 5.26 0 005.26-5.26V9.42a7.08 7.08 0 004.14 1.34V8.06a4.28 4.28 0 01-.92-.24z"
        fill="white"
      />
      <Path
        d="M15.44 5.56l-.08.14a4.28 4.28 0 01-2.12 2.12l.08-.14a4.28 4.28 0 002.12-2.12z"
        fill="#25F4EE"
      />
      <Path
        d="M16.6 5.82a4.28 4.28 0 01-2.12 2.12l.08-.14a4.28 4.28 0 002.04-1.98z"
        fill="#FE2C55"
      />
    </Svg>
  );
}

export function YouTubeIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#FF0000" />
      <Path
        d="M18.87 8.16a2.34 2.34 0 00-1.65-1.65C15.73 6.17 12 6.17 12 6.17s-3.73 0-5.22.34a2.34 2.34 0 00-1.65 1.65C4.79 9.65 4.79 12 4.79 12s0 2.35.34 3.84a2.34 2.34 0 001.65 1.65c1.49.34 5.22.34 5.22.34s3.73 0 5.22-.34a2.34 2.34 0 001.65-1.65c.34-1.49.34-3.84.34-3.84s0-2.35-.34-3.84zM10.42 14.86v-5.72L15.26 12l-4.84 2.86z"
        fill="white"
      />
    </Svg>
  );
}

export function SnapchatIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#FFFC00" />
      <Path
        d="M12 4.8c-1.98 0-3.58.72-3.58 2.54 0 .6.14 1.14.38 1.64-.78.24-1.52.66-1.52 1.32 0 .88 1.08 1.36 2.18 1.62-.06.32-.14.68-.14 1.04 0 1.08.62 1.72 1.38 2.14-.32.44-.56.96-.56 1.54 0 .56.38 1.04.86 1.04.4 0 .76-.22 1.18-.22.3 0 .58.1.88.1.3 0 .58-.1.88-.1.42 0 .78.22 1.18.22.48 0 .86-.48.86-1.04 0-.58-.24-1.1-.56-1.54.76-.42 1.38-1.06 1.38-2.14 0-.36-.08-.72-.14-1.04 1.1-.26 2.18-.74 2.18-1.62 0-.66-.74-1.08-1.52-1.32.24-.5.38-1.04.38-1.64C15.58 5.52 13.98 4.8 12 4.8z"
        fill="#333333"
      />
    </Svg>
  );
}

export function XIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#000000" />
      <Path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        fill="white"
      />
    </Svg>
  );
}

export function TelegramIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill="#0088CC" />
      <Path
        d="M7.7 17.36l.38-5.96L16.44 12l-8.36 1.4.38 2.46-1.66 1.5zm-.86-1.4l.72-3.44 8.88-5.38-9.6 8.82zm5.26-6.26l-.66 6.28-2.4-2.74 5.8-3.54-2.74 0zm3.4-2.34l-5.8 3.54.86-3.94 4.94.4z"
        fill="white"
      />
    </Svg>
  );
}
