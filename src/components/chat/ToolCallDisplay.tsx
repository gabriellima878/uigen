"use client";

import { type ToolInvocation } from "ai";
import { Loader2, FilePlus, Pencil, Eye, Undo2, FileEdit, Trash2 } from "lucide-react";

interface ToolCallDisplayProps {
  toolInvocation: ToolInvocation;
}

function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

function getToolMessage(toolInvocation: ToolInvocation): {
  label: string;
  icon: React.ElementType;
} {
  const { toolName, args } = toolInvocation;
  const fileName = args?.path ? getFileName(args.path) : "";

  if (toolName === "str_replace_editor") {
    switch (args?.command) {
      case "create":
        return { label: `Criando ${fileName}`, icon: FilePlus };
      case "str_replace":
        return { label: `Editando ${fileName}`, icon: Pencil };
      case "insert":
        return { label: `Editando ${fileName}`, icon: Pencil };
      case "view":
        return { label: `Lendo ${fileName}`, icon: Eye };
      case "undo_edit":
        return { label: `Desfazendo edição em ${fileName}`, icon: Undo2 };
    }
  }

  if (toolName === "file_manager") {
    switch (args?.command) {
      case "rename":
        return { label: `Renomeando ${fileName}`, icon: FileEdit };
      case "delete":
        return { label: `Removendo ${fileName}`, icon: Trash2 };
    }
  }

  return { label: toolName, icon: Pencil };
}

export function ToolCallDisplay({ toolInvocation }: ToolCallDisplayProps) {
  const isComplete = toolInvocation.state === "result" && "result" in toolInvocation;
  const { label, icon: Icon } = getToolMessage(toolInvocation);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <Icon className="w-3 h-3 text-neutral-500" />
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
