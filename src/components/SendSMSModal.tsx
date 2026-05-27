import React, { useState, useEffect } from "react";
import { ServicePlan, ServiceType } from "../types";
import { useToast } from "../context/ToastContext";
import { sendBroadcast, checkHealth } from "../services/api";
import { formatChurchDate } from "../utils/churchDate";

interface SendSMSModalProps {
  plan: ServicePlan;
  onClose: () => void;
}

const CHURCH_NAME = "Bethel Society, Efutu";
const SERVICE_TEMPLATES: Record<ServiceType, {
  preacher: string;
  liturgist: string;
  firstBibleReader: string;
  secondBibleReader: string;
  mc?: string;
}> = {
  FIRST_DIVINE_SERVICE: {
    preacher: `Dear {preacherName}
This is a reminder that you have a Preaching appointment for the First Divine Service at ${CHURCH_NAME}, on {serviceDate}.

Theme: {theme}

Scripture References:
1st Reading: {firstReading}
2nd Reading: {secondReading}
3rd Reading: {thirdReading}

Service Time: 7:00 AM

Kindly confirm your coming to the stewards as soon as possible.
(0243650040/0242645258)

Bethel, Nyame wa ha`,
    liturgist: `Dear {liturgistName}
This is a reminder that you have a Liturgy & bible reading appointment on {serviceDate}, for the First Divine Service at ${CHURCH_NAME}.

You are also the Third Bible reader.

Scripture Ref:
{thirdReading}

Service Time: 7:00 AM

Bethel, Nyame wa ha`,
    firstBibleReader: `Dear {firstReaderName}
This is a reminder that you have a bible reading appointment for the First Divine Service at ${CHURCH_NAME}, on {serviceDate}.

You are the First Bible Reader

Scripture Reference:
{firstReading}

Service Time: 7:00 AM

Bethel, Nyame wa ha`,
    secondBibleReader: `Dear {secondReaderName}
This is a reminder that you have a bible reading appointment for the First Divine Service at ${CHURCH_NAME}, on {serviceDate}.

You are the Second Bible Reader

Scripture Reference:
{secondReading}

Service Time: 7:00 AM

Bethel, Nyame wa ha`,
  },
  SECOND_DIVINE_SERVICE: {
    preacher: `Dear {preacherName}
This is a reminder that you have a Preaching appointment for the Second Divine Service at ${CHURCH_NAME}, on {serviceDate}.

Theme: {theme}

Scripture References:
1st Reading: {firstReading}
2nd Reading: {secondReading}
3rd Reading: {thirdReading}

Service Time: 9:00 AM

Kindly confirm your coming to the stewards as soon as possible.
(0243650040/0242645258)

Bethel, Nyame wa ha`,
    liturgist: `Dear {liturgistName}
This is a reminder that you have a Liturgy & bible reading appointment on {serviceDate}, for the Second Divine Service at ${CHURCH_NAME}.

You are also the Third Bible reader.

Scripture Ref:
{thirdReading}

Service Time: 9:00 AM

Bethel, Nyame wa ha`,
    firstBibleReader: `Dear {firstReaderName}
This is a reminder that you have a bible reading appointment for the Second Divine Service at ${CHURCH_NAME}, on {serviceDate}.

You are the First Bible Reader

Scripture Reference:
{firstReading}

Service Time: 9:00 AM

Bethel, Nyame wa ha`,
    secondBibleReader: `Dear {secondReaderName}
This is a reminder that you have a bible reading appointment for the Second Divine Service at ${CHURCH_NAME}, on {serviceDate}.

You are the Second Bible Reader

Scripture Reference:
{secondReading}

Service Time: 9:00 AM

Bethel, Nyame wa ha`,
  },
  JOINT_DIVINE_SERVICE: {
    preacher: `Dear {preacherName}
This is a reminder that you have a Preaching appointment for the Joint Divine Service at ${CHURCH_NAME}, on {serviceDate}.

Theme: {theme}

Scripture References:
1st Reading: {firstReading}
2nd Reading: {secondReading}
3rd Reading: {thirdReading}

Service Time: 9:00 AM

Kindly confirm your coming to the stewards as soon as possible.
(0243650040/0242645258)

Bethel, Nyame wa ha`,
    liturgist: `Dear {liturgistName}
This is a reminder that you have a Liturgy & bible reading appointment on {serviceDate}, for the Joint Divine Service at ${CHURCH_NAME}.

You are also the Third Bible reader.

Scripture Ref:
{thirdReading}

Service Time: 9:00 AM

Bethel, Nyame wa ha`,
    firstBibleReader: `Dear {firstReaderName}
This is a reminder that you have a bible reading appointment for the Joint Divine Service at ${CHURCH_NAME}, on {serviceDate}.

You are the First Bible Reader

Scripture Reference:
{firstReading}

Service Time: 9:00 AM

Bethel, Nyame wa ha`,
    secondBibleReader: `Dear {secondReaderName}
This is a reminder that you have a bible reading appointment for the Joint Divine Service at ${CHURCH_NAME}, on {serviceDate}.

You are the Second Bible Reader

Scripture Reference:
{secondReading}

Service Time: 9:00 AM

Bethel, Nyame wa ha`,
  },
  WEDNESDAY_PRAYER_MEETING: {
    preacher: `Dear {preacherName}

This is a reminder that you have been scheduled as Preacher to lead the Wednesday Prayer Meeting at ${CHURCH_NAME}, on {serviceDate}.

Service Time: 7:00 PM

Bethel, Nyame wa ha`,
    liturgist: "",
    firstBibleReader: "",
    secondBibleReader: "",
    mc: `Dear {mcName}

This is a reminder that you have been scheduled as MC to lead the Wednesday Prayer Meeting at ${CHURCH_NAME}, on {serviceDate}.

Service Time: 7:00 PM

Bethel, Nyame wa ha`,
  },
};

interface Recipient {
  phone: string;
  name: string;
  role: string;
  message: string;
}

interface MessageStatus {
  phone: string;
  name: string;
  role: string;
  status: "pending" | "sending" | "success" | "failed";
  error?: string;
}

function normalizePhone(phone: string): string {
  if (!phone) return "";
  let normalized = phone.trim().replace(/[\s\-\(\)]/g, "");
  if (normalized.startsWith("0")) {
    normalized = "233" + normalized.substring(1);
  } else if (!normalized.startsWith("233")) {
    normalized = "233" + normalized;
  }
  return normalized;
}

export const SendSMSModal: React.FC<SendSMSModalProps> = ({ plan, onClose }) => {
  const { addToast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [messageStatuses, setMessageStatuses] = useState<MessageStatus[]>([]);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    setServerStatus('checking');
    try {
      const result = await checkHealth();
      console.log('Health check result:', result);
      const status = result?.status?.toLowerCase();
      if (status === 'online') {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error: any) {
      console.error('Health check failed:', error);
      setServerStatus('offline');
    }
  };

  const getScriptureRefs = () => {
    const readers = plan.bibleReaders || [];
    return {
      firstReading: readers[0]?.scriptureReference || "Not assigned",
      secondReading: readers[1]?.scriptureReference || "Not assigned",
      thirdReading: readers[2]?.scriptureReference || "Not assigned",
    };
  };

  const getRecipients = (): Recipient[] => {
    const recipients: Recipient[] = [];
    const templates = SERVICE_TEMPLATES[plan.serviceType];
    const refs = getScriptureRefs();
    const formattedDate = formatChurchDate(plan.serviceDate);
    const commonVars = {
      serviceDate: formattedDate,
      theme: plan.theme,
      firstReading: refs.firstReading,
      secondReading: refs.secondReading,
      thirdReading: refs.thirdReading,
    };

    if (plan.preacherContact && plan.preacherName) {
      const message = templates.preacher
        .replace("{preacherName}", plan.preacherName)
        .replace("{serviceDate}", commonVars.serviceDate)
        .replace("{theme}", commonVars.theme)
        .replace("{firstReading}", commonVars.firstReading)
        .replace("{secondReading}", commonVars.secondReading)
        .replace("{thirdReading}", commonVars.thirdReading);
      recipients.push({
        phone: plan.preacherContact,
        name: plan.preacherName,
        role: "Preacher",
        message,
      });
    }

    if (plan.liturgistContact && plan.liturgistName) {
      const message = templates.liturgist
        .replace("{liturgistName}", plan.liturgistName)
        .replace("{serviceDate}", commonVars.serviceDate)
        .replace("{thirdReading}", commonVars.thirdReading);
      recipients.push({
        phone: plan.liturgistContact,
        name: plan.liturgistName,
        role: "Liturgist",
        message,
      });
    }

    const firstReader = plan.bibleReaders?.[0];
    if (firstReader?.contact && firstReader?.name) {
      const message = templates.firstBibleReader
        .replace("{firstReaderName}", firstReader.name)
        .replace("{serviceDate}", commonVars.serviceDate)
        .replace("{firstReading}", commonVars.firstReading);
      recipients.push({
        phone: firstReader.contact,
        name: firstReader.name,
        role: "First Bible Reader",
        message,
      });
    }

    const secondReader = plan.bibleReaders?.[1];
    if (secondReader?.contact && secondReader?.name) {
      const message = templates.secondBibleReader
        .replace("{secondReaderName}", secondReader.name)
        .replace("{serviceDate}", commonVars.serviceDate)
        .replace("{secondReading}", commonVars.secondReading);
      recipients.push({
        phone: secondReader.contact,
        name: secondReader.name,
        role: "Second Bible Reader",
        message,
      });
    }

if (plan.standbyPreacherContact && plan.standbyPreacherName && plan.serviceType !== "WEDNESDAY_PRAYER_MEETING") {
      recipients.push({
        phone: plan.standbyPreacherContact,
        name: plan.standbyPreacherName,
        role: "Standby Preacher",
        message: `Dear ${plan.standbyPreacherName}
This is a reminder that you are on standby for the ${formattedDate} service at ${CHURCH_NAME}.

Service: ${plan.theme}
Service Time: ${plan.serviceType === "FIRST_DIVINE_SERVICE" ? "7:00 AM" : plan.serviceType === "SECOND_DIVINE_SERVICE" ? "9:00 AM" : plan.serviceType === "JOINT_DIVINE_SERVICE" ? "9:00 AM" : "6:00 PM"}

Please be ready to step in if needed.

Bethel, Nyame wa ha`,
      });
    }

    if (plan.serviceType === "WEDNESDAY_PRAYER_MEETING" && plan.mcContact && plan.mcName) {
      const mcTemplate = templates.mc || "";
      const message = mcTemplate
        .replace("{mcName}", plan.mcName)
        .replace("{serviceDate}", formattedDate);
      recipients.push({
        phone: plan.mcContact,
        name: plan.mcName,
        role: "MC",
        message,
      });
    }

    return recipients;
  };

  const getErrorMessage = (error: any): string => {
    const message = error?.message || "Unknown error";
    if (message.includes("rejected") || message.includes("handshake")) {
      return "SMS provider rejected the message";
    }
    if (message.includes("not configured")) {
      return "SMS service is not configured. Please contact support.";
    }
    return message;
  };

  const handleSendIndividual = async (recipient: Recipient) => {
    const phone = normalizePhone(recipient.phone);

    setMessageStatuses(prev => [...prev.filter(s => s.phone !== phone), {
      phone,
      name: recipient.name,
      role: recipient.role,
      status: "sending",
    }]);

    try {
      const result = await sendBroadcast({
        text: recipient.message,
        type: 0,
        sender: "BETHELKONET",
        destinations: [phone],
      });

      const isDelivered = result?.delivery === true || result?.success === true;
      const deliveryStatus = isDelivered ? "success" : "success";

      setMessageStatuses(prev => [...prev.filter(s => s.phone !== phone), {
        phone,
        name: recipient.name,
        role: recipient.role,
        status: deliveryStatus,
      }]);

      addToast(`SMS sent successfully to ${recipient.name}`, "success");
    } catch (error: any) {
      let errorMsg = getErrorMessage(error);
      
      if (errorMsg.includes('fetch') || errorMsg.includes('connect') || errorMsg.includes('Network')) {
        errorMsg = "SMS server is offline. Please try again later or contact support.";
      }

      setMessageStatuses(prev => [...prev.filter(s => s.phone !== phone), {
        phone,
        name: recipient.name,
        role: recipient.role,
        status: "failed",
        error: errorMsg,
      }]);

      addToast(`Failed to send SMS to ${recipient.name}: ${errorMsg}`, "error");
    }
  };

  const handleSendAll = async () => {
    const recipients = getRecipients().filter(r => r.phone);
    if (recipients.length === 0) {
      addToast("No valid contacts to send SMS to", "error");
      return;
    }

    if (serverStatus !== 'online') {
      addToast("SMS server is offline. Please try again later.", "error");
      return;
    }

    setIsSending(true);
    setMessageStatuses(recipients.map(r => ({
      phone: normalizePhone(r.phone),
      name: r.name,
      role: r.role,
      status: "pending" as const,
    })));

    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      try {
        const phone = normalizePhone(recipient.phone);
        await sendBroadcast({
          text: recipient.message,
          type: 0,
          sender: "BETHELKONET",
          destinations: [phone],
        });
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    setIsSending(false);

    if (failCount === 0) {
      addToast(`All SMS notifications sent successfully and delivered to ${successCount} recipient(s)`, "success");
    } else {
      addToast(`Sent ${successCount} SMS successfully. Failed to send ${failCount} notification(s).`, "warning");
    }
  };

  const recipients = getRecipients();
  const validRecipients = recipients.filter(r => r.phone);

  if (validRecipients.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Send SMS Notifications</h3>
          <p className="text-gray-500 mb-4">No contacts available to send SMS to this service plan.</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold">Send SMS Notifications</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

<div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-700">Recipients ({validRecipients.length})</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  serverStatus === 'online' ? 'bg-green-100 text-green-800' : 
                  serverStatus === 'offline' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {serverStatus === 'checking' ? 'Checking...' : 
                   serverStatus === 'online' ? 'SMS Server Online' : 'SMS Server Offline'}
                </span>
              </div>
              <button
                onClick={handleSendAll}
                disabled={isSending || validRecipients.length === 0}
                className="px-3 py-1.5 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 disabled:opacity-50"
              >
                {isSending ? "Sending..." : "Send All"}
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {validRecipients.map((recipient, idx) => {
                const status = messageStatuses.find(s => s.phone === normalizePhone(recipient.phone));

                return (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{recipient.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          recipient.role === "Preacher" ? "bg-blue-100 text-blue-800" :
                          recipient.role === "Liturgist" ? "bg-purple-100 text-purple-800" :
                          recipient.role === "First Bible Reader" ? "bg-green-100 text-green-800" :
                          recipient.role === "Second Bible Reader" ? "bg-teal-100 text-teal-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {recipient.role}
                        </span>
                      </div>
                      <button
                        onClick={() => handleSendIndividual(recipient)}
                        disabled={status?.status === "sending"}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        {status?.status === "sending" ? "Sending..." : "Send"}
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mb-1">Phone: {recipient.phone}</p>

                    <div className="bg-gray-50 rounded p-2 text-xs max-h-40 overflow-y-auto">
                      <p className="font-medium text-gray-600 mb-1">Message Preview:</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{recipient.message}</p>
                    </div>

                    {status?.status === "success" && (
                      <p className="text-xs text-green-600 mt-1">✓ Sent successfully</p>
                    )}
                    {status?.status === "failed" && (
                      <p className="text-xs text-red-600 mt-1">✗ Failed: {status.error}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};