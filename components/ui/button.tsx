import { cn } from "@/lib/utils";

export type ButtonVariant = "brand" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  brand: "bg-brand text-brand-foreground hover:brightness-110",
  outline: "border border-border bg-transparent hover:bg-surface",
  ghost: "bg-transparent hover:bg-surface",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-9 w-9",
};

/**
 * Class dùng chung cho nút — cảm giác nhấn (active:scale), hover mượt và focus
 * ring rõ cho người dùng bàn phím. Tách hàm để tái dùng cho cả <a> lẫn <button>.
 */
export function buttonClasses(
  variant: ButtonVariant = "brand",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-lg font-semibold",
    "transition duration-200 ease-out active:scale-[0.97]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "brand",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}
