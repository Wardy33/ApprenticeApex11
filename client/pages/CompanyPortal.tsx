import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import SubscriptionManager from "../components/SubscriptionManager";
import SubscriptionPrompt from "../components/SubscriptionPrompt";
import CompanyPricing from "../components/CompanyPricing";
import { useSubscriptionLimits } from "../hooks/useSubscriptionLimits";
import NotificationModal from "../components/NotificationModal";
import { apiClient } from "../lib/apiUtils";
import {
  ArrowLeft,
  Home,
  Building2,
  Users,
  BarChart3,
  Plus,
  Search,
  Filter as FilterIcon,
  Eye,
  MessageCircle,
  Video,
  Settings,
  Bell,
  X,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Save,
  CreditCard,
  TrendingUp,
  DollarSign,
} from "lucide-react";

interface Application {
  id: string;
  candidateName: string;
  jobTitle: string;
  applicationDate: string;
  status: "pending" | "reviewed" | "interview" | "rejected" | "accepted";
  score?: number;
  location?: string;
  experience?: string;
  skills?: string[];
}

interface JobListing {
  id: string;
  title: string;
  location: string;
  type: "full-time" | "part-time" | "contract";
  salary: string;
  description: string;
  requirements: string[];
  postedDate: string;
  closingDate: string;
  applications: number;
  status: "active" | "paused" | "closed";
}

interface Interview {
  id: string;
  candidateName: string;
  jobTitle: string;
  date?: string;
  time?: string;
  type: "video" | "phone" | "in-person";
  status: "scheduled" | "completed" | "cancelled";
  duration?: string;
}

interface Notification {
  id: string;
  type: "application" | "interview" | "message" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const cardClass = "bg-white rounded-2xl p-6 border border-gray-200 shadow-sm";
const buttonPrimary =
  "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors";
const inputClass =
  "w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    interview: "bg-blue-100 text-blue-700",
    reviewed: "bg-purple-100 text-purple-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    paused: "bg-yellow-100 text-yellow-700",
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
};

function Dashboard() {
  const navigate = useNavigate();
  const [recentApplications, setRecentApplications] = useState<Application[]>(
    [],
  );
  const [recentInterviews, setRecentInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const appsResponse = await apiClient.getCompanyApplications({
          limit: 3,
          recent: true,
        });
        if (!appsResponse.error && appsResponse.data) {
          setRecentApplications(
            appsResponse.data.applications || appsResponse.data || [],
          );
        }
        const interviewsResponse = await apiClient.getCompanyInterviews({
          limit: 3,
          recent: true,
        });
        if (!interviewsResponse.error && interviewsResponse.data) {
          setRecentInterviews(
            interviewsResponse.data.interviews || interviewsResponse.data || [],
          );
        }
      } catch (e) {
        setRecentApplications([]);
        setRecentInterviews([]);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back!
            </h1>
            <p className="text-gray-600">Here's your recruitment overview</p>
          </div>
          <button
            onClick={() => navigate("/company/listings?create=true")}
            className={`${buttonPrimary} flex items-center space-x-2`}
          >
            <Plus className="h-4 w-4" />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: Building2,
            color: "blue",
            label: "Active Job Listings",
            value: "—",
            change: "",
          },
          {
            icon: Users,
            color: "purple",
            label: "Total Applications",
            value: "—",
            change: "",
          },
          {
            icon: Video,
            color: "orange",
            label: "Interviews Scheduled",
            value: "—",
            change: "",
          },
          {
            icon: TrendingUp,
            color: "green",
            label: "Match Rate",
            value: "—",
            change: "",
          },
        ].map((stat, i) => (
          <div key={i} className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}
              >
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
              {stat.change && (
                <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-lg">
                  {stat.change}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-gray-600 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Applications
            </h3>
            <Link
              to="/company/applications"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 text-sm mt-2">
                  Loading applications...
                </p>
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No recent applications</p>
              </div>
            ) : (
              recentApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex items-center space-x-4 p-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {(application.candidateName || "U").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {application.candidateName || "Unknown Candidate"}
                    </h4>
                    <p className="text-gray-600 text-xs">
                      {application.jobTitle || "Position"}
                    </p>
                  </div>
                  <div className="text-right">
                    {typeof application.score === "number" && (
                      <div className="text-blue-600 font-semibold text-sm">
                        {application.score}%
                      </div>
                    )}
                    <StatusBadge status={application.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Upcoming Interviews
            </h3>
            <Link
              to="/company/interviews"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 text-sm mt-2">
                  Loading interviews...
                </p>
              </div>
            ) : recentInterviews.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No upcoming interviews</p>
              </div>
            ) : (
              recentInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center space-x-4 p-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {interview.candidateName || "Unknown Candidate"}
                    </h4>
                    <p className="text-gray-600 text-xs">
                      {interview.jobTitle || "Position"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-900 font-medium text-sm">
                      {interview.date
                        ? new Date(interview.date).toLocaleDateString()
                        : "TBD"}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {interview.time || "TBD"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyPortalLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isActive = (path: string) =>
    location.pathname === path || location.pathname === `${path}/`;

  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markAsRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

  const navItems = [
    { path: "/company", icon: BarChart3, label: "Dashboard" },
    { path: "/company/listings", icon: Building2, label: "Job Listings" },
    { path: "/company/applications", icon: Users, label: "Applications" },
    { path: "/company/interviews", icon: Video, label: "Interviews" },
    { path: "/company/messages", icon: MessageCircle, label: "Messages" },
    { path: "/company/subscription", icon: CreditCard, label: "Subscription" },
    { path: "/company/pricing", icon: DollarSign, label: "Upgrade Plan" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl"
            >
              <Home className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  ApprenticeApex
                </h1>
                <p className="text-xs text-gray-600">Company Portal</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-100 rounded-xl relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg z-50">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      Notifications
                    </h3>
                    <div className="flex items-center space-x-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!n.read ? "bg-blue-50" : ""}`}
                          onClick={() => markAsRead(n.id)}
                        >
                          <p className="text-sm font-medium text-gray-900">
                            {n.title}
                          </p>
                          <p className="text-sm text-gray-600">{n.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(n.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">TC</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {showMobileSidebar && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}
        <aside
          className={`${showMobileSidebar ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-81px)] z-50 transition-transform`}
        >
          <nav className="p-6 space-y-2">
            <div className="lg:hidden flex justify-between items-center mb-6">
              <span className="font-semibold text-gray-900">Menu</span>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all ${isActive(item.path) ? "bg-blue-100 text-blue-700 font-medium" : "hover:bg-gray-100 text-gray-700"}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-200 mt-6">
              <Link
                to="/company/settings/profile"
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 text-gray-700"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => navigate("/")}
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 text-red-600"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Main Site</span>
              </button>
            </div>
          </nav>
        </aside>
        <main className="flex-1 p-6 lg:ml-0">{children}</main>
      </div>
    </div>
  );
}

function JobListingsPage() {
  const location = useLocation();
  const [listings, setListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadJobListings = async () => {
      try {
        const response = await apiClient.getMyListings();
        if (!response.error && response.data) {
          setListings(response.data.apprenticeships || response.data || []);
        }
      } catch (e) {
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    loadJobListings();
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    if (sp.get("create") === "true") {
      window.history.replaceState({}, "", "/company/listings");
    }
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Listings</h2>
          <p className="text-gray-600">Manage your active job postings</p>
        </div>
        <button
          className={`${buttonPrimary} flex items-center space-x-2`}
          disabled
        >
          <Plus className="h-5 w-5" />
          <span>Create Listing</span>
        </button>
      </div>

      <div className={cardClass}>
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search job listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <FilterIcon className="h-5 w-5 text-gray-600" />
            </button>
            {showFilters && (
              <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-10 min-w-48">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Filter by Status
                </h4>
                <div className="space-y-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "active", label: "Active" },
                    { value: "paused", label: "Paused" },
                    { value: "closed", label: "Closed" },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={statusFilter === option.value}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="mr-2 text-blue-600"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              className={`${cardClass} hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {listing.title}
                    </h3>
                    <StatusBadge status={listing.status} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{listing.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{listing.applications} applications</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(listing.postedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4 line-clamp-2">
                    {listing.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-600 text-lg">
                      {listing.salary}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        disabled
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        disabled
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const response = await apiClient.getCompanyApplications();
        if (!response.error && response.data) {
          setApplications(response.data.applications || response.data || []);
        }
      } catch (e) {
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
  }, []);

  const filteredApplications = applications.filter((application) => {
    const matchesSearch =
      (application.candidateName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (application.jobTitle || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || application.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applications</h2>
          <p className="text-gray-600">
            Review and manage candidate applications
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="interview">Interview</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className={cardClass}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div
              key={application.id}
              className={`${cardClass} hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.candidateName}
                    </h3>
                    <StatusBadge status={application.status} />
                  </div>
                  <p className="text-gray-600 mb-3">{application.jobTitle}</p>
                </div>
                <div className="text-center">
                  {typeof application.score === "number" && (
                    <div className="text-blue-600 font-bold text-xl">
                      {application.score}%
                    </div>
                  )}
                  <div className="text-gray-600 text-xs">Match</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadInterviews = async () => {
      try {
        const response = await apiClient.getCompanyInterviews();
        if (!response.error && response.data) {
          setInterviews(response.data.interviews || response.data || []);
        }
      } catch (e) {
        setInterviews([]);
      } finally {
        setLoading(false);
      }
    };
    loadInterviews();
  }, []);

  const updateInterviewStatus = (
    id: string,
    newStatus: Interview["status"],
  ) => {
    setInterviews((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)),
    );
  };

  const filtered = interviews.filter((i) => {
    const matchesSearch =
      (i.candidateName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (i.jobTitle || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || i.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Interviews</h2>
          <p className="text-gray-600">
            Manage scheduled interviews with candidates
          </p>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search interviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((interview) => (
            <div
              key={interview.id}
              className={`${cardClass} hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {interview.candidateName}
                    </h3>
                    <StatusBadge status={interview.status} />
                  </div>
                  <p className="text-gray-600 text-sm">{interview.jobTitle}</p>
                </div>
                <div className="flex items-center space-x-3 ml-6">
                  <select
                    value={interview.status}
                    onChange={(e) =>
                      updateInterviewStatus(
                        interview.id,
                        e.target.value as Interview["status"],
                      )
                    }
                    className="text-sm border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    className={`p-2 rounded-xl transition-colors ${interview.type === "video" && interview.status === "scheduled" ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" : "text-gray-400 cursor-not-allowed"}`}
                    disabled={
                      !(
                        interview.type === "video" &&
                        interview.status === "scheduled"
                      )
                    }
                    title={
                      interview.type !== "video"
                        ? `${interview.type} interview - video call not available`
                        : interview.status !== "scheduled"
                          ? "Interview not scheduled yet"
                          : "Start video call"
                    }
                  >
                    <Video className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([
    {
      id: "1",
      candidateName: "Sarah Johnson",
      lastMessage: "Thank you for considering my application.",
      timestamp: "2024-01-15T14:30:00Z",
      unread: true,
      jobTitle: "Software Developer",
    },
    {
      id: "2",
      candidateName: "Mike Chen",
      lastMessage: "I'm available for the interview on Tuesday at 2 PM.",
      timestamp: "2024-01-15T11:20:00Z",
      unread: false,
      jobTitle: "Digital Marketing Assistant",
    },
  ]);

  const markAsReadConv = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unread: false } : conv,
      ),
    );
  };

  const openChat = (conversationId: string) => {
    markAsReadConv(conversationId);
    navigate(`/company/messages/${conversationId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
        <p className="text-gray-600">Communicate with candidates</p>
      </div>
      <div className="space-y-4">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => openChat(conversation.id)}
            className={`bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 ${conversation.unread ? "border-blue-300 bg-blue-50" : "border-gray-200"}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {conversation.candidateName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {conversation.candidateName}
                    </h3>
                    {conversation.unread && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    {conversation.jobTitle}
                  </p>
                  <p className="text-gray-700 line-clamp-2">
                    {conversation.lastMessage}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    {new Date(conversation.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubscriptionPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription & Billing
        </h1>
        <p className="text-gray-600">
          Manage your subscription plan and billing
        </p>
      </div>
      <SubscriptionManager />
    </div>
  );
}

function CompanyChatPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "1",
      senderId: "student",
      content:
        "Thank you for considering my application. I'm really excited about this opportunity and would love to learn more about the role.",
      timestamp: "10:30 AM",
      isOwn: false,
    },
    {
      id: "2",
      senderId: "company",
      content:
        "Hi Sarah! We're impressed with your application. We'd like to schedule a video interview with you. Are you available this week?",
      timestamp: "10:45 AM",
      isOwn: true,
    },
  ]);
  const [candidateInfo, setCandidateInfo] = useState<any>(null);

  useEffect(() => {
    const loadCandidateInfo = async () => {
      try {
        const response = await fetch(`/api/conversations/${id}/candidate`);
        if (response.ok) {
          const data = await response.json();
          setCandidateInfo(data.candidate);
        }
      } catch (e) {
        setCandidateInfo({
          name: "Unknown Candidate",
          jobTitle: "Position",
          avatar: null,
        });
      }
    };
    if (id) loadCandidateInfo();
  }, [id]);

  return (
    <div className="min-h-[calc(100vh-120px)] bg-white flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-700 mr-3 transition-all duration-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          {candidateInfo && (
            <>
              {candidateInfo.avatar && (
                <img
                  src={candidateInfo.avatar}
                  alt={candidateInfo.name}
                  className="w-10 h-10 rounded-full object-cover mr-3"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div>
                <h1 className="font-semibold text-gray-900">
                  {candidateInfo.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {candidateInfo.jobTitle}
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-all duration-200"
            title="Start video call"
          >
            <Video className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 px-6 py-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-2xl ${msg.isOwn ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <p
                className={`text-xs mt-1 ${msg.isOwn ? "text-blue-100" : "text-gray-500"}`}
              >
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && message.trim()) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `msg_${Date.now()}`,
                    senderId: "company",
                    content: message.trim(),
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    isOwn: true,
                  },
                ]);
                setMessage("");
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => {
              if (!message.trim()) return;
              setMessages((prev) => [
                ...prev,
                {
                  id: `msg_${Date.now()}`,
                  senderId: "company",
                  content: message.trim(),
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  isOwn: true,
                },
              ]);
              setMessage("");
            }}
            disabled={!message.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function CompanySettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Company Settings</h2>
        <p className="text-gray-600">
          Manage your company profile and preferences
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/company/settings/profile"
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Company Profile</h3>
              <p className="text-gray-600 text-sm">
                Update company information and branding
              </p>
            </div>
          </div>
        </Link>
        <Link
          to="/company/settings/notifications"
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Bell className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-gray-600 text-sm">
                Configure alert preferences
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function CompanyProfileSettingsPage() {
  const [profile, setProfile] = useState({
    companyName: "TechCorp Ltd",
    description:
      "A leading technology company specializing in software development and digital innovation.",
    industry: "Technology",
    size: "50-100",
    website: "https://techcorp.co.uk",
    address: "123 Tech Street, London, UK",
    phone: "+44 20 1234 5678",
    email: "hr@techcorp.co.uk",
    logo: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=100&h=100&fit=crop",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={profile.companyName}
            onChange={(e) =>
              setProfile({ ...profile, companyName: e.target.value })
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry
          </label>
          <select
            value={profile.industry}
            onChange={(e) =>
              setProfile({ ...profile, industry: e.target.value })
            }
            className={inputClass}
          >
            <option>Technology</option>
            <option>Marketing</option>
            <option>Engineering</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Description
        </label>
        <textarea
          value={profile.description}
          onChange={(e) =>
            setProfile({ ...profile, description: e.target.value })
          }
          rows={4}
          className={inputClass}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Size
          </label>
          <select
            value={profile.size}
            onChange={(e) => setProfile({ ...profile, size: e.target.value })}
            className={inputClass}
          >
            <option>1-10</option>
            <option>10-50</option>
            <option>50-100</option>
            <option>100+</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            type="url"
            value={profile.website}
            onChange={(e) =>
              setProfile({ ...profile, website: e.target.value })
            }
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <input
          type="text"
          value={profile.address}
          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className={buttonPrimary}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
      {success && <div className="text-green-600">Saved!</div>}
    </div>
  );
}

export default function CompanyPortal() {
  // Check authentication on load
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const userProfile = localStorage.getItem('userProfile');

    console.log('🔍 CompanyPortal authentication check:', {
      hasAuthToken: !!authToken,
      hasUserProfile: !!userProfile,
      currentPath: window.location.pathname
    });

    if (userProfile) {
      try {
        const profile = JSON.parse(userProfile);
        console.log('👤 User profile data:', {
          id: profile._id,
          email: profile.email,
          role: profile.role
        });

        // Check if user has company role
        if (profile.role !== 'company') {
          console.warn('⚠️ User role is not company:', profile.role);
          alert('Access denied: This portal is for company accounts only.');
          window.location.href = '/company/signin';
          return;
        }
      } catch (e) {
        console.error('❌ Error parsing user profile:', e);
        localStorage.removeItem('userProfile');
      }
    }

    if (!authToken) {
      console.warn('⚠️ No auth token found, redirecting to signin');
      window.location.href = '/company/signin';
      return;
    }
  }, []);

  return (
    <Routes>
      <Route
        path="/*"
        element={
          <CompanyPortalLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/listings" element={<JobListingsPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/interviews" element={<InterviewsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:id" element={<CompanyChatPage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/pricing" element={<CompanyPricingPage />} />
              <Route path="/settings" element={<CompanySettingsPage />} />
              <Route
                path="/settings/profile"
                element={<CompanyProfileSettingsPage />}
              />
            </Routes>
          </CompanyPortalLayout>
        }
      />
    </Routes>
  );
}

function CompanyPricingPage() {
  const handleStartTrial = async () => {
    try {
      const response = await fetch("/api/payments/checkout/trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        alert("Failed to start trial. Please try again.");
      }
    } catch (error) {
      alert("Failed to start trial. Please try again.");
    }
  };

  const handleSubscribe = async (planType: string) => {
    try {
      const response = await fetch(`/api/payments/checkout/${planType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        alert("Failed to start subscription. Please try again.");
      }
    } catch (error) {
      alert("Failed to start subscription. Please try again.");
    }
  };

  const handleContactSales = async () => {
    window.location.href =
      "mailto:sales@apprenticeapex.co.uk?subject=Enterprise Plan Inquiry&body=Hi, I am interested in learning more about the Enterprise plan for my organization.";
  };

  return (
    <div className="min-h-screen -m-6">
      <CompanyPricing
        onStartTrial={handleStartTrial}
        onSubscribe={handleSubscribe}
        onContactSales={handleContactSales}
      />
    </div>
  );
}
