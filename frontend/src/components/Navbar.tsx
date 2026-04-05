import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../App';

interface NavbarProps {
  title: string;
  subtitle?: string;
  showNotifications?: boolean;
}

const roleColors: Record<string, string> = {
  doctor: 'from-[#2E8B8B] to-[#4F9DA6]',
  patient: 'from-[#4F9DA6] to-[#2E8B8B]',
  police: 'from-blue-500 to-indigo-600',
  judiciary: 'from-purple-500 to-purple-600',
  admin: 'from-rose-500 to-orange-500',
};

const roleIcons: Record<string, string> = {
  doctor: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  patient: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  police: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  judiciary: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2M6 7l6 2M4 7h.01M8 7h.01M12 7h.01M16 7h.01M20 7h.01M4 11h16M4 11h.01M8 11h.01M12 11h.01M16 11h.01M20 11h.01',
  admin: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
};

const Navbar = ({ title, subtitle, showNotifications = true }: NavbarProps) => {
  const { user } = useAuth();
  const role = user?.role || 'patient';
  const gradient = roleColors[role];
  const [notificationDropdown, setNotificationDropdown] = useState(false);

  const notifications = [
    { id: 1, message: 'New case assigned to you', time: '2 mins ago', read: false, type: 'case' },
    { id: 2, message: 'AI indexing completed', time: '1 hour ago', read: false, type: 'ai' },
    { id: 3, message: 'Blockchain verification successful', time: '3 hours ago', read: true, type: 'blockchain' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'case': return '📋';
      case 'ai': return '🤖';
      case 'blockchain': return '🔗';
      default: return '🔔';
    }
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass-card p-4 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={roleIcons[role]} />
            </svg>
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-bold text-[#1F2D3D]"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-[#64748B]"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showNotifications && (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setNotificationDropdown(!notificationDropdown)}
                className="relative p-2.5 rounded-xl bg-[#F5F9FA] hover:bg-[#E8F4F4] transition-shadow border border-gray-100"
              >
                <svg className="w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.352 2.352 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </motion.button>

              {notificationDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-14 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 bg-[#F5F9FA]">
                    <h3 className="font-semibold text-[#1F2D3D]">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-gray-50 hover:bg-[#F5F9FA] cursor-pointer transition-colors ${!notif.read ? 'bg-[#2E8B8B]/5' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#1F2D3D]">{notif.message}</p>
                            <p className="text-xs text-[#64748B] mt-1">{notif.time}</p>
                          </div>
                          {!notif.read && (
                            <span className="w-2 h-2 bg-[#2E8B8B] rounded-full flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center border-t border-gray-100 bg-[#F5F9FA]">
                    <button className="text-sm text-[#2E8B8B] hover:text-[#256B6B] font-medium">
                      View All
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* User Profile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 px-4 py-2.5 bg-[#F5F9FA] rounded-xl border border-gray-100"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2E8B8B] to-[#4F9DA6] flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-semibold">
                {user?.fullName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[#1F2D3D]">{user?.fullName}</p>
              <p className="text-xs text-[#64748B] capitalize">{user?.role}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Navbar;