// auth reserved for future middleware use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function proxy(_req: Request) {
  // Currently no required auth for tools — all tools remain anonymous
  // Account page handles its own redirect, no global middleware needed
  return;
}
export const config = { matcher: [] };
