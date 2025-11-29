import React from 'react';

import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorMessageProps {
  message: string;
  variant?: 'inline' | 'alert';
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  variant = 'inline',
  className = '',
}) => {
  if (variant === 'alert') {
    return (
      <Alert variant='destructive' className={className}>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <p className={`text-sm text-destructive mt-1 ${className}`}>{message}</p>
  );
};

export default ErrorMessage;
