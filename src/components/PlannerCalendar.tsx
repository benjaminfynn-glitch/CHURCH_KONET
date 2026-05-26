import React, { useState } from "react";
import { ServicePlan, ServiceType } from "../types";
import { usePlanner } from "../context/PlannerContext";
import { formatChurchDate } from "../utils/churchDate";

interface PlannerCalendarProps {
  onEdit: (plan: ServicePlan) => void;
}

const SERVICE_COLORS: Record<ServiceType, string> = {
  FIRST_DIVINE_SERVICE: "bg-blue-500",
  SECOND_DIVINE_SERVICE: "bg-indigo-500",
  JOINT_DIVINE_SERVICE: "bg-purple-500",
  WEDNESDAY_PRAYER_MEETING: "bg-pink-500",
};

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  FIRST_DIVINE_SERVICE: "First Divine Service (English)",
  SECOND_DIVINE_SERVICE: "Second Divine Service (Fante)",
  JOINT_DIVINE_SERVICE: "Joint Divine Service",
  WEDNESDAY_PRAYER_MEETING: "Wednesday Prayer Meeting",
};

export const PlannerCalendar: React.FC<PlannerCalendarProps> = ({ onEdit }) => {
  const { plans } = usePlanner();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const getDays = () => {
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dayPlans = plans.filter(p => p.serviceDate === dateStr);
      days.push({ date: i, dateStr, plans: dayPlans });
    }
    return days;
  };

  const days = getDays();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const selectedPlans = selectedDate ? plans.filter(p => p.serviceDate === selectedDate) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{months[month]} {year}</h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded">&lt;</button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded">&gt;</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}

        {days.map((day, i) => (
          <div
            key={i}
            className={`min-h-[80px] p-1 border rounded-lg ${day ? "bg-white hover:bg-gray-50 cursor-pointer" : "bg-gray-50"}`}
            onClick={() => day && setSelectedDate(day.dateStr)}
          >
            {day && (
              <>
                <div className="text-right text-sm text-gray-500 mb-1">{day.date}</div>
                <div className="space-y-1">
                  {day.plans.slice(0, 2).map((plan, pi) => (
                    <div
                      key={pi}
                      onClick={(e) => { e.stopPropagation(); onEdit(plan); }}
                      className={`text-xs text-white px-1 py-0.5 rounded truncate ${SERVICE_COLORS[plan.serviceType]}`}
                      title={plan.theme}
                    >
                      {plan.theme.substring(0, 20)}...
                    </div>
                  ))}
                  {day.plans.length > 2 && (
                    <div className="text-xs text-gray-500">+{day.plans.length - 2} more</div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {selectedDate && selectedPlans.length > 0 && (
        <div className="mt-6 bg-white border rounded-lg p-4">
          <h4 className="font-bold mb-3">{formatChurchDate(selectedDate)}</h4>
          <div className="space-y-2">
            {selectedPlans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{plan.theme}</p>
                  <p className="text-sm text-gray-600">{SERVICE_TYPE_LABELS[plan.serviceType]} • {plan.preacherName}</p>
                </div>
                <button
                  onClick={() => onEdit(plan)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};