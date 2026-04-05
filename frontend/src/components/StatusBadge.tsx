import { memo } from 'react';
import { motion } from 'framer-motion';

interface StatusBadgeProps {
  status: 'verified' | 'pending' | 'rejected' | 'active' | 'inactive' | 'approved' | 'processing' | 'forwarded';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  verified: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: 'M5 13l4 4L19 7',
    label: 'Verified',
  },
  pending: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    label: 'Pending',
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: 'M6 18L18 6M6 6l12 12',
    label: 'Rejected',
  },
  active: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: 'M5 13l4 4L19 7',
    label: 'Active',
  },
  inactive: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    label: 'Inactive',
  },
  approved: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    label: 'Approved',
  },
  processing: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'M4 4v5h.582m15.313 0a9 9 0 11-18 0 9 9 0 0118 0zm0 0h.582M7 16l4-4m0 0l4 4m-4-4v8',
    label: 'Processing',
  },
  forwarded: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: 'M13 7l4 4m0 0l-4 4m4-4l-4-4m4 4l4-4',
    label: 'Forwarded',
  },
};

const sizeClasses = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

const StatusBadge = memo(({ status, showIcon = true, size = 'md' }: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      {showIcon && (
        <motion.svg
          className="w-3.5 h-3.5"
          animate={status === 'processing' ? { rotate: 360 } : {}}
          transition={status === 'processing' ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
        </motion.svg>
      )}
      {config.label}
    </motion.span>
  );
});

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;