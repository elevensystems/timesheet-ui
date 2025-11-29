import React from 'react';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  className?: string;
  textareaClassName?: string;
  helpText?: React.ReactNode;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  required = false,
  rows = 4,
  className = '',
  textareaClassName = '',
  helpText,
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
      <Textarea
        className={`resize-y ${textareaClassName}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        aria-invalid={error ? true : undefined}
      />
      {error && <p className='text-sm text-destructive mt-1'>{error}</p>}
    </div>
  );
};

export default TextAreaField;
