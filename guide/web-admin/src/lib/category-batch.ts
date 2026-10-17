import { serviceValues, type Service, type ServiceInput } from "./api.ts"

/** Which icons a refresh touches: only the empty ones, or every service's. */
export type IconScope = "missing" | "all"

/** The services a visibility change would actually alter. */
export function visibilityTargets(services: readonly Service[], isPublic: boolean): Service[] {
  return services.filter(service => service.public !== isPublic)
}

/** The services an icon refresh reads, in list order. */
export function iconTargets(services: readonly Service[], scope: IconScope): Service[] {
  return scope === "all" ? [...services] : services.filter(service => !service.icon?.trim())
}

/** A full PUT body for `service` with only the given fields changed. */
export function withChanges(service: Service, changes: Partial<ServiceInput>): ServiceInput {
  return { ...serviceValues(service), ...changes }
}
