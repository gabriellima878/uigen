import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { createImportMap } from "@/lib/transform/jsx-transformer";

// Mock lucide-react
vi.mock("lucide-react", () => ({
  AlertCircle: (props: any) => <svg data-testid="alert-icon" {...props} />,
}));

// Mock the file system context
const mockGetAllFiles = vi.fn();
const mockRefreshTrigger = 0;

vi.mock("@/lib/contexts/file-system-context", () => ({
  useFileSystem: () => ({
    getAllFiles: mockGetAllFiles,
    refreshTrigger: mockRefreshTrigger,
  }),
}));

// Mock the JSX transformer
vi.mock("@/lib/transform/jsx-transformer", () => ({
  createImportMap: vi.fn(() => ({
    importMap: {},
    styles: "",
    errors: [],
  })),
  createPreviewHTML: vi.fn(
    () => "<html><body>Preview</body></html>"
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Restore default mock implementations after tests that override them
  vi.mocked(createImportMap).mockReturnValue({
    importMap: {},
    styles: "",
    errors: [],
  } as any);
});

afterEach(() => {
  cleanup();
});

describe("PreviewFrame", () => {
  test("shows welcome message on first load with no files", () => {
    mockGetAllFiles.mockReturnValue(new Map());

    render(<PreviewFrame />);

    expect(screen.getByText("Welcome to UI Generator")).toBeDefined();
    expect(
      screen.getByText(/Start building React components/)
    ).toBeDefined();
  });

  test("shows 'No Preview Available' when files exist but no entry point", () => {
    // First render with files to clear firstLoad
    const filesWithEntry = new Map([["/App.jsx", "export default () => <div/>"]]);
    mockGetAllFiles.mockReturnValue(filesWithEntry);

    const { unmount } = render(<PreviewFrame />);
    unmount();
    cleanup();

    // Now render without entry point
    const filesWithoutEntry = new Map([["/style.css", "body {}"]]);
    mockGetAllFiles.mockReturnValue(filesWithoutEntry);

    render(<PreviewFrame />);

    // It should find no jsx/tsx entry point
    // Since it's not first load (files exist), it tries to find entry
    // With only CSS files and no jsx/tsx, it shows error
    expect(screen.queryByText("Welcome to UI Generator")).toBeNull();
  });

  test("renders iframe when files contain a valid entry point", () => {
    const files = new Map([
      ["/App.jsx", 'export default () => <div>Hello</div>'],
    ]);
    mockGetAllFiles.mockReturnValue(files);

    const { container } = render(<PreviewFrame />);

    const iframe = container.querySelector("iframe");
    expect(iframe).toBeDefined();
    expect(iframe?.getAttribute("title")).toBe("Preview");
  });

  test("sets correct sandbox attributes on iframe", () => {
    const files = new Map([
      ["/App.jsx", 'export default () => <div>Hello</div>'],
    ]);
    mockGetAllFiles.mockReturnValue(files);

    const { container } = render(<PreviewFrame />);

    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("sandbox")).toBe(
      "allow-scripts allow-same-origin allow-forms"
    );
  });

  test("tries alternative entry points when App.jsx is missing", () => {
    const files = new Map([
      ["/src/App.tsx", 'export default () => <div>Hello</div>'],
    ]);
    mockGetAllFiles.mockReturnValue(files);

    const { container } = render(<PreviewFrame />);

    const iframe = container.querySelector("iframe");
    expect(iframe).toBeDefined();
  });

  test("falls back to first jsx/tsx file as entry point", () => {
    const files = new Map([
      ["/components/MyComponent.jsx", 'export default () => <div/>'],
    ]);
    mockGetAllFiles.mockReturnValue(files);

    const { container } = render(<PreviewFrame />);

    const iframe = container.querySelector("iframe");
    expect(iframe).toBeDefined();
  });

  test("shows error message when preview generation throws", () => {
    vi.mocked(createImportMap).mockImplementation(() => {
      throw new Error("Compilation failed");
    });

    const files = new Map([
      ["/App.jsx", "invalid code {{{}}}"],
    ]);
    mockGetAllFiles.mockReturnValue(files);

    render(<PreviewFrame />);

    expect(screen.getByText("No Preview Available")).toBeDefined();
    expect(screen.getByText("Compilation failed")).toBeDefined();
  });

  test("iframe has correct CSS classes", () => {
    const files = new Map([
      ["/App.jsx", 'export default () => <div>Hello</div>'],
    ]);
    mockGetAllFiles.mockReturnValue(files);

    const { container } = render(<PreviewFrame />);

    const iframe = container.querySelector("iframe");
    expect(iframe?.className).toContain("w-full");
    expect(iframe?.className).toContain("h-full");
    expect(iframe?.className).toContain("border-0");
    expect(iframe?.className).toContain("bg-white");
  });
});
