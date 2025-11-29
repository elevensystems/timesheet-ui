import React from 'react';

import { CardDescription, CardTitle } from '@/components/ui/card';

interface FormHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

const FormHeader: React.FC<FormHeaderProps> = ({
  title,
  description,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </div>
  );
};

export default FormHeader;
