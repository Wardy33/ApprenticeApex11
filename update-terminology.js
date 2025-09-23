const fs = require("fs");
const path = require("path");

// Files to update with terminology changes
const filesToUpdate = [
  "client/pages/StudentApp.tsx",
  "client/pages/StudentAuth.tsx",
  "client/pages/StudentProfileSetup.tsx",
  "client/components/WebFooter.tsx",
  "client/components/SignInModal.tsx",
  "client/components/ProfileCompletionModal.tsx",
  "client/components/StagedStudentCard.tsx",
  "client/components/SEOHead.tsx",
  "client/components/InterviewScheduler.tsx",
  "client/components/EmployerAgreement.tsx",
  "client/components/StatusDashboard.tsx",
  "client/components/LiveChat.tsx",
  "client/components/SecureMessaging.tsx",
  "client/components/VideoInterview.tsx",
  "client/pages/Contact.tsx",
  "client/pages/admin/AdminDashboard.tsx",
  "client/pages/admin/MonitoringDashboard.tsx",
  "client/pages/CompanyPortal.tsx",
];

// Terminology mappings
const terminologyMap = {
  // URL paths
  "/student/": "/candidate/",
  "/api/student/": "/api/candidate/",

  // Text replacements
  "Student Portal": "Candidate Portal",
  "Student Dashboard": "Candidate Dashboard",
  "Student Profile": "Candidate Profile",
  "Student Application": "Candidate Application",
  "student registration": "candidate registration",
  "student login": "candidate login",
  "student signup": "candidate signup",
  "student account": "candidate account",
  "For Students": "For Candidates",
  Students: "Candidates",
  student: "candidate",

  // Interface and type names
  StudentApp: "CandidateApp",
  StudentAuth: "CandidateAuth",
  StudentProfile: "CandidateProfile",
  StudentProfileSetup: "CandidateProfileSetup",
  StudentAppLayout: "CandidateAppLayout",
  StagedStudentCard: "StagedCandidateCard",
  StagedStudentProfile: "StagedCandidateProfile",

  // Variables and IDs
  studentId: "candidateId",
  studentName: "candidateName",
  studentEmail: "candidateEmail",
  studentLocation: "candidateLocation",
  totalStudents: "totalCandidates",
  'senderId: "student"': 'senderId: "candidate"',

  // LocalStorage keys
  studentProfile_: "candidateProfile_",
  studentPrivacy_: "candidatePrivacy_",
  studentNotification_: "candidateNotification_",

  // Role values
  "'student'": "'candidate'",
  '"student"': '"candidate"',
  "role: 'student'": "role: 'candidate'",
  'role === "student"': 'role === "candidate"',
};

function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, "utf8");
    let updated = false;

    // Apply all terminology mappings
    for (const [oldTerm, newTerm] of Object.entries(terminologyMap)) {
      if (content.includes(oldTerm)) {
        content = content.replace(
          new RegExp(oldTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          newTerm,
        );
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`📝 No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Update all files
console.log("🔄 Starting Student → Candidate terminology update...\n");

filesToUpdate.forEach(updateFile);

console.log("\n🎉 Terminology update completed!");
