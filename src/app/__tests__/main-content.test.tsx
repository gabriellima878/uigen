import { test, expect, vi, afterEach, describe } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

// Mock providers
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <>{children}</>,
}));

// Mock child components
vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Actions</div>,
}));

// Mock resizable panels with simple pass-through
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: any) => <div>{children}</div>,
  ResizablePanel: ({ children }: any) => <div style={{ flex: 1 }}>{children}</div>,
  ResizableHandle: () => <div />,
}));

afterEach(() => {
  cleanup();
});

describe("MainContent toggle buttons", () => {
  test("shows preview by default", () => {
    render(<MainContent />);

    expect(screen.getByTestId("preview-frame")).toBeDefined();
    expect(screen.queryByTestId("code-editor")).toBeNull();
  });

  test("clicking Code tab shows code editor and hides preview", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    const codeTab = screen.getByRole("tab", { name: "Code" });
    await user.click(codeTab);

    expect(screen.getByTestId("code-editor")).toBeDefined();
    expect(screen.queryByTestId("preview-frame")).toBeNull();
  });

  test("clicking Preview tab after Code returns to preview", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    // Switch to code view
    await user.click(screen.getByRole("tab", { name: "Code" }));
    expect(screen.getByTestId("code-editor")).toBeDefined();

    // Switch back to preview
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByTestId("preview-frame")).toBeDefined();
    expect(screen.queryByTestId("code-editor")).toBeNull();
  });

  test("Preview tab is active by default", () => {
    render(<MainContent />);

    const previewTab = screen.getByRole("tab", { name: "Preview" });
    expect(previewTab.getAttribute("data-state")).toBe("active");

    const codeTab = screen.getByRole("tab", { name: "Code" });
    expect(codeTab.getAttribute("data-state")).toBe("inactive");
  });

  test("Code tab becomes active after clicking it", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    const codeTab = screen.getByRole("tab", { name: "Code" });
    await user.click(codeTab);

    expect(codeTab.getAttribute("data-state")).toBe("active");
    expect(screen.getByRole("tab", { name: "Preview" }).getAttribute("data-state")).toBe("inactive");
  });
});
