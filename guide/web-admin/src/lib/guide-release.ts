import { api, behind } from "./api.ts"

/**
 * Guide's own releases. The panel never updates the hub itself: it links to
 * the release notes and shows the command, and the operator runs it on the
 * server once they have read what changed.
 */
export const RELEASES_PAGE = "https://github.com/NSJLUCAS/Guide/releases"
export const UPDATE_COMMAND = "sudo guide-update"
export const CHECK_COMMAND = "sudo guide-update --check"

/** `latest` is empty when the hub could not reach GitHub. */
export type GuideRelease = { current: string; latest: string }

export function releaseNotesUrl(version: string): string {
  return /^\d+(\.\d+)*$/.test(version) ? `${RELEASES_PAGE}/tag/v${version}` : RELEASES_PAGE
}

export function hasUpdate(release: GuideRelease | null): boolean {
  return !!release && behind(release.current, release.latest)
}

export async function loadGuideRelease(): Promise<GuideRelease> {
  const value = await api<Partial<GuideRelease>>("/guide-release")
  return { current: String(value.current ?? ""), latest: String(value.latest ?? "") }
}
