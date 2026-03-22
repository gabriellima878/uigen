import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallDisplay } from "../ToolCallDisplay";

afterEach(() => {
  cleanup();
});

test("shows 'Criando' message for str_replace_editor create command", () => {
  render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/components/App.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Criando App.tsx")).toBeDefined();
});

test("shows 'Editando' message for str_replace_editor str_replace command", () => {
  render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "2",
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/components/Button.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Editando Button.tsx")).toBeDefined();
});

test("shows 'Editando' message for str_replace_editor insert command", () => {
  render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "3",
        toolName: "str_replace_editor",
        args: { command: "insert", path: "/lib/utils.ts" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Editando utils.ts")).toBeDefined();
});

test("shows 'Lendo' message for str_replace_editor view command", () => {
  render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "4",
        toolName: "str_replace_editor",
        args: { command: "view", path: "/components/Card.tsx" },
        state: "result",
        result: "file content",
      }}
    />
  );

  expect(screen.getByText("Lendo Card.tsx")).toBeDefined();
});

test("shows 'Desfazendo' message for str_replace_editor undo_edit command", () => {
  render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "5",
        toolName: "str_replace_editor",
        args: { command: "undo_edit", path: "/components/Form.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Desfazendo edição em Form.tsx")).toBeDefined();
});

test("shows 'Renomeando' message for file_manager rename command", () => {
  render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "6",
        toolName: "file_manager",
        args: { command: "rename", path: "/old-name.tsx", new_path: "/new-name.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Renomeando old-name.tsx")).toBeDefined();
});

test("shows 'Removendo' message for file_manager delete command", () => {
  render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "7",
        toolName: "file_manager",
        args: { command: "delete", path: "/components/Unused.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Removendo Unused.tsx")).toBeDefined();
});

test("shows toolName as fallback for unknown tools", () => {
  render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "8",
        toolName: "unknown_tool",
        args: {},
        state: "result",
        result: "done",
      }}
    />
  );

  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("shows spinner when tool call is in progress", () => {
  const { container } = render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "9",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/components/Loading.tsx" },
        state: "call",
      }}
    />
  );

  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot when tool call is complete", () => {
  const { container } = render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "10",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/components/Done.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("extracts filename from deep path", () => {
  render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "11",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/src/components/ui/deep/Button.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Criando Button.tsx")).toBeDefined();
});
