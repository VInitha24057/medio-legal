import { memo } from 'react';
import { motion } from 'framer-motion';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'primary' | 'teal' | 'accent' | 'purple' | 'red';
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

const colorClasses = {
  primary: {
    bg: 'bg-[#2E8B8B]/10',
    icon: 'from-[#2E8B8B] to-[#4F9DA6]',
    text: 'text-[#2E8B8B]',
    gradient: 'from-[#2E8B8B]/20 to-[#2E8B8B]/5',
  },
  teal: {
    bg: 'bg-[#4F9DA6]/10',
    icon: 'from-[#4F9DA6] to-[#A6DADC]',
    text: 'text-[#4F9DA6]',
    gradient: 'from-[#4F9DA6]/20 to-[#4F9DA6]/5',
  },
  accent: {
    bg: 'bg-[#A6DADC]/20',
    icon: 'from-[#A6DADC] to-[#4F9DA6]',
    text: 'text-[#4F9DA6]',
    gradient: 'from-[#A6DADC]/20 to-[#A6DADC]/5',
  },
  purple: {
    bg: 'bg-purple-100',
    icon: 'from-purple-500 to-purple-600',
    text: 'text-purple-600',
    gradient: 'from-purple-100 to-purple-50',
  },
  red: {
    bg: 'bg-red-100',
    icon: 'from-red-500 to-red-600',
    text: 'text-red-600',
    gradient: 'from-red-100 to-red-50',
  },
};

const iconPaths: Record<string, string> = {
  '👥': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 19H8m15 0v2a3 3 0 01-3 3H8m15-6a7 7 0 11-14 0 7 7 0 0114 0z',
  '📋': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  '✓': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  '⏳': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  '🤖': 'M9.663 17h4.673M12 3v1m0 0v8a4 4 0 01-4 4H4m16-4a4 4 0 01-4-4V3m8 7h4m-4 0a1 1 0 00-1 1v2a1 1 0 001 1m0-4h4m-4 0V5a1 1 0 011-1h2',
  '📊': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  '🔗': 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
};

const DashboardCard = memo(({
  title,
  value,
  icon,
  color,
  description,
  trend,
  delay = 0
}: DashboardCardProps) => {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: delay * 0.1, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card-hover p-6"
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.icon} shadow-lg`}>
          {iconPaths[icon] ? (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths[icon]} />
            </svg>
          ) : (
            <span className="text-2xl">{icon}</span>
          )}
        </div>
        {trend && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay * 0.1 + 0.3 }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: delay * 0.1 + 0.2 }}
        className="mt-4"
      >
        <h3 className="text-sm font-medium text-[#64748B]">{title}</h3>
        <p className="text-3xl font-bold text-[#1F2D3D] mt-1">{value}</p>
        {description && (
          <p className="text-xs text-[#94A3B8] mt-2">{description}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay * 0.1 + 0.4, duration: 0.5 }}
        className={`mt-4 h-1.5 rounded-full bg-gradient-to-r ${colors.icon}`}
      />
    </motion.div>
  );
});

export default DashboardCard;