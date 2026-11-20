// Replying to a post: checked by the reply sheet and again by
// `replyToPost`. Client-safe.

import { z } from "zod";

import { body } from "./post-form";

export const replySchema = z.object({ body });

export type ReplyFormValues = z.infer<typeof replySchema>;
