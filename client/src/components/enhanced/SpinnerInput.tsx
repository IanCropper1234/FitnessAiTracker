import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

interface SpinnerInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SpinnerInput: React.FC<SpinnerInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 1000,
  step = 1,
  placeholder = "0",
  disabled = false,
  className = "",
}) => {
  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(e.target.value) || 0;
    const clampedValue = Math.max(min, Math.min(max, inputValue));
    onChange(clampedValue);
  };

  return (
    <div className={`flex items-center ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className="h-10 w-6 p-0 border-r-0 rounded-r-none bg-background border-border text-foreground hover:bg-accent"
      >
        <Minus className="h-3 w-3" />
      </Button>
      
      <Input
        type="number"
        value={value || ''}
        onChange={handleInputChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="h-10 w-16 border-x-0 rounded-none text-center bg-background border-border text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        inputMode={step < 1 ? "decimal" : "numeric"}
      />
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className="h-10 w-6 p-0 border-l-0 rounded-l-none bg-background border-border text-foreground hover:bg-accent"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
};