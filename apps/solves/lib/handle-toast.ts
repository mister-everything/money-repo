"use client";

import { errorToString } from "@workspace/util";
import { toast } from "sonner";

export const handleErrorToast = (error: unknown) =>
  toast.error(errorToString(error));
