import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Icons drawn with the exact paths from the design files (24 × 24 grid).
 * `size` is in points (already scaled by the caller), `sw` is the stroke width.
 */
type P = { size: number; color: string; sw?: number };

const svg = (size: number, children: React.ReactNode) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {children}
  </Svg>
);

const line = (color: string, sw: number) => ({
  stroke: color,
  strokeWidth: sw,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const ArrowRight = ({ size, color, sw = 2.6 }: P) => svg(size, <Path d="M5 12h14M13 6l6 6-6 6" {...line(color, sw)} />);
export const ChevronLeft = ({ size, color, sw = 2.4 }: P) => svg(size, <Path d="M15 5l-7 7 7 7" {...line(color, sw)} />);
export const ChevronRight = ({ size, color, sw = 2 }: P) => svg(size, <Path d="M9 5l7 7-7 7" {...line(color, sw)} />);
export const ChevronDown = ({ size, color, sw = 2.2 }: P) => svg(size, <Path d="M6 9l6 6 6-6" {...line(color, sw)} />);
export const Check = ({ size, color, sw = 3 }: P) => svg(size, <Path d="M5 13l4 4 10-10" {...line(color, sw)} />);
export const Send = ({ size, color, sw = 1.8 }: P) =>
  svg(size, <Path d="M3 20l18-8L3 4v6.5l12 1.5-12 1.5V20Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />);
export const Close = ({ size, color, sw = 2.4 }: P) => svg(size, <Path d="M6 6l12 12M18 6L6 18" {...line(color, sw)} />);
export const Plus = ({ size, color, sw = 2.4 }: P) => svg(size, <Path d="M12 5v14M5 12h14" {...line(color, sw)} />);

export const Pin = ({ size, color, sw = 1.9 }: P) =>
  svg(
    size,
    <>
      <Path d="M12 22s7-7.58 7-12.5A7 7 0 0 0 5 9.5C5 14.42 12 22 12 22Z" stroke={color} strokeWidth={sw} />
      <Circle cx={12} cy={9.5} r={2.2} stroke={color} strokeWidth={sw} />
    </>,
  );

export const Heart = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <Path
      d="M12 21s-7-4.6-9.3-9.1C.9 8.1 2.6 4.5 6 4c2-.3 3.6.7 6 3.2C14.4 4.7 16 3.7 18 4c3.4.5 5.1 4.1 3.3 7.9C19 16.4 12 21 12 21Z"
      stroke={color}
      strokeWidth={sw}
      strokeLinejoin="round"
    />,
  );

/** "No cold DMs" bin-with-cross. */
export const NoDM = ({ size, color, sw = 1.8 }: P) =>
  svg(size, <Path d="M4 6h16M4 6l1.5 13.5A2 2 0 0 0 7.5 21h9a2 2 0 0 0 2-1.5L20 6M9 10l6 6m0-6l-6 6" {...line(color, sw)} />);

export const Shield = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <>
      <Path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M9 12l2 2 4-4" {...line(color, sw)} />
    </>,
  );

export const Target = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <>
      <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={sw} />
      <Circle cx={12} cy={12} r={4.2} stroke={color} strokeWidth={sw} />
      <Circle cx={12} cy={12} r={1.4} fill={color} />
    </>,
  );

export const Coffee = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <>
      <Path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M16 10.5h1.5a2 2 0 0 1 0 4H16" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M8 5.5c-.8.7-.8 1.5 0 2.2M11.5 5.5c-.8.7-.8 1.5 0 2.2" stroke={color} strokeWidth={sw * 0.83} strokeLinecap="round" />
    </>,
  );

export const Mail = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <>
      <Rect x={3} y={5} width={18} height={14} rx={2} stroke={color} strokeWidth={sw} />
      <Path d="M4 7l8 6 8-6" {...line(color, sw)} />
    </>,
  );

export const Calendar = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <>
      <Rect x={3} y={5} width={18} height={16} rx={2} stroke={color} strokeWidth={sw} />
      <Path d="M3 10h18M8 3v4M16 3v4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>,
  );

export const Lock = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <>
      <Rect x={3} y={11} width={18} height={10} rx={2} stroke={color} strokeWidth={sw} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth={sw} />
    </>,
  );

export const Camera = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <>
      <Path d="M4 8h3l1.4-2h7.2L17 8h3v11H4Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <Circle cx={12} cy={13.5} r={3} stroke={color} strokeWidth={sw} />
    </>,
  );

export const ImageGlyph = ({ size, color, sw = 1.6 }: P) =>
  svg(
    size,
    <>
      <Rect x={3} y={5} width={18} height={14} rx={2} stroke={color} strokeWidth={sw} />
      <Circle cx={9} cy={10.5} r={2} stroke={color} strokeWidth={sw} />
      <Path d="M3 16l5-4 4 3 3-2.5 6 5.5" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
    </>,
  );

export const Search = ({ size, color, sw = 2 }: P) =>
  svg(
    size,
    <>
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={sw} />
      <Path d="M21 21l-4.3-4.3" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>,
  );

export const Bell = ({ size, color, sw = 1.8 }: P) =>
  svg(size, <Path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />);

export const Filters = ({ size, color, sw = 2 }: P) =>
  svg(size, <Path d="M4 6h16M7 12h10M10 18h4" stroke={color} strokeWidth={sw} strokeLinecap="round" />);

export const Dots = ({ size, color }: Omit<P, 'sw'>) =>
  svg(
    size,
    <>
      <Circle cx={5} cy={12} r={1.6} fill={color} />
      <Circle cx={12} cy={12} r={1.6} fill={color} />
      <Circle cx={19} cy={12} r={1.6} fill={color} />
    </>,
  );

export const Gear = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <>
      <Path
        d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4.6a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.3 2.6a7.4 7.4 0 0 0-1.7 1l-2.4-.6-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-.6a7.4 7.4 0 0 0 1.7 1L11 21h4l.3-2.6a7.4 7.4 0 0 0 1.7-1l2.4.6 2-3.4Z"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={sw} />
    </>,
  );

const STAR = 'M12 2.5l2.9 6.1 6.6.7-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.7L12 2.5Z';
export const Star = ({ size, color, fill, sw = 1.2 }: P & { fill: string }) =>
  svg(size, <Path d={STAR} fill={fill} stroke={color} strokeWidth={sw} />);

export const Bookmark = ({ size, color, fill = 'none', sw = 1.8 }: P & { fill?: string }) =>
  svg(size, <Path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" fill={fill} stroke={color} strokeWidth={sw} strokeLinejoin="round" />);

export const Smile = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <>
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={sw} />
      <Path d="M8.5 14a4.5 4.5 0 0 0 7 0" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={9.2} cy={10} r={1.1} fill={color} />
      <Circle cx={14.8} cy={10} r={1.1} fill={color} />
    </>,
  );

export const Keyboard = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <>
      <Rect x={3} y={6} width={18} height={12} rx={2.5} stroke={color} strokeWidth={sw} />
      <Path d="M7 10h.01M11 10h.01M15 10h.01M17 10h.01M7 14h10" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>,
  );

export const Trash = ({ size, color, sw = 1.8 }: P) =>
  svg(size, <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" {...line(color, sw)} />);

/* Tab bar */
export const Compass = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <>
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={sw} />
      <Path d="M15 9l-2 5-4 1 2-5 4-1Z" stroke={color} strokeWidth={sw * 0.83} strokeLinejoin="round" />
    </>,
  );

export const Inbox = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <>
      <Path d="M4 12h4l1.5 2.5h5L16 12h4" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <Path
        d="M4 12 5.5 6.5A1.5 1.5 0 0 1 7 5.3h10a1.5 1.5 0 0 1 1.5 1.2L20 12v5.5A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    </>,
  );

export const Chat = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <Path
      d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-4 3.5V16H6.5A2.5 2.5 0 0 1 4 13.5Z"
      stroke={color}
      strokeWidth={sw}
      strokeLinejoin="round"
    />,
  );

export const User = ({ size, color, sw = 1.8 }: P) =>
  svg(
    size,
    <>
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={sw} />
      <Circle cx={12} cy={10} r={2.6} stroke={color} strokeWidth={sw} />
      <Path d="M6.8 18a5.6 5.6 0 0 1 10.4 0" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>,
  );
