import { render, screen } from "@testing-library/react";
import App from "./App";
import api, { tokenStore } from "./api";

jest.mock("./api", () => {
  const actual = jest.requireActual("./api");
  const mockApi = { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() };
  return { __esModule: true, ...actual, default: mockApi };
});

const account = (role, permissions) => ({
  user: { id: "u1", email: "a@x.co", name: "Asha", phone: "", city: "", role, hasProfile: true, permissions },
});
const USER = account("user", ["profile:read", "profile:update", "submissions:own:read", "submissions:own:cancel"]);
const ADMIN = account("admin", [...USER.user.permissions, "dashboard:read", "submissions:read", "users:read"]);

beforeEach(() => {
  tokenStore.set("token");
  window.history.pushState({}, "", "/dashboard");
  api.get.mockReset();
});
afterEach(() => tokenStore.clear());

test("a user promoted to admin while signed in reaches the dashboard without signing in again", async () => {
  // First /me (page load) still says "user"; the server has since made them admin.
  let promoted = false;
  api.get.mockImplementation((url) => {
    if (url === "/api/auth/me") {
      const body = promoted ? ADMIN : USER;
      promoted = true;
      return Promise.resolve({ data: body });
    }
    if (url === "/api/admin/stats") return Promise.resolve({ data: null });
    return Promise.resolve({ data: { items: [], total: 0, page: 1, pages: 1 } });
  });

  render(<App />);
  expect(await screen.findByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  expect(screen.queryByText(/don't have access/i)).not.toBeInTheDocument();
});

test("a plain user still gets 'no access' on the dashboard", async () => {
  api.get.mockImplementation((url) =>
    Promise.resolve({ data: url === "/api/auth/me" ? USER : { items: [], total: 0, page: 1, pages: 1 } })
  );
  render(<App />);
  expect(await screen.findByText(/don't have access/i)).toBeInTheDocument();
});
