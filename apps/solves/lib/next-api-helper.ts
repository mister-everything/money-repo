import { errorToString } from "@workspace/util";
import { NextResponse } from "next/server";

export function ok(data: any) {
  return NextResponse.json(data, {
    status: 200,
  });
}

export type Fail = {
  message?: string;
};
export function fail(message: unknown, status: number = 500) {
  return NextResponse.json(
    {
      message: errorToString(message),
    },
    {
      status,
    },
  );
}
