import { test, expect, describe, beforeEach } from "vitest";
import { VirtualFileSystem } from "@/lib/file-system";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";

describe("buildStrReplaceTool", () => {
  let fs: VirtualFileSystem;
  let tool: ReturnType<typeof buildStrReplaceTool>;

  beforeEach(() => {
    fs = new VirtualFileSystem();
    tool = buildStrReplaceTool(fs);
  });

  test("returns a tool with correct id and parameters", () => {
    expect(tool.id).toBe("str_replace_editor");
    expect(tool.parameters).toBeDefined();
  });

  describe("view command", () => {
    test("views file content with line numbers", async () => {
      fs.createFile("/test.txt", "line1\nline2\nline3");

      const result = await tool.execute({
        command: "view",
        path: "/test.txt",
      });

      expect(result).toBe("1\tline1\n2\tline2\n3\tline3");
    });

    test("views file with range", async () => {
      fs.createFile("/test.txt", "line1\nline2\nline3\nline4\nline5");

      const result = await tool.execute({
        command: "view",
        path: "/test.txt",
        view_range: [2, 4],
      });

      expect(result).toBe("2\tline2\n3\tline3\n4\tline4");
    });

    test("views directory contents", async () => {
      fs.createDirectory("/src");
      fs.createFile("/src/index.ts", "");

      const result = await tool.execute({
        command: "view",
        path: "/src",
      });

      expect(result).toContain("[FILE] index.ts");
    });

    test("returns error for non-existent file", async () => {
      const result = await tool.execute({
        command: "view",
        path: "/missing.txt",
      });

      expect(result).toBe("File not found: /missing.txt");
    });
  });

  describe("create command", () => {
    test("creates a new file with content", async () => {
      const result = await tool.execute({
        command: "create",
        path: "/new.txt",
        file_text: "hello world",
      });

      expect(result).toBe("File created: /new.txt");
      expect(fs.readFile("/new.txt")).toBe("hello world");
    });

    test("creates a file with empty content when file_text is omitted", async () => {
      const result = await tool.execute({
        command: "create",
        path: "/empty.txt",
      });

      expect(result).toBe("File created: /empty.txt");
      expect(fs.readFile("/empty.txt")).toBe("");
    });

    test("creates parent directories automatically", async () => {
      const result = await tool.execute({
        command: "create",
        path: "/a/b/c.txt",
        file_text: "nested",
      });

      expect(result).toBe("File created: /a/b/c.txt");
      expect(fs.exists("/a")).toBe(true);
      expect(fs.exists("/a/b")).toBe(true);
      expect(fs.readFile("/a/b/c.txt")).toBe("nested");
    });

    test("returns error when file already exists", async () => {
      fs.createFile("/exists.txt", "original");

      const result = await tool.execute({
        command: "create",
        path: "/exists.txt",
        file_text: "overwrite",
      });

      expect(result).toContain("Error");
      expect(fs.readFile("/exists.txt")).toBe("original");
    });
  });

  describe("str_replace command", () => {
    test("replaces a string in a file", async () => {
      fs.createFile("/test.txt", "hello world");

      const result = await tool.execute({
        command: "str_replace",
        path: "/test.txt",
        old_str: "world",
        new_str: "vitest",
      });

      expect(result).toContain("Replaced");
      expect(fs.readFile("/test.txt")).toBe("hello vitest");
    });

    test("replaces all occurrences", async () => {
      fs.createFile("/test.txt", "foo bar foo baz foo");

      const result = await tool.execute({
        command: "str_replace",
        path: "/test.txt",
        old_str: "foo",
        new_str: "qux",
      });

      expect(result).toContain("3 occurrence(s)");
      expect(fs.readFile("/test.txt")).toBe("qux bar qux baz qux");
    });

    test("handles missing old_str gracefully", async () => {
      fs.createFile("/test.txt", "content");

      const result = await tool.execute({
        command: "str_replace",
        path: "/test.txt",
        new_str: "replacement",
      });

      expect(result).toContain("Error");
    });

    test("returns error for non-existent file", async () => {
      const result = await tool.execute({
        command: "str_replace",
        path: "/missing.txt",
        old_str: "a",
        new_str: "b",
      });

      expect(result).toContain("Error");
    });

    test("returns error when old_str is not found", async () => {
      fs.createFile("/test.txt", "hello world");

      const result = await tool.execute({
        command: "str_replace",
        path: "/test.txt",
        old_str: "notfound",
        new_str: "replacement",
      });

      expect(result).toContain("Error");
    });
  });

  describe("insert command", () => {
    test("inserts text at a specific line", async () => {
      fs.createFile("/test.txt", "line1\nline2\nline3");

      const result = await tool.execute({
        command: "insert",
        path: "/test.txt",
        insert_line: 1,
        new_str: "inserted",
      });

      expect(result).toContain("inserted at line 1");
      expect(fs.readFile("/test.txt")).toBe("line1\ninserted\nline2\nline3");
    });

    test("inserts at beginning of file", async () => {
      fs.createFile("/test.txt", "line1\nline2");

      const result = await tool.execute({
        command: "insert",
        path: "/test.txt",
        insert_line: 0,
        new_str: "first",
      });

      expect(result).toContain("inserted at line 0");
      expect(fs.readFile("/test.txt")).toBe("first\nline1\nline2");
    });

    test("inserts empty string when new_str is omitted", async () => {
      fs.createFile("/test.txt", "line1\nline2");

      const result = await tool.execute({
        command: "insert",
        path: "/test.txt",
        insert_line: 1,
      });

      expect(result).toContain("inserted at line 1");
      expect(fs.readFile("/test.txt")).toBe("line1\n\nline2");
    });

    test("returns error for invalid line number", async () => {
      fs.createFile("/test.txt", "line1\nline2");

      const result = await tool.execute({
        command: "insert",
        path: "/test.txt",
        insert_line: 99,
        new_str: "text",
      });

      expect(result).toContain("Error");
    });

    test("returns error for non-existent file", async () => {
      const result = await tool.execute({
        command: "insert",
        path: "/missing.txt",
        insert_line: 0,
        new_str: "text",
      });

      expect(result).toContain("Error");
    });
  });

  describe("undo_edit command", () => {
    test("returns unsupported error", async () => {
      const result = await tool.execute({
        command: "undo_edit",
        path: "/test.txt",
      });

      expect(result).toContain("not supported");
      expect(result).toContain("str_replace");
    });
  });
});
