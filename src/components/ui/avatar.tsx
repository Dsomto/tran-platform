import { cn, getInitials } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ src, firstName, lastName, size = "md", className }: AvatarProps) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
    xl: "h-20 w-20 text-2xl",
  };

  const imgSizes = { sm: 32, md: 40, lg: 56, xl: 80 };

  if (src) {
    return (
      <div className={cn("relative rounded-full overflow-hidden", sizes[size], className)}>
        <Image
          src={src}
          alt={`${firstName} ${lastName}`}
          width={imgSizes[size]}
          height={imgSizes[size]}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-blue flex items-center justify-center text-white font-semibold",
        sizes[size],
        className
      )}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}
