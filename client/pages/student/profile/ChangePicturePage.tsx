import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, User } from "lucide-react";

function ChangePicturePage() {
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
          <h1 className="text-xl font-bold text-gray-900">Change Picture</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-xl p-6 text-center">
          <div className="relative inline-block mb-6">
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-16 w-16 text-gray-500" />
            </div>
            <div className="absolute bottom-0 right-0 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
              <Camera className="h-5 w-5" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Profile Picture
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            Upload a clear photo of yourself. This helps employers recognize
            you.
          </p>

          <div className="space-y-3">
            <button className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors">
              Upload New Photo
            </button>
            <button className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors">
              Remove Current Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePicturePage;
