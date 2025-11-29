import React from 'react';

interface FormFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

const FormFooter: React.FC<FormFooterProps> = ({
  children,
  className = '',
  align = 'between',
}) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={`flex items-center gap-2 ${alignmentClasses[align]} ${className}`}
    >
      {children}
    </div>
  );
};

export default FormFooter;
