import { errorToString } from "@workspace/util";
import { NextResponse } from "next/server";

export function nextOk(data: any) {
  return NextResponse.json(data, {
    status: 200,
  });
}

export type Fail = {
  message?: string;
};
export function nextFail(message: unknown, status: number = 500) {
  return NextResponse.json(
    {
      message: errorToString(message),
    },
    {
      status,
    },
  );
}
