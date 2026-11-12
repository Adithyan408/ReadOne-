import { useState } from "react";
import {
  Bell,
  Clock,
  Sparkles,
  ShieldAlert,
  Inbox,
  Filter,
} from "lucide-react";

export default function AdminNotifications() {
  const [activeTab, setActiveTab] = useState<"all" | "system" | "reports" | "activity">("all");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Notifications Center
            </h1>
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              Upcoming
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            System announcements, user feedback, moderation alerts, and platform events.
          </p>
        </div>
      </div>

      {/* Tabs Filter */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
            <span className="text-xs font-semibold text-gray-400 mr-1 sm:mr-2 flex items-center gap-1">
              <Filter size={13} /> Category:
            </span>
            {(
              [
                { id: "all", label: "All Alerts" },
                { id: "system", label: "System Notices" },
                { id: "reports", label: "User Reports" },
                { id: "activity", label: "Activity Logs" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Hero Placeholder Card */}
            <div className="rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-5 sm:p-12 shadow-sm text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 mb-6 shadow-xs border border-indigo-100">
                <Bell size={36} className="animate-pulse" />
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200/80 mb-3">
                <Clock size={13} />
                Content will be added later
              </span>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Notification Center Under Construction
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 leading-relaxed">
                  The notification and alert dispatch pipeline is currently in preparation.
                  Platform alerts, automated flag queues, and author activity feeds will be configured here.
                </p>

                {/* Feature Preview Cards */}
                  <div className="mt-6 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 mb-3">
                        <ShieldAlert size={20} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">Content Moderation</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Instant alerts for flagged comments, reported articles, and community guidelines violations.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 mb-3">
                        <Sparkles size={20} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">System Broadcasts</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Send global platform banners, maintenance windows, and feature releases directly to readers.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mb-3">
                        <Inbox size={20} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">User Activity Stream</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Track new user signups, author verification milestones, and engagement spikes in real-time.
                      </p>
                    </div>
                  </div>
                </div>
            </div>
            );
}

