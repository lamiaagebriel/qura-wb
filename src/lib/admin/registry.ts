import "server-only";

import type { Resource } from "./resource";
import { businessesResource, branchesResource } from "./resources/businesses";
import { followsResource, postsResource, reviewsResource, savesResource, votesResource } from "./resources/content";
import { placeAdminsResource, placesResource, placeTypesResource } from "./resources/places";
import {
  accountsResource,
  historyResource,
  rateLimitsResource,
  sessionsResource,
  verificationsResource,
} from "./resources/system";
import { ticketsResource } from "./resources/tickets";
import { usersResource } from "./resources/users";

/** Every table the dashboard shows, by its URL name (`/admin/<key>`). */
export const RESOURCES: Record<string, Resource> = Object.fromEntries(
  [
    usersResource,
    businessesResource,
    branchesResource,
    postsResource,
    reviewsResource,
    followsResource,
    votesResource,
    savesResource,
    placesResource,
    placeTypesResource,
    placeAdminsResource,
    ticketsResource,
    historyResource,
    sessionsResource,
    accountsResource,
    verificationsResource,
    rateLimitsResource,
  ].map((resource) => [resource.key, resource]),
);

export const resourceOf = (key: string): Resource | undefined =>
  Object.hasOwn(RESOURCES, key) ? RESOURCES[key] : undefined;
