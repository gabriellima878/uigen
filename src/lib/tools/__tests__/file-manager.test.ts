import { test, expect, describe, beforeEach } from "vitest";
import { VirtualFileSystem } from "@/lib/file-system";
import { buildFileManagerTool } from "@/lib/tools/file-manager";

describe("buildFileManagerTool", () => {
  let fs: VirtualFileSystem;
  let tool: ReturnType<typeof buildFileManagerTool>;

  beforeEach(() => {
    fs = new VirtualFileSystem();
    tool = buildFileManagerTool(fs);
  });

  test("has correct description", () => {
    expect(tool.description).toContain("Rename or delete");
  });

  describe("rename command", () => {
    test("renames a file successfully", async () => {
      fs.createFile("/old.txt", "content");

      const result = await tool.execute({
        command: "rename",
        path: "/old.txt",
        new_path: "/new.txt",
      });

      expect(result).toEqual({
        success: true,
        message: "Successfully renamed /old.txt to /new.txt",
      });
      expect(fs.exists("/old.txt")).toBe(false);
      expect(fs.exists("/new.txt")).toBe(true);
      expect(fs.readFile("/new.txt")).toBe("content");
    });

    test("moves a file to a different directory", async () => {
      fs.createFile("/file.txt", "content");
      fs.createDirectory("/docs");

      const result = await tool.execute({
        command: "rename",
        path: "/file.txt",
        new_path: "/docs/file.txt",
      });

      expect(result).toEqual({
        success: true,
        message: "Successfully renamed /file.txt to /docs/file.txt",
      });
      expect(fs.exists("/file.txt")).toBe(false);
      expect(fs.readFile("/docs/file.txt")).toBe("content");
    });

    test("creates parent directories when moving", async () => {
      fs.createFile("/file.txt", "content");

      const result = await tool.execute({
        command: "rename",
        path: "/file.txt",
        new_path: "/a/b/file.txt",
      });

      expect(result).toEqual({
        success: true,
        message: "Successfully renamed /file.txt to /a/b/file.txt",
      });
      expect(fs.exists("/a/b/file.txt")).toBe(true);
    });

    test("returns error when new_path is not provided", async () => {
      fs.createFile("/file.txt", "content");

      const result = await tool.execute({
        command: "rename",
        path: "/file.txt",
      });

      expect(result).toEqual({
        success: false,
        error: "new_path is required for rename command",
      });
      expect(fs.exists("/file.txt")).toBe(true);
    });

    test("returns error when source does not exist", async () => {
      const result = await tool.execute({
        command: "rename",
        path: "/nonexistent.txt",
        new_path: "/new.txt",
      });

      expect(result).toEqual({
        success: false,
        error: "Failed to rename /nonexistent.txt to /new.txt",
      });
    });

    test("returns error when destination already exists", async () => {
      fs.createFile("/source.txt", "source");
      fs.createFile("/dest.txt", "dest");

      const result = await tool.execute({
        command: "rename",
        path: "/source.txt",
        new_path: "/dest.txt",
      });

      expect(result).toEqual({
        success: false,
        error: "Failed to rename /source.txt to /dest.txt",
      });
      expect(fs.readFile("/source.txt")).toBe("source");
      expect(fs.readFile("/dest.txt")).toBe("dest");
    });

    test("renames a directory with contents", async () => {
      fs.createDirectory("/src");
      fs.createFile("/src/index.ts", "export {}");

      const result = await tool.execute({
        command: "rename",
        path: "/src",
        new_path: "/lib",
      });

      expect(result).toEqual({
        success: true,
        message: "Successfully renamed /src to /lib",
      });
      expect(fs.exists("/src")).toBe(false);
      expect(fs.exists("/lib")).toBe(true);
      expect(fs.readFile("/lib/index.ts")).toBe("export {}");
    });
  });

  describe("delete command", () => {
    test("deletes a file successfully", async () => {
      fs.createFile("/file.txt", "content");

      const result = await tool.execute({
        command: "delete",
        path: "/file.txt",
      });

      expect(result).toEqual({
        success: true,
        message: "Successfully deleted /file.txt",
      });
      expect(fs.exists("/file.txt")).toBe(false);
    });

    test("deletes a directory recursively", async () => {
      fs.createDirectory("/src");
      fs.createFile("/src/index.ts", "");
      fs.createDirectory("/src/utils");
      fs.createFile("/src/utils/helper.ts", "");

      const result = await tool.execute({
        command: "delete",
        path: "/src",
      });

      expect(result).toEqual({
        success: true,
        message: "Successfully deleted /src",
      });
      expect(fs.exists("/src")).toBe(false);
      expect(fs.exists("/src/index.ts")).toBe(false);
      expect(fs.exists("/src/utils")).toBe(false);
    });

    test("returns error when file does not exist", async () => {
      const result = await tool.execute({
        command: "delete",
        path: "/nonexistent.txt",
      });

      expect(result).toEqual({
        success: false,
        error: "Failed to delete /nonexistent.txt",
      });
    });

    test("returns error when trying to delete root", async () => {
      const result = await tool.execute({
        command: "delete",
        path: "/",
      });

      expect(result).toEqual({
        success: false,
        error: "Failed to delete /",
      });
    });
  });
});
