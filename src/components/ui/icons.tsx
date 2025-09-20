import { cva, VariantProps } from "class-variance-authority";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Heart,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Minus,
  PackagePlus,
  Plus,
  Settings2,
  ShoppingBag,
  ShoppingBasket,
  Store,
  Upload,
  User,
  Verified,
  X,
  type LucideProps,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const IconsVariants = cva("size-3 shrink-0");
export type IconProps = {} & LucideProps & VariantProps<typeof IconsVariants>;
export type Icon = keyof typeof Icons;

export const Icons = {
  logo: ({ className, ...props }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={cn(IconsVariants({}), "h-8 w-8", className)}
      {...props}
    >
      <rect width="256" height="256" fill="none"></rect>
      <line
        x1="208"
        y1="128"
        x2="128"
        y2="208"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      ></line>
      <line
        x1="192"
        y1="40"
        x2="40"
        y2="192"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      ></line>
    </svg>
  ),
  spinner: ({ className, ...props }: IconProps) => (
    <Loader2
      className={cn(IconsVariants({}), "animate-spin", className)}
      {...props}
    />
  ),
  shoppingBag: ({ className, ...props }: IconProps) => (
    <ShoppingBag className={cn(IconsVariants({}), className)} {...props} />
  ),
  shoppingBasket: ({ className, ...props }: IconProps) => (
    <ShoppingBasket className={cn(IconsVariants({}), className)} {...props} />
  ),
  heart: ({ className, ...props }: IconProps) => (
    <Heart className={cn(IconsVariants({}), className)} {...props} />
  ),
  dot: ({ className, ...props }: IconProps) => (
    <svg
      className={cn(
        IconsVariants({}),
        "size-2.5 rounded-sm bg-primary",
        className
      )}
      {...props}
    />
  ),
  chevronLeft: ({ className, ...props }: IconProps) => (
    <ChevronLeft
      className={cn(IconsVariants({}), "rtl:rotate-180", className)}
      {...props}
    />
  ),
  upload: ({ className, ...props }: IconProps) => (
    <Upload className={cn(IconsVariants({}), className)} {...props} />
  ),
  x: ({ className, ...props }: IconProps) => (
    <X className={cn(IconsVariants({}), className)} {...props} />
  ),
  verified: ({ className, ...props }: IconProps) => (
    <Verified className={cn(IconsVariants({}), className)} {...props} />
  ),
  inbox: ({ className, ...props }: IconProps) => (
    <Inbox className={cn(IconsVariants({}), className)} {...props} />
  ),
  store: ({ className, ...props }: IconProps) => (
    <Store className={cn(IconsVariants({}), className)} {...props} />
  ),
  packagePlus: ({ className, ...props }: IconProps) => (
    <PackagePlus className={cn(IconsVariants({}), className)} {...props} />
  ),
  user: ({ className, ...props }: IconProps) => (
    <User className={cn(IconsVariants({}), className)} {...props} />
  ),
  logout: ({ className, ...props }: IconProps) => (
    <LogOut className={cn(IconsVariants({}), className)} {...props} />
  ),
  settings: ({ className, ...props }: IconProps) => (
    <Settings2 className={cn(IconsVariants({}), className)} {...props} />
  ),
  plus: ({ className, ...props }: IconProps) => (
    <Plus className={cn(IconsVariants({}), className)} {...props} />
  ),
  minus: ({ className, ...props }: IconProps) => (
    <Minus className={cn(IconsVariants({}), className)} {...props} />
  ),
  dashboard: ({ className, ...props }: IconProps) => (
    <LayoutDashboard className={cn(IconsVariants({}), className)} {...props} />
  ),
  eye: ({ className, ...props }: IconProps) => (
    <Eye className={cn(IconsVariants({}), className)} {...props} />
  ),
  eyeOff: ({ className, ...props }: IconProps) => (
    <EyeOff className={cn(IconsVariants({}), className)} {...props} />
  ),
  google: ({ className, ...props }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="16px"
      height="16px"
      className={cn(IconsVariants({}), className)}
      {...props}
    >
      <path
        fill="#fbc02d"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#e53935"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4caf50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1565c0"
        d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  ),
};
