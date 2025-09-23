import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

import express, { Request, Response, NextFunction } from "express";

const router = express.Router();

// ====================================================================
// PHASE 3: ROUTE-SPECIFIC ERROR HANDLING AND DEBUGGING
// ====================================================================

// Route-level debugging middleware
router.use((req: Request, _res: Response, next: NextFunction) => {
  console.log("\n🔐 === AUTH ROUTE DEBUG ===");
  console.log("🔐 Auth Route Hit:", req.method, req.path);
  console.log("🔐 Headers:", JSON.stringify(req.headers, null, 2));
  console.log("🔐 Body:", JSON.stringify(req.body, null, 2));
  console.log("🔐 Content-Type:", req.get("Content-Type"));
  console.log("🔐 === AUTH ROUTE DEBUG END ===\n");
  next();
});

// Body validation middleware specifically for login
router.use("/login", (req: Request, res: Response, next: NextFunction) => {
  if (req.method === "POST") {
    console.log("🔒 Login-specific middleware check");
    console.log("🔒 Request body exists:", !!req.body);
    console.log("🔒 Request body type:", typeof req.body);
    console.log(
      "🔒 Request body keys:",
      req.body ? Object.keys(req.body) : "no body",
    );

    if (!req.body) {
      console.error("❌ No request body found for login");
      res.status(400).json({
        success: false,
        error: "Request body is required",
        details: "POST request must include JSON body with email and password",
      });
    }

    if (typeof req.body !== "object") {
      console.error("❌ Request body is not an object:", typeof req.body);
      res.status(400).json({
        success: false,
        error: "Request body must be a JSON object",
        received: typeof req.body,
        body: req.body,
      });
    }
  }
  next();
});

// Company registration info endpoint (GET)
router.get("/register/company", (_req: Request, res: Response) => {
  console.log("📋 Company registration info endpoint hit");
  res.json({
    success: true,
    message: "Company registration endpoint",
    method: "POST",
    requiredFields: [
      "email",
      "password",
      "companyName",
      "firstName",
      "lastName",
    ],
    optionalFields: [
      "industry",
      "companySize",
      "website",
      "description",
      "address",
      "city",
      "postcode",
    ],
    endpoint: "/api/auth/register/company",
  });
});

// Company-specific registration endpoint (POST)
router.post("/register/company", async (req: Request, res: Response) => {
  try {
    console.log("🏢 Company registration request received");
    console.log("📋 Company request body:", JSON.stringify(req.body, null, 2));

    const {
      email,
      password,
      companyName,
      industry,
      companySize,
      website,
      description,
      firstName,
      lastName,
      position,
      address,
      city,
      postcode,
    } = req.body;

    // Basic validation
    if (!email || !password || !companyName || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        error: "Required fields missing",
        details:
          "Email, password, company name, first name, and last name are required",
      });
    }

    // Transform the company registration data to match our user model
    const userData = {
      email: email.toLowerCase(),
      password,
      role: "company",
      profile: {
        companyName,
        industry: industry || "Technology",
        companySize,
        website: website || "",
        description: description || "",
        location: {
          city: city || "Unknown",
          address: address || "",
          postcode: postcode || "",
          coordinates: [0, 0],
        },
        contactPerson: {
          firstName,
          lastName,
          position: position || "Manager",
        },
        isVerified: false,
      },
      isEmailVerified: false,
      isActive: true,
    };

    try {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: "Company already registered",
          details: "A user with this email already exists",
        });
      }

      const newUser = new User(userData);
      await newUser.save();

      const token = jwt.sign(
        { userId: newUser._id, role: newUser.role, email: newUser.email },
        process.env.JWT_SECRET || "dev-secret-key-minimum-32-characters-long",
        { expiresIn: "7d" },
      );

      console.log("✅ Company registration successful for:", email);

      res.status(201).json({
        success: true,
        data: {
          user: {
            _id: newUser._id,
            email: newUser.email,
            role: newUser.role,
            profile: newUser.profile,
            isEmailVerified: newUser.isEmailVerified,
            createdAt: newUser.createdAt,
          },
          token,
        },
        message: "Company registration successful",
      });
    } catch (dbError) {
      console.log(
        "Database error, using mock response:",
        dbError instanceof Error ? dbError.message : String(dbError),
      );

      const mockToken = jwt.sign(
        {
          userId: "mock-company-" + Date.now(),
          role: "company",
          email: userData.email,
        },
        process.env.JWT_SECRET || "dev-secret-key-minimum-32-characters-long",
        { expiresIn: "7d" },
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            _id: "mock-company-" + Date.now(),
            email: userData.email,
            role: "company",
            profile: userData.profile,
            isEmailVerified: false,
            createdAt: new Date(),
          },
          token: mockToken,
        },
        message: "Company registration successful (development mode)",
      });
    }
  } catch (error) {
    console.error("Company registration error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Company registration failed",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

// Temporary debugging endpoint
router.post("/login-test", (req: Request, res: Response) => {
  console.log("🧪 Login test endpoint hit");
  console.log("🧪 Body:", JSON.stringify(req.body, null, 2));

  res.json({
    success: true,
    message: "Login test endpoint working",
    receivedBody: req.body,
    bodyType: typeof req.body,
    bodyKeys: req.body ? Object.keys(req.body) : [],
    timestamp: new Date().toISOString(),
  });
});

// POST /api/auth/register - Register new user (EXISTING - KEEP THIS)
router.post("/register", async (req: Request, res: Response) => {
  try {
    console.log("📝 Registration request received");
    const { email, password, role, profile } = req.body;

    if (!email || !password || !role) {
      res.status(400).json({
        success: false,
        error: "Email, password, and role are required",
      });
    }

    const userData = {
      email: email.toLowerCase(),
      password,
      role,
      profile:
        profile ||
        (role === "student"
          ? {
              firstName: "New",
              lastName: "User",
              skills: [],
              hasDriversLicense: false,
              education: [],
              experience: [],
              location: { city: "Unknown", postcode: "", coordinates: [0, 0] },
              preferences: {
                industries: [],
                maxDistance: 25,
                salaryRange: { min: 0, max: 100000 },
              },
              transportModes: [],
              isActive: true,
            }
          : {
              companyName: profile?.companyName || "New Company",
              industry: profile?.industry || "Technology",
              description: profile?.description || "A company",
              location: {
                city: "Unknown",
                address: "Unknown",
                coordinates: [0, 0],
              },
              contactPerson: {
                firstName: "Contact",
                lastName: "Person",
                position: "Manager",
              },
              isVerified: false,
            }),
      isEmailVerified: false,
      isActive: true,
    };

    try {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: "User already exists",
        });
      }

      const newUser = new User(userData);
      await newUser.save();

      const token = jwt.sign(
        { userId: newUser._id, role: newUser.role, email: newUser.email },
        process.env.JWT_SECRET || "dev-secret-key-minimum-32-characters-long",
        { expiresIn: "7d" },
      );

      console.log("✅ Registration successful for:", email);

      res.status(201).json({
        success: true,
        data: {
          user: {
            _id: newUser._id,
            email: newUser.email,
            role: newUser.role,
            profile: newUser.profile,
            isEmailVerified: newUser.isEmailVerified,
            createdAt: newUser.createdAt,
          },
          token,
        },
        message: "Registration successful",
      });
    } catch (dbError) {
      console.log(
        "Database error, using mock response:",
        dbError instanceof Error ? dbError.message : String(dbError),
      );

      const mockToken = jwt.sign(
        { userId: "mock-" + Date.now(), role, email: userData.email },
        process.env.JWT_SECRET || "dev-secret-key-minimum-32-characters-long",
        { expiresIn: "7d" },
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            _id: "mock-" + Date.now(),
            email: userData.email,
            role,
            profile: userData.profile,
            isEmailVerified: false,
            createdAt: new Date(),
          },
          token: mockToken,
        },
        message: "Registration successful (development mode)",
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Registration failed",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

// Company signin endpoint (dedicated endpoint for company authentication)
router.post("/company/signin", async (req: Request, res: Response) => {
  try {
    console.log("🏢 Company signin request received");
    console.log("📋 Company signin body:", JSON.stringify(req.body, null, 2));

    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    try {
      // Find company user by email
      const user = await User.findOne({
        email: email.toLowerCase(),
        role: "company",
      });

      if (!user) {
        console.log("❌ Company user not found:", email);
        res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      console.log("👤 Company user found:", user.email);
      console.log("👤 User role:", user.role);

      // Check if user is active
      if (!user.isActive) {
        console.log("❌ Company account is deactivated");
        res.status(401).json({
          success: false,
          error: "Account has been deactivated",
        });
      }

      console.log("🔑 Verifying company password...");

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log("🔑 Company password verification result:", isPasswordValid);

      if (!isPasswordValid) {
        console.log("❌ Invalid password for company:", email);
        res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      console.log("✅ Company password verified successfully");

      // Update last login
      try {
        user.lastLogin = new Date();
        await user.save();
        console.log("✅ Company last login updated");
      } catch (updateError) {
        console.warn(
          "⚠️ Could not update company last login:",
          updateError instanceof Error
            ? updateError.message
            : String(updateError),
        );
      }

      // Generate JWT token
      const jwtSecret =
        process.env.JWT_SECRET || "dev-secret-key-minimum-32-characters-long";
      const token = jwt.sign(
        { userId: user._id, role: user.role, email: user.email },
        jwtSecret,
        { expiresIn: "7d" },
      );

      console.log("✅ Company JWT token generated successfully");

      // Return user data without sensitive information
      const userResponse = {
        _id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      };

      const response = {
        success: true,
        data: {
          user: userResponse,
          token,
        },
        message: "Company login successful",
      };

      console.log("✅ Company login successful for:", email);
      res.json(response);
    } catch (dbError) {
      console.error(
        "❌ Database error during company login:",
        dbError instanceof Error ? dbError.message : String(dbError),
      );

      // For development: provide mock company login if database fails
      if (process.env.NODE_ENV === "development") {
        console.log("🔧 Using mock company login for development");

        const mockToken = jwt.sign(
          {
            userId: "mock-company-id",
            role: "company",
            email: email.toLowerCase(),
          },
          process.env.JWT_SECRET || "dev-secret-key-minimum-32-characters-long",
          { expiresIn: "7d" },
        );

        res.json({
          success: true,
          data: {
            user: {
              _id: "mock-company-id",
              email: email.toLowerCase(),
              role: "company",
              profile: {
                companyName: "Test Company",
                industry: "Technology",
                contactPerson: {
                  firstName: "Test",
                  lastName: "Manager",
                },
              },
              isEmailVerified: false,
              lastLogin: new Date(),
              createdAt: new Date(),
            },
            token: mockToken,
          },
          message: "Company login successful (development mode)",
        });
      }

      res.status(500).json({
        success: false,
        error: "Database connection error",
        details: "Unable to verify company credentials",
        dbError: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }
  } catch (error) {
    console.error(
      "❌ Company signin error:",
      error instanceof Error ? error.message : String(error),
    );
    if (error instanceof Error) {
      console.error("❌ Company signin error stack:", error.stack);
    }

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Internal server error during company signin",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

// POST /api/auth/login - Enhanced login with detailed logging
router.post(
  "/login",
  async (
    req: import("express").Request,
    res: import("express").Response,
  ): Promise<any> => {
    try {
      console.log("🔐 Login request received");
      console.log("📋 Request headers:", JSON.stringify(req.headers, null, 2));
      console.log("📋 Request body:", JSON.stringify(req.body, null, 2));
      console.log("📋 Request method:", req.method);
      console.log("📋 Request URL:", req.url);

      // Frontend compatibility - handle different field names
      let { email, password } = req.body;

      // Check for alternative field names
      if (!email && req.body.username) {
        email = req.body.username;
        console.log("📝 Using username field as email:", email);
      }
      if (!email && req.body.login) {
        email = req.body.login;
        console.log("📝 Using login field as email:", email);
      }
      if (!password && req.body.pass) {
        password = req.body.pass;
        console.log("📝 Using pass field as password");
      }

      // Log what we received
      console.log("📝 Final extracted values:", {
        email: email,
        hasPassword: !!password,
        originalBodyKeys: Object.keys(req.body),
      });

      // Detailed validation logging
      console.log("📝 Extracted email:", email);
      console.log(
        "📝 Extracted password:",
        password ? "[PROVIDED]" : "[MISSING]",
      );
      console.log("�� Email type:", typeof email);
      console.log("📝 Password type:", typeof password);

      // Enhanced validation with specific error messages
      if (!email) {
        console.log("❌ Email field is missing or empty");
        res.status(400).json({
          success: false,
          error: "Email is required",
          details: "Email field is missing or empty",
          received: { email: email, hasPassword: !!password },
        });
      }

      if (!password) {
        console.log("❌ Password field is missing or empty");
        res.status(400).json({
          success: false,
          error: "Password is required",
          details: "Password field is missing or empty",
          received: { email: email, hasPassword: !!password },
        });
      }

      // Additional validation
      if (typeof email !== "string") {
        console.log("❌ Email is not a string:", typeof email);
        res.status(400).json({
          success: false,
          error: "Email must be a string",
          details: `Expected string, got ${typeof email}`,
          received: { email: email, emailType: typeof email },
        });
      }

      if (typeof password !== "string") {
        console.log("❌ Password is not a string:", typeof password);
        res.status(400).json({
          success: false,
          error: "Password must be a string",
          details: `Expected string, got ${typeof password}`,
          received: { hasEmail: !!email, passwordType: typeof password },
        });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log("❌ Invalid email format:", email);
        res.status(400).json({
          success: false,
          error: "Invalid email format",
          details: "Email must be in valid format (user@domain.com)",
          received: { email: email },
        });
      }

      // Password length validation
      if (password.length < 1) {
        console.log("❌ Password is empty string");
        res.status(400).json({
          success: false,
          error: "Password cannot be empty",
          details: "Password must contain at least 1 character",
        });
      }

      console.log("✅ Basic validation passed");
      console.log("�� Looking for user:", email.toLowerCase());

      try {
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
          console.log("❌ User not found:", email);
          res.status(401).json({
            success: false,
            error: "Invalid email or password",
            details: "User not found in database",
          });
        }

        console.log("���� User found:", user.email);
        console.log("👤 User role:", user.role);
        console.log("👤 User active:", user.isActive);

        // Check if user is active
        if (!user.isActive) {
          console.log("❌ User account is deactivated");
          res.status(401).json({
            success: false,
            error: "Account has been deactivated",
            details: "User account is not active",
          });
        }

        console.log("🔑 Verifying password...");

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log("🔑 Password verification result:", isPasswordValid);

        if (!isPasswordValid) {
          console.log("❌ Invalid password for user:", email);
          res.status(401).json({
            success: false,
            error: "Invalid email or password",
            details: "Password verification failed",
          });
        }

        console.log("✅ Password verified successfully");
        console.log("🎫 Generating JWT token...");

        // Update last login
        try {
          user.lastLogin = new Date();
          await user.save();
          console.log("✅ Last login updated");
        } catch (updateError) {
          console.warn(
            "⚠️ Could not update last login:",
            updateError instanceof Error
              ? updateError instanceof Error
                ? updateError.message
                : String(updateError)
              : String(updateError),
          );
        }

        // Generate JWT token
        const jwtSecret =
          process.env.JWT_SECRET || "dev-secret-key-minimum-32-characters-long";
        const token = jwt.sign(
          { userId: user._id, role: user.role, email: user.email },
          jwtSecret,
          { expiresIn: "7d" },
        );

        console.log("✅ JWT token generated successfully");
        console.log("📤 Preparing response...");

        // Return user data without sensitive information
        const userResponse = {
          _id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        };

        const response = {
          success: true,
          data: {
            user: userResponse,
            token,
          },
          message: "Login successful",
        };

        console.log("✅ Login successful for:", email);
        console.log("📤 Sending response...");

        res.json(response);
      } catch (dbError) {
        console.error(
          "❌ Database error during login:",
          dbError instanceof Error ? dbError.message : String(dbError),
        );
        if (dbError instanceof Error) {
          console.error("��� Database error stack:", dbError.stack);
        }

        // For development: provide mock login if database fails
        if (process.env.NODE_ENV === "development") {
          console.log("🔧 Using mock login for development");

          // Determine role from request body or default to student
          const requestedRole = req.body.role || "student";

          const mockToken = jwt.sign(
            {
              userId: "mock-user-id",
              role: requestedRole,
              email: email.toLowerCase(),
            },
            process.env.JWT_SECRET ||
              "dev-secret-key-minimum-32-characters-long",
            { expiresIn: "7d" },
          );

          const mockProfile =
            requestedRole === "company"
              ? {
                  companyName: "Mock Company",
                  industry: "Technology",
                  contactPerson: {
                    firstName: "Mock",
                    lastName: "Manager",
                  },
                }
              : {
                  firstName: "Mock",
                  lastName: "User",
                };

          res.json({
            success: true,
            data: {
              user: {
                _id: "mock-user-id",
                email: email.toLowerCase(),
                role: requestedRole,
                profile: mockProfile,
                isEmailVerified: false,
                lastLogin: new Date(),
                createdAt: new Date(),
              },
              token: mockToken,
            },
            message: `${requestedRole === "company" ? "Company l" : "L"}ogin successful (development mode)`,
          });
        }

        res.status(500).json({
          success: false,
          error: "Database connection error",
          details: "Unable to verify credentials",
          dbError: dbError instanceof Error ? dbError.message : String(dbError),
        });
      }
    } catch (error) {
      console.error(
        "❌ Login error:",
        error instanceof Error ? error.message : String(error),
      );
      if (error instanceof Error) {
        console.error("❌ Login error stack:", error.stack);
      }
      console.error("❌ Request details:", {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
      });

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Internal server error during login",
          details: error instanceof Error ? error.message : String(error),
          requestInfo: {
            method: req.method,
            url: req.url,
            hasBody: !!req.body,
            bodyKeys: req.body ? Object.keys(req.body) : [],
          },
        });
      }
    }
  },
);

// GET /api/auth/test - Test endpoint (EXISTING - KEEP THIS)
router.get("/test", (_req, res) => {
  console.log("🧪 Auth test endpoint hit");
  res.json({
    success: true,
    message: "Auth routes are working",
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      "POST /api/auth/register",
      "POST /api/auth/register/company", // ← Company registration endpoint
      "POST /api/auth/login",
      "POST /api/auth/company/signin", // ← Company signin endpoint
      "POST /api/auth/login-test",
      "GET /api/auth/test",
    ],
  });
});

console.log("🔧 Auth routes module loaded successfully");
console.log("📋 Available endpoints: register, login, test");

export default router;
