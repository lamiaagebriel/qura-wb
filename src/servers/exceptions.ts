import * as z from "zod";

// on server actions, use error
export class ZodError extends Error {
  constructor(errors: z.ZodError<any>) {
    super(errors?.["issues"]?.pop()?.["message"]);
  }
}

export class RequiresLoginError extends Error {
  constructor(message = "this action needs you to be logged in.") {
    super(message);
  }
}

export class RequiresAccessError extends Error {
  constructor(message = "you don't have access to do this action") {
    super(message);
  }
}
