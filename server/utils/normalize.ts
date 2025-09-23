export function normalizeIds<T extends Record<string, any>>(
  doc: T,
): T & { company?: any; apprenticeship?: any } {
  const copy: any = { ...doc };
  if ("companyId" in copy && !copy.company) copy.company = copy.companyId;
  if ("apprenticeshipId" in copy && !copy.apprenticeship)
    copy.apprenticeship = copy.apprenticeshipId;
  return copy;
}
