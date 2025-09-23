import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MessageCircle, Building2 } from "lucide-react";

interface Conversation {
  id: string;
  companyName: string;
  apprenticeshipTitle: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar: string;
}

function MessagesPage() {
  const [conversations] = useState<Conversation[]>([
    {
      id: "1",
      companyName: "TechCorp Ltd",
      apprenticeshipTitle: "Software Developer Apprentice",
      lastMessage: "We'd love to schedule an interview with you!",
      lastMessageTime: "2 hours ago",
      unreadCount: 2,
      avatar: "/api/placeholder/40/40",
    },
    {
      id: "2",
      companyName: "Creative Agency",
      apprenticeshipTitle: "Digital Marketing Apprentice",
      lastMessage: "Thank you for your application. We'll be in touch soon.",
      lastMessageTime: "1 day ago",
      unreadCount: 0,
      avatar: "/api/placeholder/40/40",
    },
    // Add more sample data as needed
  ]);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.apprenticeshipTitle
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => (
              <Link
                key={conversation.id}
                to={`/student/chat/${conversation.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-gray-500" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {conversation.companyName}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {conversation.lastMessageTime}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {conversation.apprenticeshipTitle}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>

                  {/* Unread Badge */}
                  {conversation.unreadCount > 0 && (
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No conversations yet
              </h3>
              <p className="text-gray-500 mb-4">
                Start applying to apprenticeships to begin conversations with
                employers.
              </p>
              <Link
                to="/student/jobs"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesPage;
