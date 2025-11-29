import React from 'react';

import { CheckCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface SubmitButtonProps {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  type?: 'submit' | 'button' | 'reset';
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  icon?: React.ReactNode;
  className?: string;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  label = 'Submit',
  onClick,
  disabled = false,
  isLoading = false,
  type = 'submit',
  variant = 'default',
  icon,
  className = '',
}) => {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      variant={variant}
      className={className}
    >
      {isLoading ? (
        <>
          <Spinner />
          Processing...
        </>
      ) : (
        <>
          {label}
          {icon || <CheckCheck />}
        </>
      )}
    </Button>
  );
};

export default SubmitButton;
