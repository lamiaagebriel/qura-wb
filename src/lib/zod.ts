// used for simplifying validations.
import * as zod from "zod";

const type = (title: string, type: string) => {
  return {
    // required_error: `${title} is required.`,
    // invalid_type_error: `${title} must be ${type}.`,
  };
};

const string = (title: string) => {
  return zod.string(type(title, "string"));
};

const stringRequired = (title: string) => {
  return zod.string(type(title, "string")).min(1, `${title} is required.`);
};

const number = (title: string) => {
  return zod.number(type(title, "number"));
};

const date = (title: string) => {
  return zod.date(type(title, "date"));
};

const boolean = (title: string) => {
  return zod.boolean(type(title, "boolean"));
};

// custom
const password = (title: string) => {
  return stringRequired(title)
    .min(6, "strong password can't be less than 6 characters.")
    .max(20, "ooh, 20 characters. make it less.");
};

export const z = {
  ...zod,
  type,
  string,
  stringRequired,
  boolean,
  date,
  number,

  // custom
  password,
};
