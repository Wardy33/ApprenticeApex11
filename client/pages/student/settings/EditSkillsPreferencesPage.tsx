import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function EditSkillsPreferencesPage() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    industries: ["Technology", "Finance"],
    jobTypes: ["Full-time", "Remote"],
    salaryRange: "18000-25000",
  });

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
          <h1 className="text-xl font-bold text-gray-900">
            Skills & Preferences
          </h1>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-xl p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Preferred Industries
              </h3>
              <div className="space-y-2">
                {[
                  "Technology",
                  "Finance",
                  "Healthcare",
                  "Marketing",
                  "Engineering",
                ].map((industry) => (
                  <label key={industry} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.industries.includes(industry)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreferences({
                            ...preferences,
                            industries: [...preferences.industries, industry],
                          });
                        } else {
                          setPreferences({
                            ...preferences,
                            industries: preferences.industries.filter(
                              (i) => i !== industry,
                            ),
                          });
                        }
                      }}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-gray-700">{industry}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Salary Range
              </h3>
              <select
                value={preferences.salaryRange}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    salaryRange: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="16000-20000">£16,000 - £20,000</option>
                <option value="18000-25000">£18,000 - £25,000</option>
                <option value="22000-30000">£22,000 - £30,000</option>
                <option value="25000-35000">£25,000 - £35,000</option>
              </select>
            </div>
          </div>

          <button className="mt-6 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditSkillsPreferencesPage;
