# Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your values:

| Variable               | Description          | Default                     |
| ---------------------- | -------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL`  | Backend API base URL | `http://localhost:8000/api` |
| `NEXT_PUBLIC_APP_NAME` | Application name     | `MyApp`                     |
| `NEXT_PUBLIC_APP_URL`  | Frontend URL         | `http://localhost:3000`      |

## 3. Run Development Server

```bash
npm run dev
```

## 4. Available Scripts

| Command                       | Description                                  |
| ----------------------------- | -------------------------------------------- |
| `npm run dev`                 | Start dev server                             |
| `npm run build`               | Create production build                      |
| `npm run start`               | Start production server                      |
| `npm run lint`                | Run ESLint                                   |
| `npm run typecheck`           | Run TypeScript type checking                 |
| `npm run test:unit`           | Run unit tests (Vitest)                      |
| `npm run test:unit:watch`     | Run unit tests in watch mode                 |
| `npm run test:unit:coverage`  | Run unit tests with coverage report          |
| `npm run test:integration`    | Run integration tests (configure runner)     |
| `npm run test:e2e`            | Run e2e tests (configure runner)             |

---

## Unit Testing

### Stack

- **Vitest** — test runner (fast, Vite-native, Jest-compatible API)
- **@testing-library/react** — render and query React components
- **@testing-library/jest-dom** — DOM matchers (`toBeInTheDocument`, `toHaveTextContent`, etc.)
- **jsdom** — browser environment simulation

### Run Tests

```bash
# Run all unit tests
npm test

# Watch mode — re-runs on file change
npm run test:watch

# With coverage report
npm run test:coverage
```

### Where to Write Tests

All unit tests go in `src/tests/unit/`. Mirror the source folder structure:

```
src/
├── validations/
│   └── auth.ts              ← source
├── utils/
│   └── apiClient.ts         ← source
├── hooks/
│   └── useDebounce.ts       ← source
└── tests/
    └── unit/
        ├── validations/
        │   └── auth.test.ts ← test for validations/auth.ts
        ├── utils/
        │   └── apiClient.test.ts
        └── hooks/
            └── useDebounce.test.ts
```

### File Naming

- Test files: `*.test.ts` or `*.test.tsx` (for component tests)
- Place in the matching subfolder under `src/tests/unit/`

### Writing a Test

#### Basic structure

```ts
import { describe, it, expect } from "vitest";

describe("functionName", () => {
  it("should do expected behavior", () => {
    const result = myFunction(input);
    expect(result).toBe(expectedOutput);
  });

  it("should handle edge case", () => {
    expect(() => myFunction(badInput)).toThrow();
  });
});
```

#### Testing a Zod schema

```ts
import { describe, it, expect } from "vitest";
import { loginSchema } from "@/validations";

describe("loginSchema", () => {
  it("passes with valid data", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("fails with invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-email",
      password: "secret123",
    });
    expect(result.success).toBe(false);
  });
});
```

#### Testing a React component

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MyComponent from "@/components/common/MyComponent";

describe("MyComponent", () => {
  it("renders the title", () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

#### Testing a utility function

```ts
import { describe, it, expect } from "vitest";
import { sanitizeInput } from "@/validations";

describe("sanitizeInput", () => {
  it("strips HTML tags", () => {
    expect(sanitizeInput("<b>bold</b>")).toBe("bold");
  });

  it("trims whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
  });
});
```

### Common Matchers

| Matcher                        | Use for                        |
| ------------------------------ | ------------------------------ |
| `toBe(value)`                  | Exact equality (===)           |
| `toEqual(value)`               | Deep equality (objects/arrays) |
| `toBeTruthy()` / `toBeFalsy()` | Boolean checks                |
| `toContain(item)`              | Array/string contains          |
| `toThrow()`                    | Function throws error          |
| `toBeNull()`                   | Null check                     |
| `toHaveLength(n)`              | Array/string length            |
| `toBeInTheDocument()`          | DOM element exists (jest-dom)  |
| `toHaveTextContent(text)`      | DOM text content (jest-dom)    |

### Tips

- Keep tests small — one behavior per `it()` block
- Use `describe()` to group related tests
- Name tests as: `it("should [expected behavior] when [condition]")`
- Use `@/` path alias for imports (same as source code)
- Run `npm run test:watch` during development for instant feedback
