import * as React from "react"

const badgeVariants = {
  default: "inline-flex items-center rounded-full border border-transparent bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-blue-700",
  secondary: "inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800 hover:bg-gray-200",
  destructive: "inline-flex items-center rounded-full border border-transparent bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-red-700",
  outline: "inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700"
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants
}

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <div className={`${badgeVariants[variant]} ${className}`} {...props} />
  )
}

export { Badge }
