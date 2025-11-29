import React from 'react';

interface ProgressBarProps {
  progress: number;
  processed: number;
  total: number;
  failed?: number;
  status?: 'in-progress' | 'completed' | 'failed';
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  processed,
  total,
  failed = 0,
  status = 'in-progress',
  className = '',
}) => {
  return (
    <div
      className={`bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3 ${className}`}
    >
      <div className='flex items-center justify-between'>
        <h3 className='font-semibold text-blue-900 dark:text-blue-100'>
          Processing Timesheets
        </h3>
        <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>
          {progress}%
        </span>
      </div>
      <div className='w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5'>
        <div
          className='bg-blue-600 dark:bg-blue-400 h-2.5 rounded-full transition-all duration-300'
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className='flex justify-between text-sm text-blue-700 dark:text-blue-300'>
        <span>
          Processed: {processed} / {total}
        </span>
        {failed > 0 && (
          <span className='text-red-600 dark:text-red-400 font-medium'>
            Failed: {failed}
          </span>
        )}
      </div>
      <p className='text-sm text-blue-600 dark:text-blue-400'>
        Please wait while we submit your timesheets. This may take a few
        moments...
      </p>
    </div>
  );
};

export default ProgressBar;
