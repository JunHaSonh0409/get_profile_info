/** An expected failure whose message is safe to show the user, with its HTTP status (4xx). */
export class FlowError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}
