import React from 'react';
import { useToast } from '../context/ToastContext';

interface DeleteReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: 'Not a Member' | 'Transferred' | 'Ceased to Fellowship' | 'Deceased') => void;
  memberName?: string;
}

const DeleteReasonModal: React.FC<DeleteReasonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  memberName
}) => {
  const { addToast } = useToast();

  const reasons = [
    { value: 'Not a Member', label: 'Not a Member', color: 'bg-blue-100 text-blue-800' },
    { value: 'Transferred', label: 'Transferred', color: 'bg-green-100 text-green-800' },
    { value: 'Ceased to Fellowship', label: 'Ceased to Fellowship', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Deceased', label: 'Deceased', color: 'bg-red-100 text-red-800' }
  ] as const;

  const handleSubmit = (reason: 'Not a Member' | 'Transferred' | 'Ceased to Fellowship' | 'Deceased') => {
    onSubmit(reason);
    addToast(`Delete request submitted for ${memberName || 'member'}`, 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Select Reason for Removal
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Please select the reason for removing {memberName || 'this member'} from the system.
            This request will be sent to an administrator for approval.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {reasons.map((reason) => (
            <button
              key={reason.value}
              onClick={() => handleSubmit(reason.value)}
              className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                reason.color
              }`}
            >
              <div className="font-medium text-slate-900 dark:text-white">{reason.label}</div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteReasonModal;