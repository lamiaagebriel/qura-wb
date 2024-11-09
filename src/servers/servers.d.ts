class ZodError extends Error {
	constructor(errors: z.ZodError<any>) {
		super(errors?.["issues"]?.pop()?.["message"]);
	}
}
