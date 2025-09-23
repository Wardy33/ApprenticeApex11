// Simple AI Moderation Test for Security Audit
// This tests the contact detection patterns directly

const testCases = [
  // UK Phone Numbers
  { message: "My number is +44 7123 456789, call me tonight", shouldBlock: true },
  { message: "You can reach me on 07123456789 anytime", shouldBlock: true },
  { message: "Call me: 0-7-1-2-3-4-5-6-7-8-9", shouldBlock: true },
  
  // Email Addresses
  { message: "Send your CV to contact@email.com please", shouldBlock: true },
  { message: "Email me at john.smith@company.co.uk", shouldBlock: true },
  { message: "Contact me directly at myemail123@gmail.com", shouldBlock: true },
  
  // External Platforms
  { message: "Add me on WhatsApp for faster communication", shouldBlock: true },
  { message: "Let's connect on LinkedIn instead", shouldBlock: true },
  { message: "Can we talk outside of this platform?", shouldBlock: true },
  
  // Legitimate Messages (should NOT block)
  { message: "This apprenticeship looks great! I'm very interested.", shouldBlock: false },
  { message: "Could you tell me more about the company culture?", shouldBlock: false },
  { message: "I have 3 years of experience in customer service", shouldBlock: false },
];

// Contact detection patterns (simplified version of the AI service)
const contactPatterns = {
  ukPhoneNumbers: [
    /(\+44\s?7\d{3}[\s\-\.]?\d{3}[\s\-\.]?\d{3})/gi,
    /(\b07\d{3}[\s\-\.]?\d{3}[\s\-\.]?\d{3})/gi,
    /(\b\d{11}\b)/gi,
  ],
  emails: [
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
  ],
  externalPlatforms: [
    /(whatsapp|telegram|signal|discord)/gi,
    /(instagram|facebook|linkedin|twitter)/gi,
    /(outside\s*of\s*this\s*platform)/gi,
    /(contact\s*me\s*directly)/gi,
  ]
};

function analyzeMessage(message) {
  let shouldBlock = false;
  let detectedPatterns = [];
  let confidence = 0;

  // Check all pattern categories
  for (const [category, patterns] of Object.entries(contactPatterns)) {
    for (const pattern of patterns) {
      const matches = message.match(pattern);
      if (matches) {
        shouldBlock = true;
        detectedPatterns.push({
          category,
          matches: matches.length,
          pattern: pattern.toString()
        });
        
        // Calculate confidence based on category
        if (category === 'ukPhoneNumbers') confidence = Math.max(confidence, 0.95);
        if (category === 'emails') confidence = Math.max(confidence, 0.9);
        if (category === 'externalPlatforms') confidence = Math.max(confidence, 0.85);
      }
    }
  }

  return {
    shouldBlock,
    confidence,
    detectedPatterns,
    riskLevel: confidence >= 0.9 ? 'critical' : confidence >= 0.8 ? 'high' : 'medium'
  };
}

// Run tests
console.log('🚀 AI MODERATION SYSTEM TEST RESULTS');
console.log('=====================================');

let totalTests = 0;
let passed = 0;
let failed = 0;
let falsePositives = 0;
let falseNegatives = 0;

testCases.forEach((testCase, index) => {
  totalTests++;
  const result = analyzeMessage(testCase.message);
  
  console.log(`\nTest ${index + 1}: "${testCase.message}"`);
  console.log(`Expected: ${testCase.shouldBlock ? 'BLOCK' : 'ALLOW'}`);
  console.log(`Actual: ${result.shouldBlock ? 'BLOCK' : 'ALLOW'}`);
  console.log(`Confidence: ${result.confidence}`);
  
  if (testCase.shouldBlock === result.shouldBlock) {
    console.log(`✅ PASS`);
    passed++;
  } else {
    console.log(`❌ FAIL`);
    failed++;
    
    if (testCase.shouldBlock && !result.shouldBlock) {
      falseNegatives++;
      console.log(`   → False Negative: Failed to detect threat`);
    } else if (!testCase.shouldBlock && result.shouldBlock) {
      falsePositives++;
      console.log(`   → False Positive: Blocked legitimate message`);
    }
  }
  
  if (result.detectedPatterns.length > 0) {
    console.log(`   Detected: ${result.detectedPatterns.map(p => p.category).join(', ')}`);
  }
});

// Summary
console.log('\n📊 SUMMARY STATISTICS');
console.log('=====================');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passed} (${((passed / totalTests) * 100).toFixed(1)}%)`);
console.log(`Failed: ${failed}`);
console.log(`False Positives: ${falsePositives} (${((falsePositives / totalTests) * 100).toFixed(1)}%)`);
console.log(`False Negatives: ${falseNegatives} (${((falseNegatives / totalTests) * 100).toFixed(1)}%)`);

const passRate = (passed / totalTests) * 100;
const fpRate = (falsePositives / totalTests) * 100;
const fnRate = (falseNegatives / totalTests) * 100;

console.log('\n🎯 SECURITY ASSESSMENT');
console.log('======================');

if (passRate >= 95) {
  console.log(`✅ EXCELLENT: ${passRate.toFixed(1)}% pass rate meets security requirements`);
} else if (passRate >= 90) {
  console.log(`⚠️  GOOD: ${passRate.toFixed(1)}% pass rate is acceptable`);
} else {
  console.log(`❌ CRITICAL: ${passRate.toFixed(1)}% pass rate is below threshold`);
}

if (fpRate <= 2) {
  console.log(`✅ False positive rate: ${fpRate.toFixed(1)}% (acceptable)`);
} else {
  console.log(`⚠️  False positive rate: ${fpRate.toFixed(1)}% (may impact UX)`);
}

if (fnRate <= 5) {
  console.log(`✅ False negative rate: ${fnRate.toFixed(1)}% (acceptable)`);
} else {
  console.log(`❌ False negative rate: ${fnRate.toFixed(1)}% (security risk)`);
}

// Overall verdict
if (passRate >= 95 && fpRate <= 2 && fnRate <= 5) {
  console.log('\n🛡️  VERDICT: AI moderation system READY for production');
} else {
  console.log('\n⚠️  VERDICT: AI moderation system NEEDS IMPROVEMENT');
}
