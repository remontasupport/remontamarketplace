// Where the worker adds and removes services: a tab in Account (user, 2026-10-16). Plain data, usable from server and
// client code alike.
export const MANAGE_SERVICES_HREF = "/dashboard/worker/account?tab=services";

/** The same, coming back to `returnUrl` (an app path) after Save. */
export const manageServicesHref = (returnUrl?: string) => (returnUrl ? `${MANAGE_SERVICES_HREF}&returnUrl=${encodeURIComponent(returnUrl)}` : MANAGE_SERVICES_HREF);
