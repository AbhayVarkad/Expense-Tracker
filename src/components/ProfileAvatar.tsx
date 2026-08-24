interface ProfileAvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
} as const;

export function ProfileAvatar({ name, color, size = "md" }: ProfileAvatarProps) {
  const initials = name
    .split(" ")
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm`}
      style={{ backgroundColor: color }}
    >
      {initials === "" ? "?" : initials}
    </span>
  );
}
