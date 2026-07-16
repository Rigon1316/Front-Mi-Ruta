// ---- Modelo de dominio ----

export type Sport = string;

export interface RoutePoint {
  id?: string;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  speed?: number | null;
  timestamp: string | number;
  routeId?: string;
}

export interface SportRoute {
  id: string;
  userId: string;
  title: string;
  distance: number; // metros
  duration: number; // segundos
  sport?: Sport;
  average_speed?: number;
  status?: string;
  createdAt?: string; // ISO date
  finishedAt?: string; // ISO date
  route_points?: RoutePoint[]; // related table
  points?: RoutePoint[];
  photos?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  profilePhoto?: string;
  avatar_url?: string;
  nickname?: string;
  bio?: string;
  createdAt?: string;
}

export interface FeedPost {
  id: string;
  userId: string;
  title?: string;
  description?: string;
  sport?: Sport;
  distance?: number;
  duration?: number;
  averageSpeed?: number;
  routePoints?: string; // stored as text in DB
  images?: string; // stored as text in DB
  createdAt: string;
  updatedAt?: string;
  user?: User; // joined from users table
  route?: Partial<SportRoute> & { photos?: string[] };
  liked_by_me?: boolean;
  likes_count?: number;
  comments_count?: number;
}

export interface AppNotification {
  id: string;
  type: "like" | "comment" | "follow" | "message" | "system";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage?: Message;
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}
