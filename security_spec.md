# Security Specification — Traço

## 1. Data Invariants
1. Every `UserProfile` at `/users/{userId}` can only be read, created, or updated by the verified authenticated user whose `request.auth.uid == userId`.
2. Every `CodeSnippet` at `/users/{userId}/snippets/{snippetId}` belongs strictly to `{userId}` (`ownerId == userId == request.auth.uid`), and can only exist when the parent `/users/{userId}` profile exists.
3. No unauthenticated or unverified user (`email_verified != true`) may read or write any user profile or snippet document.
4. `uid`, `ownerId`, `id`, and `createdAt` are immutable after creation; `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
5. All string fields enforce strict `.size()` limits matching `firebase-blueprint.json`, and all IDs match `^[a-zA-Z0-9_\-]+$`.
6. No blanket `allow read: if isSignedIn();` rules exist; `allow list` on snippets explicitly enforces `resource.data.ownerId == request.auth.uid`.

## 2. "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated read**: `GET /users/userA/snippets/snip1` with `auth = null`.
2. **Unverified email write**: `CREATE /users/userA/snippets/snip1` with `auth.token.email_verified = false`.
3. **Cross-user read (PII leak)**: `GET /users/userB` as `userA`.
4. **Cross-user snippet list**: `LIST /users/userB/snippets` as `userA`.
5. **Identity spoofing on create**: `CREATE /users/userA/snippets/snip1` with `{ ownerId: "userB", ... }`.
6. **Document ID poisoning**: `CREATE /users/userA/snippets/bad$id!@#` with invalid characters.
7. **Shadow / Ghost field injection**: `CREATE /users/userA` with `{ ..., isAdmin: true }`.
8. **Immutable field mutation**: `UPDATE /users/userA/snippets/snip1` modifying `ownerId` or `createdAt`.
9. **Client timestamp forgery**: `CREATE /users/userA/snippets/snip1` with `createdAt = clientPastTime != request.time`.
10. **Payload exhaustion (Denial of Wallet)**: `CREATE /users/userA/snippets/snip1` with `html.size() > 200000`.
11. **Empty title bypass**: `UPDATE /users/userA/snippets/snip1` with `title: ""`.
12. **Orphan snippet write**: `CREATE /users/userA/snippets/snip1` when `/users/userA` does not exist.
