import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

process.env.DATABASE_URL ??= "postgresql://test:test@127.0.0.1:5432/test";
process.env.AUTH_SECRET ??= "test-secret-with-at-least-thirty-two-characters";

afterEach(() => {
  cleanup();
});
