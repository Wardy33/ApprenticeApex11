import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

// Lazy load all student pages for optimal bundle splitting
const HomePage = lazy(() => import("./student/HomePage"));
const JobsPage = lazy(() => import("./student/JobsPage"));
const MatchesPage = lazy(() => import("./student/MatchesPage"));
const MessagesPage = lazy(() => import("./student/MessagesPage"));
const ProfilePage = lazy(() => import("./student/ProfilePage"));
const ApprenticeshipInfoPage = lazy(
  () => import("./student/ApprenticeshipInfoPage"),
);
const StudentAppLayout = lazy(() => import("./student/StudentAppLayout"));
const AccountSettingsPage = lazy(() => import("./student/AccountSettingsPage"));

// Lazy load profile editing pages
const EditAboutPage = lazy(() => import("./student/profile/EditAboutPage"));
const EditContactPage = lazy(() => import("./student/profile/EditContactPage"));
const EditSkillsPage = lazy(() => import("./student/profile/EditSkillsPage"));
const EditAvailabilityPage = lazy(
  () => import("./student/profile/EditAvailabilityPage"),
);
const ChangePicturePage = lazy(
  () => import("./student/profile/ChangePicturePage"),
);

// Lazy load settings pages
const EditProfileInfoPage = lazy(
  () => import("./student/settings/EditProfileInfoPage"),
);
const EditSkillsPreferencesPage = lazy(
  () => import("./student/settings/EditSkillsPreferencesPage"),
);
const ChangePasswordPage = lazy(
  () => import("./student/settings/ChangePasswordPage"),
);
const PrivacySettingsPage = lazy(
  () => import("./student/settings/PrivacySettingsPage"),
);
const TwoFactorAuthPage = lazy(
  () => import("./student/settings/TwoFactorAuthPage"),
);
const NotificationSettingsPage = lazy(
  () => import("./student/settings/NotificationSettingsPage"),
);
const EmailPreferencesPage = lazy(
  () => import("./student/settings/EmailPreferencesPage"),
);
const LanguageRegionPage = lazy(
  () => import("./student/settings/LanguageRegionPage"),
);
const DataStoragePage = lazy(
  () => import("./student/settings/DataStoragePage"),
);
const DownloadDataPage = lazy(
  () => import("./student/settings/DownloadDataPage"),
);
const DeleteAccountPage = lazy(
  () => import("./student/settings/DeleteAccountPage"),
);

// Chat page
const ChatPage = lazy(() => import("./student/ChatPage"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
  </div>
);

export default function StudentApp() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Standalone pages without layout */}
        <Route
          path="/apprenticeship-info/:id"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ApprenticeshipInfoPage />
            </Suspense>
          }
        />
        <Route
          path="/chat/:id"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ChatPage />
            </Suspense>
          }
        />

        {/* Pages with layout */}
        <Route
          path="/*"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <StudentAppLayout>
                <Routes>
                  {/* Main navigation pages */}
                  <Route
                    path="/home"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <HomePage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/jobs"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <JobsPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/matches"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <MatchesPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/messages"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <MessagesPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ProfilePage />
                      </Suspense>
                    }
                  />

                  {/* Settings pages */}
                  <Route
                    path="/account-settings"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <AccountSettingsPage />
                      </Suspense>
                    }
                  />

                  {/* Profile editing pages */}
                  <Route
                    path="/edit-about"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <EditAboutPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/edit-contact"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <EditContactPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/edit-skills"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <EditSkillsPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/edit-availability"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <EditAvailabilityPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/change-picture"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ChangePicturePage />
                      </Suspense>
                    }
                  />

                  {/* Account settings pages */}
                  <Route
                    path="/edit-profile-info"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <EditProfileInfoPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/edit-skills-preferences"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <EditSkillsPreferencesPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/change-password"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ChangePasswordPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/privacy-settings"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <PrivacySettingsPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/two-factor-auth"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <TwoFactorAuthPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/notification-settings"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <NotificationSettingsPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/email-preferences"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <EmailPreferencesPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/language-region"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <LanguageRegionPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/data-storage"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <DataStoragePage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/download-data"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <DownloadDataPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/delete-account"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <DeleteAccountPage />
                      </Suspense>
                    }
                  />

                  {/* Default route */}
                  <Route
                    path="/"
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <HomePage />
                      </Suspense>
                    }
                  />
                </Routes>
              </StudentAppLayout>
            </Suspense>
          }
        />
      </Routes>
    </Suspense>
  );
}
