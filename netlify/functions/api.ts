import serverless from "serverless-http";

// Force production environment
process.env.NODE_ENV = "production";

import { createServer } from "../../server";

export const handler = serverless(createServer());
