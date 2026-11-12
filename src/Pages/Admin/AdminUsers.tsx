import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAdminUsers,
  setUserStatus,
  type AdminUser,
} from "../../services/adminService";
import {
  Users,
  Search,
  CheckCircle2,
  Ban,
  RefreshCw,
  BookOpen,
  Filter,
  UserCheck,
  UserX,
} from "lucide-react";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">(
    "all"
  );
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchAdminUsers()
      .then((data) => {
        if (isMounted) {
          setUsers(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenUser = (user: AdminUser) => {
    navigate(`/admin/users/${user.uid}`, {
      replace: true,
      state: { user },
    });
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const newStatus: "active" | "blocked" =
      user.status === "active" ? "blocked" : "active";

    setActionLoadingUid(user.uid);
    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.uid === user.uid ? { ...u, status: newStatus } : u))
    );

    try {
      await setUserStatus(user.uid, newStatus);
      setFeedbackMessage(
        `User "${user.displayName}" is now marked as ${newStatus}.`
      );
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update user status:", err);
      // Revert if error
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid ? { ...u, status: user.status } : u
        )
      );
    } finally {
      setActionLoadingUid(null);
    }
  };

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : u.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "active").length;
    const blocked = users.filter((u) => u.status === "blocked").length;
    return { total, active, blocked };
  }, [users]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              User Directory
            </h1>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              {stats.total} total
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            View registered user details, monitor activity, and manage active or
            blocked access badges.
          </p>
        </div>

        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 hover:text-gray-900 transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-indigo-600" : ""} />
          <span>Refresh Users</span>
        </button>
      </div>

      {/* Success / Alert notification pill */}
      {feedbackMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-medium text-emerald-800 animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
        {/* Total Users */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Users
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-gray-900">
            {stats.total}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            All registered authors & readers
          </p>
        </div>

        {/* Active Users */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Active Users
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <UserCheck size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-700">
            {stats.active}
          </p>
          <p className="mt-1 text-xs text-emerald-600/80">
            Unrestricted access granted
          </p>
        </div>

        {/* Blocked Users */}
        <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Blocked Users
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <UserX size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-rose-700">
            {stats.blocked}
          </p>
          <p className="mt-1 text-xs text-rose-600/80">
            Access restricted or suspended
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-gray-200 bg-white p-3.5 sm:p-4 shadow-xs">
        {/* Search input */}
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email address..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-10 pr-4 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs font-semibold text-gray-400 mr-1 hidden sm:inline">
            <Filter size={14} className="inline mr-1" /> Filter:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${statusFilter === "all"
              ? "bg-gray-900 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            All ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${statusFilter === "active"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
          >
            Active ({stats.active})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("blocked")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${statusFilter === "blocked"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
          >
            Blocked ({stats.blocked})
          </button>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-semibold text-gray-700">Loading user records...</p>
            <p className="text-xs text-gray-400 mt-1">Fetching profiles from directory</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-base font-semibold text-gray-700">No users found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search query or filter criteria.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Stacked User Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const isBlocked = user.status === "blocked";
                const isOperating = actionLoadingUid === user.uid;

                return (
                    <div
                      key={user.uid}
                      onClick={() => handleOpenUser(user)}
                      className="p-4 space-y-3 cursor-pointer hover:bg-indigo-50/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-xs font-bold text-white uppercase shadow-xs">
                            {user.displayName ? user.displayName[0] : "U"}
                          </div>
                          <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate hover:text-indigo-600 transition-colors">
                                {user.displayName}
                              </p>
                              <span className="inline-block rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 mt-0.5">
                                {user.role || "Member"}
                              </span>
                          </div>
                        </div>

                        {isBlocked ? (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        )}
                      </div>

                      <p className="break-all font-mono text-xs text-gray-600">
                        {user.email}
                      </p>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          <BookOpen size={12} className="text-gray-400" />
                          {user.blogsCount ?? 0}{" "}
                          {(user.blogsCount ?? 0) === 1 ? "Story" : "Stories"}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(user);
                          }}
                          disabled={isOperating}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition shadow-xs disabled:opacity-50 ${isBlocked
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            }`}
                          title={
                            isBlocked
                              ? "Grant active status to this user"
                              : "Restrict / block this user"
                          }
                        >
                          {isBlocked ? (
                            <>
                              <CheckCircle2 size={13} />
                              <span>{isOperating ? "Updating..." : "Unblock User"}</span>
                            </>
                          ) : (
                            <>
                              <Ban size={13} />
                              <span>{isOperating ? "Updating..." : "Block User"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    );
              })}
                  </div>

                                    {/* Desktop Table */ }
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        <th scope="col" className="px-6 py-4">User</th>
                        <th scope="col" className="px-6 py-4">Email</th>
                        <th scope="col" className="px-6 py-4">Status</th>
                        <th scope="col" className="px-6 py-4 text-center">Stories</th>
                        <th scope="col" className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredUsers.map((user) => {
                        const isBlocked = user.status === "blocked";
                        const isOperating = actionLoadingUid === user.uid;

                        return (
                          <tr
                            key={user.uid}
                            onClick={() => handleOpenUser(user)}
                            className="cursor-pointer hover:bg-indigo-50/40 transition-colors group"
                            title={`View ${user.displayName}'s profile & posts`}
                          >
                            {/* Name & Avatar */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-xs font-bold text-white uppercase shadow-xs">
                                  {user.displayName ? user.displayName[0] : "U"}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                      {user.displayName}
                                    </p>
                                    <span className="inline-block rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 mt-0.5">
                                      {user.role || "Member"}
                                    </span>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                              {user.email}
                            </td>

                            {/* Active or Blocked Badge */}
                            <td className="px-6 py-4">
                              {isBlocked ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                  Blocked
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active
                                </span>
                              )}
                            </td>

                            {/* Stories Count */}
                            <td className="px-6 py-4 text-center text-xs text-gray-600">
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-700">
                                <BookOpen size={12} className="text-gray-400" />
                                {user.blogsCount ?? 0}
                              </span>
                            </td>

                            {/* Action Button: Toggle Active/Blocked */}
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatus(user);
                                }}
                                disabled={isOperating}
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition shadow-xs disabled:opacity-50 ${isBlocked
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                  }`}
                                title={
                                  isBlocked
                                    ? "Grant active status to this user"
                                    : "Restrict / block this user"
                                }
                              >
                                {isBlocked ? (
                                  <>
                                    <CheckCircle2 size={13} />
                                    <span>{isOperating ? "Updating..." : "Unblock User"}</span>
                                  </>
                                ) : (
                                  <>
                                    <Ban size={13} />
                                    <span>{isOperating ? "Updating..." : "Block User"}</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr >
                        );
                      })}
                    </tbody>
                  </table>
                </div>
          </>
        )}
          </div>
      </div>
      );
}