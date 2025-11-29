import React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InputFieldProps {
  className?: string;
  disabled?: boolean;
  error?: string;
  helpText?: React.ReactNode;
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}

const InputField: React.FC<InputFieldProps> = ({
  className = '',
  disabled = false,
  error,
  helpText,
  label,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  value,
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label
        className={error ? 'font-semibold text-destructive' : 'font-semibold'}
      >
        {label}
        {required && <span className='text-destructive ml-1'>*</span>}
      </Label>
      {helpText && (
        <div className='text-sm text-muted-foreground'>{helpText}</div>
      )}
      <Input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        className={error ? 'border-destructive' : ''}
      />
      {error && <p className='text-sm text-destructive mt-1'>{error}</p>}
    </div>
  );
};

export default InputField;
