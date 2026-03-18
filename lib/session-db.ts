import { getCollection } from "./mongodb";
import type { OutputControl } from "@/types";
import { nanoid } from "nanoid";

export type Visibility = "private" | "link" | "public";

export interface ForgeSession {
  _id?: any;
  sessionId: string;
  shareToken: string;
  userId: string;
  name: string;
  intent: string;
  executionMode: "browser" | "server";
  visibility: Visibility;
  forkOf?: string;
  forkCount: number;
  rating: number;
  ratingCount: number;
  likes?: string[];
  creatorName?: string;
  creatorImage?: string;
  sessionMode: "playground" | "compiler";

  currentCode: {
    full: string;
    extractedML: string;
    version: number;
  };

  controls: OutputControl[];
  currentParams: Record<string, any>;
  lastMetrics: Record<string, number | string>;

  codeVersions: Array<{
    version: number;
    fullCode: string;
    extractedML: string;
    changeDescription: string;
    createdAt: Date;
  }>;

  conversation: Array<{
    role: "user" | "agent";
    content: string;
    codeVersion: number;
    createdAt: Date;
  }>;

  llmContext?: Array<{
    role: "user" | "assistant";
    content: string;
    createdAt?: Date;
  }>;

  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt: Date;
}

// Re-export getCollection for use in API routes
export { getCollection };

export async function ensureIndexes(): Promise<void> {
  const col = await getCollection("sessions");
  await Promise.all([
    col.createIndex({ sessionId: 1 }, { unique: true }),
    col.createIndex({ shareToken: 1 }, { unique: true }),
    col.createIndex({ userId: 1 }),
    col.createIndex({ visibility: 1, rating: -1 }),
    col.createIndex({ name: "text", intent: "text" }),
  ]);

  const commentCol = await getCollection("comments");
  await commentCol.createIndex({ sessionId: 1 });
  await commentCol.createIndex({ createdAt: -1 });
}

export async function createSession(
  data: Pick<ForgeSession, "userId" | "intent" | "executionMode"> &
    Partial<ForgeSession>
): Promise<{ sessionId: string; shareToken: string }> {
  const col = await getCollection("sessions");
  const sessionId = nanoid(16);
  const shareToken = nanoid(12);
  const now = new Date();
  const doc: ForgeSession = {
    sessionId,
    shareToken,
    userId: data.userId,
    name: data.name || (data.intent ? data.intent.slice(0, 60) : "Untitled"),
    intent: data.intent || "",
    executionMode: data.executionMode || "browser",
    visibility: "private",
    forkCount: 0,
    rating: 0,
    ratingCount: 0,
    currentCode: data.currentCode || { full: "", extractedML: "", version: 1 },
    controls: data.controls || [],
    currentParams: data.currentParams || {},
    lastMetrics: data.lastMetrics || {},
    sessionMode: data.sessionMode || "playground",
    creatorName: data.creatorName,
    creatorImage: data.creatorImage,
    codeVersions: data.codeVersions || [],
    conversation: data.conversation || [],
    llmContext: data.llmContext || [],
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };
  await col.insertOne(doc as any);
  return { sessionId, shareToken };
}

export async function updateSession(
  sessionId: string,
  userId: string,
  update: {
    $set?: Partial<ForgeSession>;
    $push?: Record<string, any>;
  }
): Promise<void> {
  const col = await getCollection("sessions");

  // Verify ownership
  const existing = await col.findOne({ sessionId });
  if (!existing || existing.userId !== userId) {
    throw new Error("Session not found or access denied");
  }

  const mongoUpdate: Record<string, any> = {};

  // Build $set — always include updatedAt, strip protected fields
  const setFields: any = { updatedAt: new Date(), ...(update.$set || {}) };
  delete setFields.userId;
  delete setFields.sessionId;
  delete setFields._id;
  mongoUpdate.$set = setFields;

  // Build $push if present
  if (update.$push && Object.keys(update.$push).length > 0) {
    mongoUpdate.$push = {};
    for (const [key, val] of Object.entries(update.$push)) {
      if (Array.isArray(val)) {
        mongoUpdate.$push[key] = { $each: val };
      } else {
        mongoUpdate.$push[key] = val;
      }
    }
  }

  await col.updateOne({ sessionId }, mongoUpdate);
}

export async function loadSessionById(
  sessionId: string,
  userId: string
): Promise<ForgeSession | null> {
  const col = await getCollection("sessions");
  const doc = await col.findOne({ sessionId });
  if (!doc) return null;
  if (doc.userId !== userId) return null;

  await col.updateOne({ sessionId }, { $set: { lastOpenedAt: new Date() } });
  return doc as unknown as ForgeSession;
}

export async function loadSessionByShareToken(
  shareToken: string,
  includeLLMContext: boolean = true
): Promise<ForgeSession | null> {
  const col = await getCollection("sessions");
  const projection: any = {
    visibility: 1,
    userId: 1,
    sessionId: 1,
    shareToken: 1,
    name: 1,
    intent: 1,
    executionMode: 1,
    forkOf: 1,
    forkCount: 1,
    rating: 1,
    ratingCount: 1,
    currentCode: 1,
    controls: 1,
    currentParams: 1,
    lastMetrics: 1,
    codeVersions: 1,
    conversation: 1,
    createdAt: 1,
    updatedAt: 1,
    lastOpenedAt: 1,
  };

  if (!includeLLMContext) {
    projection.llmContext = 0;
  }

  const doc = await col.findOne(
    {
      shareToken,
      visibility: { $ne: "private" },
    },
    { projection }
  );
  if (!doc) return null;
  // Strip userId from returned doc
  const { userId: _u, ...publicDoc } = doc;
  return publicDoc as unknown as ForgeSession;
}

export async function listUserSessions(
  userId: string
): Promise<Partial<ForgeSession>[]> {
  const col = await getCollection("sessions");
  const docs = await col
    .find(
      { userId },
      {
        projection: {
          sessionId: 1,
          shareToken: 1,
          name: 1,
          visibility: 1,
          lastMetrics: 1,
          "currentCode.version": 1,
          updatedAt: 1,
          lastOpenedAt: 1,
          intent: 1,
          likes: 1,
          sessionMode: 1,
        },
      }
    )
    .sort({ lastOpenedAt: -1 })
    .limit(100)
    .toArray();
  return docs as unknown as Partial<ForgeSession>[];
}

export interface SessionComment {
  _id?: any;
  sessionId: string;
  userId: string;
  userName: string;
  userImage: string;
  text: string;
  createdAt: Date;
}

export async function toggleLike(
  sessionId: string,
  userId: string
): Promise<{ likes: string[]; liked: boolean }> {
  const col = await getCollection("sessions");
  const session = await col.findOne({ sessionId });
  if (!session) throw new Error("Session not found");

  const likes = (session.likes || []) as string[];
  const liked = likes.includes(userId);

  if (liked) {
    await col.updateOne({ sessionId }, { $pull: { likes: userId } as any });
  } else {
    await col.updateOne({ sessionId }, { $addToSet: { likes: userId } as any });
  }

  const updated = await col.findOne({ sessionId });
  return { likes: updated?.likes || [], liked: !liked };
}

export async function addComment(
  sessionId: string,
  userId: string,
  userName: string,
  userImage: string,
  text: string
): Promise<SessionComment> {
  const col = await getCollection("comments");
  const comment: SessionComment = {
    sessionId,
    userId,
    userName,
    userImage,
    text,
    createdAt: new Date(),
  };
  const result = await col.insertOne(comment as any);
  return { ...comment, _id: result.insertedId };
}

export async function getComments(sessionId: string): Promise<SessionComment[]> {
  const col = await getCollection("comments");
  return (await col
    .find({ sessionId })
    .sort({ createdAt: -1 })
    .toArray()) as unknown as SessionComment[];
}

export async function setVisibility(
  sessionId: string,
  userId: string,
  visibility: Visibility
): Promise<{ shareToken: string }> {
  const col = await getCollection("sessions");
  const existing = await col.findOne({ sessionId, userId });
  if (!existing) throw new Error("Session not found or access denied");

  let shareToken = existing.shareToken as string;

  if (visibility === "private") {
    // Revoking: regenerate shareToken to invalidate old share URLs
    shareToken = nanoid(12);
  } else if (!shareToken) {
    // Going public/link for the first time without a token
    shareToken = nanoid(12);
  }

  await col.updateOne(
    { sessionId },
    { $set: { visibility, shareToken, updatedAt: new Date() } }
  );
  return { shareToken };
}

export async function forkSession(
  shareToken: string,
  newUserId: string
): Promise<string> {
  const col = await getCollection("sessions");
  const original = await col.findOne({
    shareToken,
    visibility: { $ne: "private" },
  });
  if (!original) throw new Error("Session not found or is private");

  const now = new Date();
  const newSessionId = nanoid(16);
  const newShareToken = nanoid(12);
  const fork = {
    ...original,
    _id: undefined,
    sessionId: newSessionId,
    shareToken: newShareToken,
    userId: newUserId,
    visibility: "private" as const,
    forkOf: shareToken,
    forkCount: 0,
    rating: 0,
    ratingCount: 0,
    codeVersions: original.currentCode
      ? [
          {
            version: 1,
            fullCode: original.currentCode.full,
            extractedML: original.currentCode.extractedML,
            changeDescription: "Forked",
            createdAt: now,
          },
        ]
      : [],
    conversation: [],
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };
  delete (fork as any)._id;
  await col.insertOne(fork);
  await col.updateOne({ shareToken }, { $inc: { forkCount: 1 } });
  return newSessionId;
}

export async function rateSession(
  shareToken: string,
  rating: number
): Promise<{ newRating: number; ratingCount: number }> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be an integer between 1 and 5");
  }
  const col = await getCollection("sessions");
  const doc = await col.findOne({ shareToken, visibility: "public" });
  if (!doc) throw new Error("Session not found or not public");

  const oldRating: number = doc.rating || 0;
  const oldCount: number = doc.ratingCount || 0;
  const newCount = oldCount + 1;
  const newRating = Math.round(((oldRating * oldCount + rating) / newCount) * 100) / 100;

  await col.updateOne(
    { shareToken },
    { $set: { rating: newRating, ratingCount: newCount } }
  );
  return { newRating, ratingCount: newCount };
}

export async function getPublicGallery(): Promise<Partial<ForgeSession>[]> {
  const col = await getCollection("sessions");
  const docs = await col
    .find(
      { visibility: "public" },
      {
        projection: {
          sessionId: 1,
          shareToken: 1,
          name: 1,
          intent: 1,
          lastMetrics: 1,
          forkCount: 1,
          rating: 1,
          ratingCount: 1,
          updatedAt: 1,
          likes: 1,
          creatorName: 1,
          creatorImage: 1,
          sessionMode: 1,
        },
      }
    )
    .sort({ rating: -1, forkCount: -1 })
    .limit(20)
    .toArray();
  return docs as unknown as Partial<ForgeSession>[];
}

export async function searchPublicSessions(
  query: string
): Promise<Partial<ForgeSession>[]> {
  const col = await getCollection("sessions");
  const filter: any = { visibility: "public" };
  if (query) {
    filter.$text = { $search: query };
  }
  const docs = await col
    .find(filter, {
      projection: {
        sessionId: 1,
        shareToken: 1,
        name: 1,
        intent: 1,
        lastMetrics: 1,
        forkCount: 1,
        rating: 1,
        ratingCount: 1,
        updatedAt: 1,
        likes: 1,
        creatorName: 1,
        creatorImage: 1,
        sessionMode: 1,
      },
    })
    .sort({ rating: -1, forkCount: -1 })
    .limit(20)
    .toArray();
  return docs as unknown as Partial<ForgeSession>[];
}
