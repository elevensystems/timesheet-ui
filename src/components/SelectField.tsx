import React from 'react';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  placeholder = 'Select an option',
  disabled = false,
  required = false,
  className = '',
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label
        className={error ? 'font-semibold text-destructive' : 'font-semibold'}
      >
        {label}
        {required && <span className='text-destructive ml-1'>*</span>}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className='w-full'
          aria-invalid={error ? true : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.icon ? (
                  <div className='flex items-center gap-2'>
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                ) : (
                  option.label
                )}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && <p className='text-sm text-destructive mt-1'>{error}</p>}
    </div>
  );
};

export default SelectField;
