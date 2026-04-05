import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'create-case', label: 'Create Case', icon: 'M12 4v16m8-8H4' },
  { id: 'medical-records', label: 'Medical Records', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'upload-reports', label: 'Upload Reports', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
  { id: 'ai-analysis', label: 'AI Analysis', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636a.5.5 0 01.364.636v2.027a.5.5 0 01-.364.636m0 0a.5.5 0 01-.364-.636v-2.027a.5.5 0 01.364-.636M5.727 5.727a.5.5 0 01.637-.051A7.5 7.5 0 0119 12c0 4.167-3.392 7.5-7.727 7.5a.5.5 0 01-.364-.636' },
  { id: 'ai-indexing', label: 'AI Indexing', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'blockchain', label: 'Blockchain Status', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { id: 'search-case', label: 'Search Case', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { id: 'hash-verification', label: 'Verification', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'logout', label: 'Logout', icon: 'M17 16l4-4m0 0l-4-4m4 4V7' },
];

const roleBasedMenu: Record<string, string[]> = {
  doctor: ['dashboard', 'create-case', 'upload-reports', 'medical-records', 'ai-analysis', 'blockchain', 'profile', 'logout'],
  patient: ['dashboard', 'medical-records', 'profile', 'logout'],
  police: ['dashboard', 'search-case', 'ai-indexing', 'hash-verification', 'profile', 'logout'],
  judiciary: ['dashboard', 'forwarded-cases', 'verification', 'profile', 'logout'],
  admin: ['dashboard', 'medical-records', 'blockchain', 'profile', 'logout'],
};

const roleLabels: Record<string, string> = {
  doctor: 'Doctor Panel',
  patient: 'Patient Portal',
  police: 'Police Portal',
  judiciary: 'Judiciary Panel',
  admin: 'Admin Panel',
};

const roleColors: Record<string, string> = {
  doctor: 'from-teal-500 to-cyan-500',
  patient: 'from-green-500 to-emerald-500',
  police: 'from-blue-500 to-indigo-500',
  judiciary: 'from-purple-500 to-violet-500',
  admin: 'from-rose-500 to-orange-500',
};

const Sidebar = ({ activeTab, setActiveTab, onLogout }: SidebarProps) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const role = user?.role || 'patient';
  const filteredMenu = roleBasedMenu[role] || menuItems.map(item => item.id);
  const roleGradient = roleColors[role];

  const handleMenuClick = (itemId: string) => {
    if (itemId === 'logout') {
      onLogout();
    } else {
      setActiveTab(itemId);
    }
  };

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="h-full gradient-dark-teal rounded-r-2xl shadow-2xl flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-white font-bold text-sm leading-tight">Medico-Legal</h1>
                <p className="text-white/60 text-xs">AI + Blockchain</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* User Info Section */}
        <div className="px-4 py-3">
          <motion.div 
            className={`bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleGradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
              <span className="text-white font-semibold">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="min-w-0"
              >
                <p className="text-white text-sm font-medium truncate">{user?.fullName || 'User'}</p>
                <p className="text-white/60 text-xs capitalize">{user?.role}</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-thin">
          <AnimatePresence>
            {filteredMenu.map((itemId, index) => {
              const menuItem = menuItems.find(m => m.id === itemId);
              if (!menuItem) return null;

              const isActive = activeTab === itemId;

              return (
                <motion.button
                  key={itemId}
                  onClick={() => handleMenuClick(itemId)}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-all duration-200 relative group ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuItem.icon} />
                  </svg>
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{menuItem.label}</span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 w-1 h-8 bg-white/80 rounded-r-full"
                    />
                  )}
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-[#1F2D3D] text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                      {menuItem.label}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </nav>

        {/* Collapse Button */}
        <div className="px-3 pb-4">
          <motion.button
            onClick={() => setIsCollapsed(!isCollapsed)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <motion.span
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.span>
            {!isCollapsed && <span className="text-sm">Collapse</span>}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;