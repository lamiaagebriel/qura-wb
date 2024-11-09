import crypto from "crypto";

export const ID = {
	generate: (props: { len?: number } | void) =>
		crypto.randomBytes(props?.["len"] ?? 16).toString("hex"),
};
