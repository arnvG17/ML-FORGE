import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI!;

if (!uri) {
  throw new Error("Please add MONGODB_URI to .env.local");
}

interface MongoCache {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<{ client: MongoClient; db: Db }> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoCache: MongoCache | undefined;
}

const cache: MongoCache = global._mongoCache ?? {
  client: null,
  db: null,
  promise: null,
};

if (process.env.NODE_ENV === "development") {
  global._mongoCache = cache;
}

let _indexesEnsured = false;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cache.client && cache.db) {
    return { client: cache.client, db: cache.db };
  }

  if (!cache.promise) {
    cache.promise = MongoClient.connect(uri).then((client) => {
      const db = client.db("forge");
      return { client, db };
    });
  }

  const { client, db } = await cache.promise;
  cache.client = client;
  cache.db = db;

  if (!_indexesEnsured) {
    _indexesEnsured = true;
    // Lazy import to avoid circular dependency
    import("./session-db").then((m) => m.ensureIndexes()).catch(console.error);
  }

  return { client, db };
}

export async function getCollection(name: string) {
  const { db } = await connectToDatabase();
  return db.collection(name);
}
