// Hand-drawn SVG glyphs for the Snapchat-specific shapes that Lucide doesn't have.
import { useId, type CSSProperties } from 'react';

export const COLORS = { red: '#F23C57', blue: '#0EADFF', purple: '#A05DCD', grey: '#A6A6A6' } as const;

export function SentArrow({ color, filled, size = 15 }: { color: string; filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size * 0.86} viewBox="0 0 22 19" fill="none" aria-hidden>
      <path
        d="M2.2 1.6 20 9.5 2.2 17.4 5.6 9.5Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={filled ? 1.5 : 1.9}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Snap = square, chat (bubble) = square with a tail at the bottom left, like the app. */
export function StatusSquare({ color, filled, size = 14, bubble }: { color: string; filled: boolean; size?: number; bubble?: boolean }) {
  return (
    <svg width={size} height={size * (bubble ? 1.12 : 1)} viewBox={bubble ? '0 0 16 18' : '0 0 16 16'} aria-hidden>
      {bubble ? (
        <path
          d="M4 1.6h8a2.4 2.4 0 0 1 2.4 2.4v7.6a2.4 2.4 0 0 1-2.4 2.4H5.2l-2.5 2.6c-.4.4-1.1.1-1.1-.4V4A2.4 2.4 0 0 1 4 1.6Z"
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={filled ? 1.3 : 1.7}
          strokeLinejoin="round"
        />
      ) : (
        <rect x="1.6" y="1.6" width="12.8" height="12.8" rx="2.4" fill={filled ? color : 'none'} stroke={color} strokeWidth={filled ? 1.3 : 1.7} />
      )}
    </svg>
  );
}

export function StarBadge({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Star" style={{ display: 'inline-block' }}>
      <circle cx="12" cy="12" r="10.2" fill="none" stroke="#E8C547" strokeWidth="2" />
      <circle cx="12" cy="12" r="7.6" fill="#E8C547" fillOpacity="0.18" />
      <path
        d="m12 6.8 1.55 3.3 3.6.42-2.66 2.47.7 3.56L12 14.78l-3.19 1.77.7-3.56-2.66-2.47 3.6-.42Z"
        fill="#fff"
      />
    </svg>
  );
}

export function SnapCamIcon({
  size = 25,
  color = '#F5F5F5',
  style,
  filled,
}: {
  size?: number;
  color?: string;
  style?: CSSProperties;
  filled?: boolean;
}) {
  const id = useId();
  if (filled) {
    // solid body with the lens punched out, like the Snapchat Web camera button
    return (
      <svg width={size} height={size} viewBox="0 0 26 24" style={style} aria-hidden>
        <mask id={id}>
          <rect width="26" height="24" fill="#fff" />
          <circle cx="13" cy="12.6" r="5" fill="#000" />
          <circle cx="13" cy="12.6" r="2.4" fill="#fff" />
        </mask>
        <path
          d="M8.4 4.2 9.8 1.9h6.4l1.4 2.3h3.3a3.6 3.6 0 0 1 3.6 3.6v10a3.6 3.6 0 0 1-3.6 3.6H5.1a3.6 3.6 0 0 1-3.6-3.6v-10a3.6 3.6 0 0 1 3.6-3.6Z"
          fill={color}
          mask={`url(#${id})`}
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 26 24" fill="none" style={style} aria-hidden>
      <path
        d="M8.6 4.6 9.9 2.5h6.2l1.3 2.1h3.4a3.2 3.2 0 0 1 3.2 3.2v10.1a3.2 3.2 0 0 1-3.2 3.2H5.2A3.2 3.2 0 0 1 2 17.9V7.8a3.2 3.2 0 0 1 3.2-3.2Z"
        stroke={color}
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="12.8" r="4.3" stroke={color} strokeWidth="2.1" />
    </svg>
  );
}

export function MapNavIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" aria-hidden>
      <path
        d="M15 27.2s-9.2-8.1-9.2-14.5a9.2 9.2 0 1 1 18.4 0c0 6.4-9.2 14.5-9.2 14.5Z"
        stroke="#fff"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="12.7" r="3.6" stroke="#fff" strokeWidth="2.1" />
    </svg>
  );
}

export function ChatNavIcon({ size = 30, active }: { size?: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" aria-hidden>
      <path
        d="M7.6 5.2h14.8a3.4 3.4 0 0 1 3.4 3.4v14.6c0 1.4-1.6 2.2-2.7 1.3l-2.4-2H7.6a3.4 3.4 0 0 1-3.4-3.4V8.6a3.4 3.4 0 0 1 3.4-3.4Z"
        fill={active ? '#fff' : 'none'}
        stroke="#fff"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CameraNavIcon({ size = 30 }: { size?: number }) {
  return <SnapCamIcon size={size} color="#fff" />;
}

export function SpotlightNavIcon({ size = 30, active }: { size?: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" aria-hidden>
      <path
        d="M6.6 9.4c0-2 2.2-3.3 4-2.3l12.7 7.1c1.8 1 1.8 3.6 0 4.6l-12.7 7.1c-1.8 1-4-.3-4-2.3Z"
        transform="rotate(-24 15 15)"
        fill={active ? '#fff' : 'none'}
        stroke="#fff"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ComposeIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" aria-hidden>
      <path
        d="M14 6.2H7.4a3 3 0 0 0-3 3v12.4c0 1.3 1.5 2 2.5 1.2l2.1-1.8h10.6a3 3 0 0 0 3-3v-3.4"
        stroke="#000"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m24.6 4.6 2 2a1.4 1.4 0 0 1 0 2L17.4 17.8l-3.8.9.9-3.8 9.2-9.2a1.4 1.4 0 0 1 2 0Z" fill="#000" />
    </svg>
  );
}

export function AddFriendIcon({ size = 24, white }: { size?: number; white?: boolean }) {
  const c = white ? '#fff' : '#000';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10" cy="7.4" r="4" stroke={c} strokeWidth="2" />
      <path d="M3 20.4c0-3.6 3-6 7-6 1.2 0 2.3.2 3.2.6" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 13.6v7M14.5 17.1h7" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function GenericAvatar({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" fill="#3a3a3a" />
      <circle cx="20" cy="16" r="7" fill="#8a8a8a" />
      <path d="M6 38c1.6-7.4 7.2-11 14-11s12.4 3.6 14 11Z" fill="#8a8a8a" />
    </svg>
  );
}

export function FriendsNavIcon({ size = 30, active }: { size?: number; active: boolean }) {
  const fill = active ? '#fff' : 'none';
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" aria-hidden>
      <circle cx="19.6" cy="9.3" r="3.6" fill={fill} stroke="#fff" strokeWidth="2.1" />
      <path d="M17.5 16.7c.7-.2 1.4-.3 2.1-.3 3.6 0 6.5 2.6 6.5 5.6 0 .9-.7 1.6-1.6 1.6h-3.2" fill={fill} stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="10.4" r="4.4" fill={fill} stroke="#fff" strokeWidth="2.1" />
      <path d="M3.4 23.6c0-4 3.4-6.6 7.6-6.6s7.6 2.6 7.6 6.6c0 .9-.7 1.6-1.6 1.6H5c-.9 0-1.6-.7-1.6-1.6Z" fill={fill} stroke="#fff" strokeWidth="2.3" strokeLinejoin="round" />
    </svg>
  );
}

export function PlayNavIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" aria-hidden>
      <path d="M8.6 6.9c0-1.6 1.7-2.6 3.1-1.8l12.3 7.3c1.4.8 1.4 2.8 0 3.6l-12.3 7.3c-1.4.8-3.1-.2-3.1-1.8Z" stroke="#fff" strokeWidth="2.1" strokeLinejoin="round" />
    </svg>
  );
}

export function MapPinFilled({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden>
      <path
        fillRule="evenodd"
        d="M15 2.4a10.4 10.4 0 0 0-10.4 10.4c0 7.2 9 15.2 9.4 15.6.6.5 1.4.5 2 0 .4-.4 9.4-8.4 9.4-15.6A10.4 10.4 0 0 0 15 2.4Zm0 6.2a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Z"
        fill="#fff"
      />
    </svg>
  );
}
