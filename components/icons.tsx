/**
 * Hand-rolled icon set. Uniform 1.5px strokes on a 24px grid keeps the
 * hairline feel of the rest of the UI, which an off-the-shelf pack would
 * dilute.
 */
type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);

export const SendIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
);

export const StopIcon = (p: IconProps) => (
  <Icon {...p}><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" /></Icon>
);

export const PaperclipIcon = (p: IconProps) => (
  <Icon {...p}><path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10.5 18a2 2 0 0 1-3-3l8-8" /></Icon>
);

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.5-4.5" /></Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" /></Icon>
);

export const PencilIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m15 6 3 3" /></Icon>
);

export const CopyIcon = (p: IconProps) => (
  <Icon {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a1 1 0 0 1 1-1h9" /></Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}><path d="m5 13 4 4L19 7" /></Icon>
);

export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}><path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v4h-4" /></Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>
);

export const SunIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>
);

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" /></Icon>
);

export const SidebarIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M9.5 4v16" /></Icon>
);

export const NewspaperIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 5h12v14H5.5A1.5 1.5 0 0 1 4 17.5V5Z" /><path d="M16 8h3a1 1 0 0 1 1 1v8.5a1.5 1.5 0 0 1-3 0V8Z" /><path d="M7 8.5h6M7 12h6M7 15h4" /></Icon>
);

export const PlayIcon = (p: IconProps) => (
  <Icon {...p}><path d="M9 7.5 17 12l-8 4.5v-9Z" fill="currentColor" /></Icon>
);

export const UserIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></Icon>
);

export const GlobeIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.4 3.3 8.5s-1.1 6.1-3.3 8.5c-2.2-2.4-3.3-5.4-3.3-8.5S9.8 5.9 12 3.5Z" /></Icon>
);

export const LinkIcon = (p: IconProps) => (
  <Icon {...p}><path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1.6 1.6" /><path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7l1.6-1.6" /></Icon>
);

export const ArrowUpRightIcon = (p: IconProps) => (
  <Icon {...p}><path d="M7 17 17 7M8 7h9v9" /></Icon>
);

export const SparkIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 3.5c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z" /></Icon>
);

export const LogOutIcon = (p: IconProps) => (
  <Icon {...p}><path d="M14 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8" /><path d="M17 8.5 20.5 12 17 15.5M20 12h-9" /></Icon>
);

export const AlertIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5M12 16h.01" /></Icon>
);

export const ImageIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="8.75" cy="10" r="1.5" /><path d="m4 16.5 4.5-4 4 3.5 3-2.5 4.5 4" /></Icon>
);

export const BrainIcon = (p: IconProps) => (
  <Icon {...p}><path d="M9.5 4.5A2.5 2.5 0 0 0 7 7a2.5 2.5 0 0 0-1.5 4.5A2.5 2.5 0 0 0 7 16a2.5 2.5 0 0 0 2.5 2.5A1.5 1.5 0 0 0 12 17.5v-11a1.5 1.5 0 0 0-2.5-2Z" /><path d="M14.5 4.5A2.5 2.5 0 0 1 17 7a2.5 2.5 0 0 1 1.5 4.5A2.5 2.5 0 0 1 17 16a2.5 2.5 0 0 1-2.5 2.5A1.5 1.5 0 0 1 12 17.5v-11a1.5 1.5 0 0 1 2.5-2Z" /></Icon>
);

export const ThumbUpIcon = (p: IconProps) => (
  <Icon {...p}><path d="M7 11v8H4.5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1H7Zm0 0 3.5-6.5a1.5 1.5 0 0 1 2.8.9L12.5 9H18a1.6 1.6 0 0 1 1.55 1.96l-1.4 6A1.6 1.6 0 0 1 16.6 18H10a3 3 0 0 1-3-3v-4Z" /></Icon>
);

export const ThumbDownIcon = (p: IconProps) => (
  <Icon {...p}><path d="M17 13V5h2.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H17Zm0 0-3.5 6.5a1.5 1.5 0 0 1-2.8-.9l.8-3.6H6a1.6 1.6 0 0 1-1.55-1.96l1.4-6A1.6 1.6 0 0 1 7.4 6H14a3 3 0 0 1 3 3v4Z" /></Icon>
);
