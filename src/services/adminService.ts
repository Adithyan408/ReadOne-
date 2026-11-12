import {
  collection,
  getDoc,
  getDocs,
  doc,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export interface AdminUser {
  uid: string;
  displayName: string;
  email: string;
  status: "active" | "blocked";
  role?: string;
  createdAt?: string | null;
  blogsCount?: number;
}

const LOCAL_STATUS_KEY = "admin_user_statuses";

// Initial demo users to guarantee a rich table even if fresh Firestore
const SEED_USERS: AdminUser[] = [
  {
    uid: "seed_u1",
    displayName: "Alexander Wright",
    email: "alexander.wright@techpulse.io",
    status: "active",
    role: "Senior Contributor",
    createdAt: "2026-10-15T08:30:00Z",
    blogsCount: 5,
  },
  {
    uid: "seed_u2",
    displayName: "Sophia Martinez",
    email: "sophia.martinez@creativehub.com",
    status: "active",
    role: "Author",
    createdAt: "2026-10-22T11:45:00Z",
    blogsCount: 3,
  },
  {
    uid: "seed_u3",
    displayName: "Liam Chen",
    email: "liam.chen@devjourney.org",
    status: "blocked",
    role: "Member",
    createdAt: "2026-09-18T14:20:00Z",
    blogsCount: 1,
  },
  {
    uid: "seed_u4",
    displayName: "Emma Watson",
    email: "emma.watson@storywriters.net",
    status: "active",
    role: "Author",
    createdAt: "2026-11-01T09:15:00Z",
    blogsCount: 4,
  },
  {
    uid: "seed_u5",
    displayName: "Marcus Johnson",
    email: "marcus.j@webarchitects.io",
    status: "blocked",
    role: "Member",
    createdAt: "2026-08-30T16:50:00Z",
    blogsCount: 0,
  },
];

const getLocalStatusMap = (): Record<string, "active" | "blocked"> => {
  try {
    const raw = localStorage.getItem(LOCAL_STATUS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveLocalStatus = (uid: string, status: "active" | "blocked") => {
  try {
    const current = getLocalStatusMap();
    current[uid] = status;
    localStorage.setItem(LOCAL_STATUS_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
};

/**
 * Fetch all users across Firestore 'users' collection and discovered authors from 'blogs'
 */
export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  const localStatusMap = getLocalStatusMap();
  const userMap = new Map<string, AdminUser>();

  // 1. Seed users as baseline
  SEED_USERS.forEach((u) => {
    userMap.set(u.uid, {
      ...u,
      status: localStatusMap[u.uid] || u.status,
    });
  });

  // 2. Fetch from Firestore 'users' collection
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const uid = docSnap.id;
      const email = data.email || `${uid.slice(0, 8)}@user.readone.io`;
      const displayName =
        data.displayName ||
        data.name ||
        email.split("@")[0] ||
        "Community Member";

      const existingStatus = localStatusMap[uid] || data.status || "active";

      userMap.set(uid, {
        uid,
        displayName,
        email,
        status: existingStatus,
        role: data.role || "Member",
        createdAt: data.createdAt
          ? typeof data.createdAt?.toDate === "function"
            ? data.createdAt.toDate().toISOString()
            : String(data.createdAt)
          : null,
        blogsCount: data.blogsCount ?? 0,
      });
    });
  } catch (err) {
    console.warn("Notice fetching users collection:", err);
  }

  // 3. Scan 'blogs' collection to detect any users with created stories
  try {
    const blogsSnap = await getDocs(collection(db, "blogs"));
    const authorCounts = new Map<string, { count: number; author: string }>();

    blogsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const userId = data.userId;
      if (userId) {
        const cur = authorCounts.get(userId) || {
          count: 0,
          author: data.author || "Author",
        };
        cur.count += 1;
        authorCounts.set(userId, cur);
      }
    });

    authorCounts.forEach((info, uid) => {
      if (userMap.has(uid)) {
        const existing = userMap.get(uid)!;
        existing.blogsCount = info.count;
        if (info.author && existing.displayName === "Community Member") {
          existing.displayName = info.author;
        }
      } else {
        const email = `${uid.slice(0, 8)}@user.readone.io`;
        userMap.set(uid, {
          uid,
          displayName: info.author || `User ${uid.slice(0, 5)}`,
          email,
          status: localStatusMap[uid] || "active",
          role: "Author",
          blogsCount: info.count,
        });
      }
    });
  } catch (err) {
    console.warn("Notice checking blogs for authors:", err);
  }

  return Array.from(userMap.values());
};

/**
 * Toggle or set a user's status between 'active' and 'blocked'
 */
export const setUserStatus = async (
  uid: string,
  newStatus: "active" | "blocked"
): Promise<void> => {
  // 1. Immediately persist locally
  saveLocalStatus(uid, newStatus);

  // 2. Persist in Firestore
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not update status on Firestore users doc:", err);
  }
};

/**
 * Fetch a single user's profile details by UID for the Admin user profile view
 */
export const fetchAdminUserById = async (uid: string): Promise<AdminUser | null> => {
  const localStatusMap = getLocalStatusMap();
  const seedMatch = SEED_USERS.find((u) => u.uid === uid);

  let resolvedUser: AdminUser | null = seedMatch
    ? { ...seedMatch, status: localStatusMap[uid] || seedMatch.status }
    : null;

  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (userSnap.exists()) {
      const data = userSnap.data();
      const email =
        data.email ||
        resolvedUser?.email ||
        `${uid.slice(0, 8)}@user.readone.io`;
      const displayName =
        data.displayName ||
        data.name ||
        resolvedUser?.displayName ||
        email.split("@")[0] ||
        "Community Member";

      resolvedUser = {
        uid,
        displayName,
        email,
        status: localStatusMap[uid] || data.status || resolvedUser?.status || "active",
        role: data.role || resolvedUser?.role || "Member",
        createdAt: data.createdAt
          ? typeof data.createdAt?.toDate === "function"
            ? data.createdAt.toDate().toISOString()
            : String(data.createdAt)
          : resolvedUser?.createdAt ?? null,
        blogsCount: data.blogsCount ?? resolvedUser?.blogsCount ?? 0,
      };
    }
  } catch (err) {
    console.warn("Notice fetching admin user doc:", err);
  }

  try {
    const userBlogsSnap = await getDocs(
      query(collection(db, "blogs"), where("userId", "==", uid))
    );

    if (!userBlogsSnap.empty) {
      const firstBlogData = userBlogsSnap.docs[0].data();
      if (resolvedUser) {
        resolvedUser = {
          ...resolvedUser,
          blogsCount: userBlogsSnap.size,
          displayName:
            resolvedUser.displayName === "Community Member" && firstBlogData.author
              ? firstBlogData.author
              : resolvedUser.displayName,
        };
      } else {
        resolvedUser = {
          uid,
          displayName: firstBlogData.author || `User ${uid.slice(0, 5)}`,
          email: `${uid.slice(0, 8)}@user.readone.io`,
          status: localStatusMap[uid] || "active",
          role: "Author",
          blogsCount: userBlogsSnap.size,
        };
      }
    }
  } catch (err) {
    console.warn("Notice checking blogs for admin user:", err);
  }

  return resolvedUser;
};

