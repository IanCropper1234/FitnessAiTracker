import { getSpecialMethodBadgeClasses, getSpecialMethodLabel } from "@/lib/specialMethodUtils";

interface SpecialMethodBadgeProps {
  method: string | null | undefined;
  className?: string;
}

export function SpecialMethodBadge({ method, className = "" }: SpecialMethodBadgeProps) {
  const badgeClasses = getSpecialMethodBadgeClasses(method, className);
  const label = getSpecialMethodLabel(method);

  return (
    <span className={badgeClasses}>
      {label}
    </span>
  );
}