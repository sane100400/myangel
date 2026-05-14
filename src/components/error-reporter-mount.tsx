"use client";

import { useEffect } from "react";
import { installGlobalHandlers } from "@/lib/error-reporter";

export function ErrorReporterMount() {
  useEffect(() => {
    installGlobalHandlers();
  }, []);
  return null;
}
