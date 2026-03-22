import { test, expect, describe, beforeEach, vi } from "vitest";
import {
  setHasAnonWork,
  getHasAnonWork,
  getAnonWorkData,
  clearAnonWork,
} from "@/lib/anon-work-tracker";

describe("anon-work-tracker", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("setHasAnonWork", () => {
    test("stores data when messages exist", () => {
      const messages = [{ role: "user", content: "hello" }];
      const fileSystemData = { "/": {} };

      setHasAnonWork(messages, fileSystemData);

      expect(sessionStorage.getItem("uigen_has_anon_work")).toBe("true");
      expect(sessionStorage.getItem("uigen_anon_data")).toBeTruthy();
    });

    test("stores data when file system has more than root", () => {
      const messages: any[] = [];
      const fileSystemData = { "/": {}, "/App.jsx": { content: "code" } };

      setHasAnonWork(messages, fileSystemData);

      expect(sessionStorage.getItem("uigen_has_anon_work")).toBe("true");
    });

    test("does not store data when messages are empty and only root exists", () => {
      const messages: any[] = [];
      const fileSystemData = { "/": {} };

      setHasAnonWork(messages, fileSystemData);

      expect(sessionStorage.getItem("uigen_has_anon_work")).toBeNull();
      expect(sessionStorage.getItem("uigen_anon_data")).toBeNull();
    });

    test("serializes messages and file system data as JSON", () => {
      const messages = [{ id: "1", role: "user", content: "test" }];
      const fileSystemData = { "/App.jsx": "code", "/": {} };

      setHasAnonWork(messages, fileSystemData);

      const stored = JSON.parse(
        sessionStorage.getItem("uigen_anon_data") || ""
      );
      expect(stored.messages).toEqual(messages);
      expect(stored.fileSystemData).toEqual(fileSystemData);
    });
  });

  describe("getHasAnonWork", () => {
    test("returns false when no work is stored", () => {
      expect(getHasAnonWork()).toBe(false);
    });

    test("returns true when work has been stored", () => {
      sessionStorage.setItem("uigen_has_anon_work", "true");

      expect(getHasAnonWork()).toBe(true);
    });

    test("returns false when storage value is not 'true'", () => {
      sessionStorage.setItem("uigen_has_anon_work", "false");

      expect(getHasAnonWork()).toBe(false);
    });
  });

  describe("getAnonWorkData", () => {
    test("returns null when no data is stored", () => {
      expect(getAnonWorkData()).toBeNull();
    });

    test("returns parsed data when stored", () => {
      const data = {
        messages: [{ role: "user", content: "hello" }],
        fileSystemData: { "/App.jsx": "code" },
      };
      sessionStorage.setItem("uigen_anon_data", JSON.stringify(data));

      const result = getAnonWorkData();

      expect(result).toEqual(data);
    });

    test("returns null when stored data is invalid JSON", () => {
      sessionStorage.setItem("uigen_anon_data", "not valid json{{{");

      expect(getAnonWorkData()).toBeNull();
    });
  });

  describe("clearAnonWork", () => {
    test("removes all stored data", () => {
      sessionStorage.setItem("uigen_has_anon_work", "true");
      sessionStorage.setItem("uigen_anon_data", '{"messages":[]}');

      clearAnonWork();

      expect(sessionStorage.getItem("uigen_has_anon_work")).toBeNull();
      expect(sessionStorage.getItem("uigen_anon_data")).toBeNull();
    });

    test("does not throw when nothing is stored", () => {
      expect(() => clearAnonWork()).not.toThrow();
    });
  });
});
