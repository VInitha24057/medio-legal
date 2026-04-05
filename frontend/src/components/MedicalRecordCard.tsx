import { motion } from 'framer-motion';

interface MedicalRecordCardProps {
  caseNumber: string;
  title: string;
  caseType: string;
  patientName: string;
  doctorName: string;
  createdAt: string;
  blockchainVerified: boolean;
  onClick?: () => void;
  delay?: number;
}

const MedicalRecordCard = ({
  caseNumber,
  title,
  caseType,
  patientName,
  doctorName,
  createdAt,
  blockchainVerified,
  onClick,
  delay = 0
}: MedicalRecordCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: delay * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-soft-lg transition-all group cursor-pointer border border-transparent hover:border-secondary/20"
    >
      {/* Card Header with gradient */}
      <div className="h-24 bg-gradient-to-br from-primary/10 to-secondary/10 relative">
        <div className="absolute -bottom-8 left-4 w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center">
          <span className="text-3xl">📄</span>
        </div>
        {blockchainVerified && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-accent/20 text-primary text-xs font-medium rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="pt-10 pb-4 px-4">
        <p className="text-xs text-gray-400 mb-1">{caseNumber}</p>
        <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-primary transition-colors line-clamp-1">
          {title}
        </h3>
        
        <div className="space-y-2 mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="truncate">{patientName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center">
              <svg className="w-3 h-3 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
            </span>
            <span className="truncate">{doctorName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </span>
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 pb-4 flex gap-2">
        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-lg">
          {caseType}
        </span>
      </div>
    </motion.div>
  );
};

export default MedicalRecordCard;