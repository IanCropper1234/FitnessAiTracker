import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClickableCheckboxProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function ClickableCheckbox({ 
  id, 
  checked, 
  onCheckedChange, 
  children, 
  className 
}: ClickableCheckboxProps) {
  return (
    <div
      id={id}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 select-none min-h-[56px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        checked 
          ? "bg-blue-500 border-blue-500 text-white" 
          : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800",
        className
      )}
      onClick={() => onCheckedChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCheckedChange(!checked);
        }
      }}
    >
      <span className="font-medium text-sm">{children}</span>
      <div className={cn(
        "w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-all duration-200",
        checked 
          ? "bg-white border-white" 
          : "bg-transparent border-gray-400 dark:border-gray-500"
      )}>
        {checked && (
          <Check className="w-4 h-4 text-blue-500" />
        )}
      </div>
    </div>
  );
}