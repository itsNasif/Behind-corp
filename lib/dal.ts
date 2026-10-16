import "server-only";
import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import { profiles, preferences, inquiries, auditRecords } from "./schema";
import { requireSession, requireAdmin, requireRecent, config } from "./auth";
import { fetchUserInfo } from "openid-client";
export async function ownProfile() {
  const s = await requireSession();
  const [p] = await db()
    .insert(profiles)
    .values({ issuer: s.issuer, subject: s.subject })
    .onConflictDoUpdate({
      target: [profiles.issuer, profiles.subject],
      set: { subject: s.subject },
    })
    .returning();
  return { s, p };
}
export async function ownData() {
  const { s, p } = await ownProfile();
  const identity = await fetchUserInfo(
    await config(),
    s.accessToken,
    s.subject,
  );
  const [preference] = await db()
    .select()
    .from(preferences)
    .where(eq(preferences.userId, p.id));
  return {
    name: String(identity.name ?? s.name),
    email: String(identity.email ?? s.email),
    createdAt: p.createdAt,
    preference: preference ?? { reducedMotion: false },
  };
}
export async function savePreferences(reducedMotion: boolean) {
  const { p } = await ownProfile();
  await db()
    .insert(preferences)
    .values({ userId: p.id, reducedMotion })
    .onConflictDoUpdate({
      target: preferences.userId,
      set: { reducedMotion, updatedAt: new Date() },
    });
}
export async function exportData() {
  const { s, p } = await ownProfile();
  requireRecent(s);
  const identity = await fetchUserInfo(
    await config(),
    s.accessToken,
    s.subject,
  );
  return {
    exportedAt: new Date().toISOString(),
    identity: {
      issuer: s.issuer,
      subject: s.subject,
      name: String(identity.name ?? s.name),
      email: String(identity.email ?? s.email),
    },
    profile: p,
    preferences: await db()
      .select()
      .from(preferences)
      .where(eq(preferences.userId, p.id)),
    inquiries: await db()
      .select({
        name: inquiries.name,
        email: inquiries.email,
        topic: inquiries.topic,
        message: inquiries.message,
        status: inquiries.status,
        createdAt: inquiries.createdAt,
      })
      .from(inquiries)
      .where(eq(inquiries.userId, p.id)),
  };
}
export async function deleteBusinessData() {
  const { s, p } = await ownProfile();
  requireRecent(s);
  await db().transaction(async (tx) => {
    await tx.delete(inquiries).where(eq(inquiries.userId, p.id));
    await tx
      .delete(profiles)
      .where(and(eq(profiles.id, p.id), eq(profiles.subject, s.subject)));
    await tx
      .insert(auditRecords)
      .values({ event: "account.business_data_deleted" });
  });
}
export async function listInquiries() {
  await requireAdmin();
  return db()
    .select()
    .from(inquiries)
    .orderBy(desc(inquiries.createdAt))
    .limit(100);
}
export async function updateInquiry(id: string, status: string) {
  await requireAdmin();
  const { p } = await ownProfile();
  return db().transaction(async (tx) => {
    const changed = await tx
      .update(inquiries)
      .set({ status, updatedAt: new Date() })
      .where(eq(inquiries.id, id))
      .returning({ id: inquiries.id });
    if (changed.length)
      await tx
        .insert(auditRecords)
        .values({ actorId: p.id, event: `inquiry.${status}` });
    return changed.length > 0;
  });
}
