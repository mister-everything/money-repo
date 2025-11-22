import { errorToString } from "@workspace/util";
import { NextResponse } from "next/server";

import { safeFail, safeOk } from "./interface";

export function nextOk(data: any) {
  return NextResponse.json(safeOk(data), {
    status: 200,
  });
}

export function nextFail(message: unknown, status: number = 500) {
  return NextResponse.json(safeFail(errorToString(message) as string), {
    status,
  });
}
