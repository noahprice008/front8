import { createServerFn } from "@tanstack/react-start";

// The GA measurement ID is public by nature (it ships in the gtag script URL);
// it is stored as a server env var and handed to the browser here.
export const getAnalyticsId = createServerFn({ method: "GET" }).handler(async () => {
  const id = (process.env["GOOGLE_ANALYTICS_MEASUREMENT_ID"] ?? "").trim();
  return /^G-[A-Z0-9]+$/i.test(id) ? id : null;
});
