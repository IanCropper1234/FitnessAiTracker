import { getSpecialMethodBadgeClasses, getSpecialMethodLabel } from "@/lib/specialMethodUtils";

interface SpecialMethodBadgeProps {
  method: string | null | undefined;
  className?: string;
}

export function SpecialMethodBadge({ method, className = "" }: SpecialMethodBadgeProps) {
  const badgeClasses = getSpecialMethodBadgeClasses(method, className);
  const label = getSpecialMethodLabel(method);

  return (
    <span className="px-2 py-0.5 text-xs font-medium rounded-sm bg-gray-600 text-white pl-[5px] pr-[5px] pt-[0px] pb-[0px] ml-[5px] mr-[5px]">
      {label}
    </span>
  );
}