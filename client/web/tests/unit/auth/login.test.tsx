import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginPage from "@/app/auth/login/page";

// Mock Next.js router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders login form with all required elements", () => {
    render(<LoginPage />);

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText("Remember me")).toBeInTheDocument();
    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
  });

  it("toggles password visibility", () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole("button", { name: "" }); // Button with no accessible name

    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("handles form submission", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Login attempt:", {
        email: "test@example.com",
        password: "password123",
      });
    });

    consoleSpy.mockRestore();
  });

  it("navigates to signup page", () => {
    render(<LoginPage />);

    const signupLink = screen.getByText("Sign up");
    expect(signupLink).toBeInTheDocument();
    expect(signupLink.closest("a")).toHaveAttribute("href", "/auth/signup");
  });

  it("navigates to reset password page", () => {
    render(<LoginPage />);

    const resetLink = screen.getByText("Forgot password?");
    expect(resetLink).toBeInTheDocument();
    expect(resetLink.closest("a")).toHaveAttribute("href", "/auth/reset");
  });
});