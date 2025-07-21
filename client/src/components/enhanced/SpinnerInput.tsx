import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';

interface SpinnerInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  inputMode?: 'numeric' | 'decimal';
  disabled?: boolean;
}

export const SpinnerInput: React.FC<SpinnerInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  placeholder = "0",
  className = "",
  inputMode = "numeric",
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const numValue = inputMode === 'decimal' ? parseFloat(newValue) : parseInt(newValue);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    } else if (newValue === '') {
      onChange(0);
    }
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleInputBlur = () => {
    const numValue = inputMode === 'decimal' ? parseFloat(inputValue) : parseInt(inputValue);
    if (isNaN(numValue)) {
      setInputValue('0');
      onChange(0);
    } else {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      setInputValue(clampedValue.toString());
      onChange(clampedValue);
    }
  };

  return (
    <div className={`flex items-center border rounded-md ${disabled ? 'opacity-50' : ''} ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className="h-8 w-8 p-0 border-0 rounded-r-none hover:bg-muted"
      >
        <Minus className="h-3 w-3" />
      </Button>
      
      <Input
        type="text"
        inputMode={inputMode}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="border-0 text-center font-semibold rounded-none h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className="h-8 w-8 p-0 border-0 rounded-l-none hover:bg-muted"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
};