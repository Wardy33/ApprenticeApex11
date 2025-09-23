import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function DataStoragePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Data & Storage</h1>
        </div>
      </div>
      <div className="p-6">
        <div className="bg-white rounded-xl p-6">
          <p className="text-gray-600">
            Data & storage settings coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}

export default DataStoragePage;
