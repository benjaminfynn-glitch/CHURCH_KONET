import React, { useState } from 'react';
import { useMembers } from '../context/MembersContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MemberApprovalRequest } from '../types';
import { formatProperCase } from '../context/MembersContext';

export default function ApprovalManagementPage() {
  const { approvalRequests, approveRequest, rejectRequest } = useMembers();
  const { isAdmin } = useAuth();
  const { addToast } = useToast();

  const [selectedRequest, setSelectedRequest] = useState<MemberApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400">You need admin permissions to access this page.</p>
        </div>
      </div>
    );
  }

  const handleApprove = async (request: MemberApprovalRequest) => {
    try {
      await approveRequest(request.id!);
      addToast('Request approved successfully', 'success');
    } catch (error) {
      console.error('Failed to approve request:', error);
      addToast('Failed to approve request', 'error');
    }
  };

  const handleReject = async (request: MemberApprovalRequest) => {
    if (!rejectionReason.trim()) {
      addToast('Please provide a rejection reason', 'error');
      return;
    }

    try {
      await rejectRequest(request.id!, rejectionReason);
      addToast('Request rejected successfully', 'success');
      setRejectionReason('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to reject request:', error);
      addToast('Failed to reject request', 'error');
    }
  };

  const getActionBadge = (action: string) => {
    const styles = {
      add: 'bg-green-100 text-green-800',
      edit: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[action as keyof typeof styles]}`}>
        {action.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const pendingRequests = approvalRequests.filter(req => req.status === 'pending');
  const approvedRequests = approvalRequests.filter(req => req.status === 'approved');
  const rejectedRequests = approvalRequests.filter(req => req.status === 'rejected');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Approval Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage member approval requests</p>
      </div>

      {/* Pending Requests */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Pending Requests ({pendingRequests.length})
          </h2>
        </div>
        
        {pendingRequests.length === 0 ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">
            No pending requests
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {pendingRequests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {getActionBadge(request.action)}
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Requested by: {request.requestedBy} • {new Date(request.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(request)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                {request.action === 'add' && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">New Member Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="font-medium">Name:</span> {formatProperCase(request.requestedData.fullName || '')}</div>
                      <div><span className="font-medium">Phone:</span> {request.requestedData.phone || ''}</div>
                      <div><span className="font-medium">Gender:</span> {request.requestedData.gender || ''}</div>
                      <div><span className="font-medium">Birthday:</span> {request.requestedData.birthday || ''}</div>
                      <div className="col-span-2"><span className="font-medium">Organization:</span> {formatProperCase(request.requestedData.organization || '')}</div>
                    </div>
                  </div>
                )}

                {request.action === 'edit' && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Member Updates</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {request.requestedData.fullName && (
                        <div><span className="font-medium">Name:</span> {formatProperCase(request.requestedData.fullName)}</div>
                      )}
                      {request.requestedData.phone && (
                        <div><span className="font-medium">Phone:</span> {request.requestedData.phone}</div>
                      )}
                      {request.requestedData.gender && (
                        <div><span className="font-medium">Gender:</span> {request.requestedData.gender}</div>
                      )}
                      {request.requestedData.birthday && (
                        <div><span className="font-medium">Birthday:</span> {request.requestedData.birthday}</div>
                      )}
                      {request.requestedData.organization && (
                        <div className="col-span-2"><span className="font-medium">Organization:</span> {formatProperCase(request.requestedData.organization)}</div>
                      )}
                    </div>
                  </div>
                )}

                {request.action === 'delete' && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Member Removal</h4>
                    <div className="text-sm">
                      <div><span className="font-medium">Member:</span> {formatProperCase(request.requestedData.fullName || '')}</div>
                      {request.deleteReason && (
                        <div className="mt-2"><span className="font-medium">Reason:</span> {request.deleteReason}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Reject {selectedRequest.action} Request
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Please provide a reason for rejecting this {selectedRequest.action} request.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm bg-white dark:bg-slate-700 dark:text-white mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedRequest)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h2>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {approvalRequests.slice(0, 10).map((request) => (
            <div key={request.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getActionBadge(request.action)}
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {request.action} request for {request.memberId ? `member ${request.memberId}` : 'new member'} • 
                    {request.reviewedAt 
                      ? `Reviewed by ${request.reviewedBy} on ${new Date(request.reviewedAt).toLocaleString()}`
                      : `Requested by ${request.requestedBy} on ${new Date(request.requestedAt).toLocaleString()}`
                    }
                  </p>
                  {request.rejectionReason && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Rejected: {request.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}