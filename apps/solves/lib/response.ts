export type ErrorResponse = {
  message: string;
  success: false;
  $ref: "solves-message";
};

export type SuccessMessageResponse = {
  message: string;
  success: true;
  $ref: "solves-message";
};

export const errorResponse = (message: string): ErrorResponse => ({
  message,
  success: false,
  $ref: "solves-message",
});

export const successMessageResponse = (
  message: string,
): SuccessMessageResponse => ({
  message,
  success: true,
  $ref: "solves-message",
});

export const isSolvesApiResponseMessage = (
  data: unknown,
): data is ErrorResponse | SuccessMessageResponse => {
  return (
    typeof data === "object" &&
    data !== null &&
    "$ref" in data &&
    data.$ref === "solves-message"
  );
};
