

# Fix All Security Vulnerabilities

## Summary

Six actionable fixes addressing the security scan findings, from highest to lowest severity.

---

## Step 1: Fix Realtime Data Leak on `user_roles`

**Problem**: The `user_roles` table is published to Supabase Realtime. Any authenticated user can subscribe and see role changes for ALL users.

**Fix**: Remove `user_roles` from the Realtime publication via a database migration:

```sql
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles;
```

Then update `useUserRole.tsx` to replace the Realtime subscription with a polling approach — refetch the role every 30 seconds using `setInterval`. This preserves the access-revocation detection while eliminating the data leak.

This also resolves the **"No Realtime channel authorization"** warning since `user_roles` was the only table on Realtime.

---

## Step 2: Ignore False-Positive Privilege Escalation Finding

**Problem**: The scanner flags a potential privilege escalation on `user_roles` INSERT, but the `WITH CHECK (has_role(auth.uid(), 'admin'))` policy correctly blocks non-admins. The `has_role()` function is `SECURITY DEFINER` and works as intended.

**Fix**: Use the security management tool to mark this finding as ignored with a clear justification — no code changes needed.

---

## Step 3: Ignore Edge Function JWT Finding

**Problem**: `send-invite` and `get-team-members` have `verify_jwt = false`. This is by design in Lovable Cloud (signing-keys system requires in-code validation), and both functions already validate the JWT manually in code.

**Fix**: Mark this finding as ignored — the current implementation is correct for the platform.

---

## Step 4: Enable Leaked Password Protection

**Problem**: The HIBP (Have I Been Pwned) password check is disabled.

**Fix**: Use the `configure_auth` tool to enable the leaked password protection setting. This checks passwords against known breaches during signup/login.

---

## Step 5: Wrap `console.error` Calls in Dev-Only Checks

**Problem**: ~15 `console.error` calls across client code expose implementation details in production.

**Fix**: Wrap all `console.error` calls in `import.meta.env.DEV` guards across these files:
- `src/hooks/useUserRole.tsx`
- `src/views/TeamManagement.tsx`
- `src/pages/Index.tsx`
- `src/services/persistence.ts`
- `src/pages/NotFound.tsx`

Pattern:
```typescript
if (import.meta.env.DEV) {
  console.error('Error details:', error);
}
```

---

## Step 6: Acknowledge `xlsx` Dependency Vulnerability

**Problem**: The `xlsx` (SheetJS) package has known prototype pollution and ReDoS vulnerabilities.

**Fix**: This cannot be trivially fixed — the entire data processing pipeline depends on `xlsx`. Mark this finding with increased remediation difficulty and a note that it's client-side only (no server-side exposure) and would require a significant migration to an alternative library.

---

## Technical Details

| Finding | Action | Risk After Fix |
|---|---|---|
| Realtime data leak | Remove from publication + poll | Eliminated |
| Privilege escalation | Ignore (false positive) | N/A |
| Edge function JWT | Ignore (by design) | N/A |
| Leaked password protection | Enable via auth config | Eliminated |
| Console error logging | Dev-only guards | Eliminated |
| xlsx vulnerability | Document + accept risk | Client-side only |

**Files modified**: `useUserRole.tsx`, `TeamManagement.tsx`, `Index.tsx`, `persistence.ts`, `NotFound.tsx`
**Database migration**: 1 (drop table from Realtime publication)
**Security findings updated**: 3 ignored, 1 difficulty-updated

