import React from "react";
import { useStaff } from "../context/StaffContext";
import { useExternalPreacher } from "../context/ExternalPreacherContext";
import { usePlanner } from "../context/PlannerContext";
import { formatChurchDate } from "../utils/churchDate";

export default function ReportsPage() {
  const { staff, classificationStats, roleStats } = useStaff();
  const { externalPreachers } = useExternalPreacher();
  const { plans } = usePlanner();

  const internalCount = classificationStats.Internal || 0;
  const externalCount = externalPreachers.length;

  const mostInvitedPreacher = React.useMemo(() => {
    const preacherCounts: Record<string, { name: string; count: number; society?: string; isExternal: boolean }> = {};
    
    externalPreachers.forEach(p => {
      preacherCounts[p.id!] = { name: p.fullName, count: 0, society: p.society, isExternal: true };
    });
    
    staff.filter(s => s.roles.includes("Preacher")).forEach(p => {
      preacherCounts[p.id!] = preacherCounts[p.id!] || { name: p.fullName, count: 0, isExternal: false };
    });

    plans.forEach(plan => {
      if (plan.preacherId) {
        const preacher = staff.find(s => s.id === plan.preacherId);
        const externalPreacher = externalPreachers.find(e => e.id === plan.preacherId);
        
        if (preacher) {
          preacherCounts[preacher.id].count += 1;
        } else if (externalPreacher) {
          preacherCounts[externalPreacher.id].count += 1;
        }
      }
    });

    let maxCount = 0;
    let mostInvited = null;
    for (const key in preacherCounts) {
      if (preacherCounts[key].count > maxCount) {
        maxCount = preacherCounts[key].count;
        mostInvited = preacherCounts[key];
      }
    }
    return mostInvited;
  }, [staff, externalPreachers, plans]);

  const upcomingExternalPreachers = React.useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return plans.filter(p => p.serviceDate >= today && p.preacherId && externalPreachers.some(e => e.id === p.preacherId));
  }, [plans, externalPreachers]);

  const statsCards = [
    { label: "Total Internal Preachers", value: internalCount, color: "blue" },
    { label: "Total External Preachers", value: externalCount, color: "orange" },
    { label: "Total Bible Readers", value: roleStats["Bible Reader"] || 0, color: "green" },
    { label: "Total MCs", value: roleStats.MC || 0, color: "pink" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-800">Reports & Analytics</h1>
        <p className="text-blue-600 mt-1">View preaching assignments and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, idx) => (
          <div key={idx} className={`bg-${stat.color}-50 rounded-lg p-4 text-center`}>
            <p className={`text-3xl font-bold text-${stat.color}-800`}>{stat.value}</p>
            <p className={`text-sm text-${stat.color}-600`}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Most Invited Guest Preacher</h2>
          {mostInvitedPreacher ? (
            <div className="text-center py-4">
              <p className="text-2xl font-bold text-gray-800">{mostInvitedPreacher.name}</p>
              {mostInvitedPreacher.society && (
                <p className="text-gray-600 mt-1">{mostInvitedPreacher.society}</p>
              )}
              <p className="text-blue-700 font-medium mt-2">{mostInvitedPreacher.count} times invited</p>
              <p className={`text-xs mt-1 ${mostInvitedPreacher.isExternal ? 'text-pink-600' : 'text-blue-600'}`}>
                {mostInvitedPreacher.isExternal ? 'External Preacher' : 'Internal Preacher'}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No invitation data yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Upcoming Guest Preacher Schedules</h2>
          {upcomingExternalPreachers.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {upcomingExternalPreachers.slice(0, 5).map((plan, idx) => (
                <div key={idx} className="border-l-2 border-blue-500 pl-3 py-2">
                  <p className="font-medium">{formatChurchDate(plan.serviceDate)}</p>
                  <p className="text-sm text-gray-600">{plan.theme}</p>
                  <p className="text-xs text-gray-500">{plan.serviceType.replace(/_/g, " ")}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming schedules</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Yearly Preaching Appointments</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Service</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Theme</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Preacher</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {plans.slice(-10).reverse().map((plan) => {
                const preacher = staff.find(s => s.id === plan.preacherId) || externalPreachers.find(e => e.id === plan.preacherId);
                return (
                  <tr key={plan.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{formatChurchDate(plan.serviceDate)}</td>
                    <td className="p-3 text-sm">{plan.serviceType.replace(/_/g, " ")}</td>
                    <td className="p-3 text-sm font-medium">{plan.theme}</td>
                    <td className="p-3 text-sm">{preacher?.fullName || "-"}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        plan.status === "upcoming" ? "bg-blue-100 text-blue-800" :
                        plan.status === "completed" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {plan.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}