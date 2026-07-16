import { supabase } from "./supabase";
import { SportRoute } from "../types";

// Auth is now handled directly by supabase.auth in AuthContext

export const RoutesAPI = {
  list: async (userId?: string) => {
    let query = supabase.from("routes").select("*").order("createdAt", { ascending: false });
    if (userId) {
      query = query.eq("userId", userId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return { data };
  },
  get: async (id: string) => {
    // Intentamos buscar en routes (mis rutas)
    const { data: routeData } = await supabase.from("routes").select("*, route_points(*)").eq("id", id).maybeSingle();
    
    if (routeData) {
      return { data: { route: routeData } };
    }

    // Si no está, buscamos en publications (feed)
    const { data: pubData } = await supabase.from("publications").select("*").eq("id", id).maybeSingle();
    
    if (pubData) {
      let photos = [];
      try { photos = pubData.images ? JSON.parse(pubData.images) : []; } catch {}
      let routePoints = [];
      try { routePoints = pubData.routePoints ? JSON.parse(pubData.routePoints) : []; } catch {}
      
      return {
        data: {
          route: {
            id: pubData.id,
            title: pubData.title,
            description: pubData.description,
            sport: pubData.sport,
            distance: pubData.distance,
            duration: pubData.duration,
            average_speed: pubData.averageSpeed,
            route_points: routePoints,
            photos: photos
          }
        }
      };
    }

    throw new Error("No se encontró la ruta o publicación.");
  },
  create: async (data: any) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not logged in");

    // Save route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .insert({
        userId: user.user.id,
        title: data.title,
        distance: data.distance,
        duration: data.duration,
        status: data.status || 'active'
      })
      .select()
      .single();

    if (routeError) throw routeError;

    // Save points
    const points = data.points || data.route_points;
    if (points && points.length > 0) {
      const pointsToInsert = points.map((p: any) => ({
        routeId: route.id,
        latitude: p.latitude,
        longitude: p.longitude,
        timestamp: new Date(p.timestamp).toISOString(),
      }));
      const { error: pointsError } = await supabase.from("route_points").insert(pointsToInsert);
      if (pointsError) throw pointsError;
    }

    // Save publication (Feed)
    const { error: pubError } = await supabase.from("publications").insert({
      title: data.title,
      description: data.description,
      sport: data.sport,
      distance: data.distance,
      duration: data.duration,
      averageSpeed: data.average_speed || data.averageSpeed,
      userId: user.user.id,
      routePoints: JSON.stringify(points || []),
      images: JSON.stringify(data.photos || [])
    });

    if (pubError) throw pubError;

    return { data: route };
  },
  update: async (id: string, data: Partial<SportRoute>) => {
    const { data: route, error } = await supabase.from("routes").update(data).eq("id", id).select().single();
    if (error) throw error;
    return { data: route };
  },
  remove: async (id: string) => {
    const { error } = await supabase.from("routes").delete().eq("id", id);
    if (error) throw error;
    return { data: null };
  },
};

export const UsersAPI = {
  getProfile: async (id: string) => {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
    if (error) throw error;
    return { data };
  },
  updateProfile: async (id: string, updates: any) => {
    const { data, error } = await supabase.from("users").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return { data };
  },
  search: async (query: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .or(`nickname.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(20);
    if (error) throw error;
    return { data };
  },
  getStats: async (userId: string) => {
    const { data, error } = await supabase.from("publications").select("duration, averageSpeed").eq("userId", userId);
    if (error) throw error;
    
    if (data && data.length > 0) {
      let totalDuration = 0;
      let totalSpeed = 0;
      data.forEach(r => {
        totalDuration += r.duration || 0;
        totalSpeed += r.averageSpeed || 0;
      });
      return {
        data: {
          averageDuration: totalDuration / data.length,
          averageSpeed: totalSpeed / data.length,
          totalRoutes: data.length
        }
      };
    }
    return { data: { averageDuration: 0, averageSpeed: 0, totalRoutes: 0 } };
  }
};

function mapFeedPublications(data: any[], currentUserId?: string) {
  return data.map((pub: any) => {
    let photos: string[] = [];
    try { photos = pub.images ? JSON.parse(pub.images) : []; } catch {}
    let routePoints: any[] = [];
    try { routePoints = pub.routePoints ? JSON.parse(pub.routePoints) : []; } catch {}

    const likes: any[] = pub.likes ?? [];
    const comments: any[] = pub.comments ?? [];
    const liked_by_me = currentUserId ? likes.some((l: any) => l.userId === currentUserId) : false;

    return {
      ...pub,
      user: {
        id: pub.users?.id,
        name: pub.users?.name,
        avatar_url: pub.users?.profilePhoto,
      },
      route: {
        id: pub.id,
        title: pub.title,
        sport: pub.sport,
        distance: pub.distance,
        duration: pub.duration,
        average_speed: pub.averageSpeed,
        route_points: routePoints,
        photos
      },
      liked_by_me,
      likes_count: likes.length,
      comments_count: comments.length
    };
  });
}

export const FeedAPI = {
  list: async (page = 1) => {
    const { data: user } = await supabase.auth.getUser();
    const currentUserId = user.user?.id;

    const { data, error } = await supabase
      .from("publications")
      .select("*, users(*), likes(id, userId), comments(id, userId)")
      .order("createdAt", { ascending: false })
      .range((page - 1) * 10, page * 10 - 1);

    if (error) throw error;
    return { data: mapFeedPublications(data, currentUserId) };
  },
  listByUser: async (userId: string, page = 1) => {
    const { data: user } = await supabase.auth.getUser();
    const currentUserId = user.user?.id;

    const { data, error } = await supabase
      .from("publications")
      .select("*, users(*), likes(id, userId), comments(id, userId)")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .range((page - 1) * 10, page * 10 - 1);

    if (error) throw error;
    return { data: mapFeedPublications(data, currentUserId) };
  },

  getLikesCount: async (publicationId: string) => {
    const { count, error } = await supabase
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("publicationId", publicationId);
    if (error) throw error;
    return count ?? 0;
  },

  toggleLike: async (publicationId: string, isLiked: boolean) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not logged in");
    
    if (isLiked) {
      // Remover like
      const { error } = await supabase.from("likes").delete()
        .match({ publicationId, userId: user.user.id });
      if (error) throw error;
    } else {
      // Añadir like
      const { error } = await supabase.from("likes").insert({
        publicationId,
        userId: user.user.id
      });
      if (error) throw error;
    }
  },

  getComments: async (publicationId: string) => {
    const { data, error } = await supabase
      .from("comments")
      .select("*, users(id, name, profilePhoto, nickname)")
      .eq("publicationId", publicationId)
      .order("createdAt", { ascending: true });
    if (error) throw error;
    return { data };
  },

  addComment: async (publicationId: string, content: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not logged in");

    const { data, error } = await supabase.from("comments").insert({
      publicationId,
      userId: user.user.id,
      content
    }).select("*, users(id, name, profilePhoto, nickname)").single();
    if (error) throw error;
    return { data };
  },

  getCommentsCount: async (publicationId: string) => {
    const { count, error } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("publicationId", publicationId);
    if (error) throw error;
    return count ?? 0;
  },

  like: async (postId: string) => {
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from("likes").insert({
      publicationId: postId,
      userId: user.user?.id
    });
    if (error) throw error;
    return { data: null };
  },
  unlike: async (postId: string) => {
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from("likes").delete().match({
      publicationId: postId,
      userId: user.user?.id
    });
    if (error) throw error;
    return { data: null };
  },
};


export const NotificationsAPI = {
  list: async () => {
    // For now, return empty array as notifications logic is complex for this migration
    return { data: { notifications: [] } };
  },
  markRead: async (id: string) => {
    return { data: null };
  },
  registerPushToken: async (token: string) => {
    // Store in users if needed, or in push_tokens table
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      await supabase.from("push_tokens").insert({ 
        userId: user.user.id, 
        token: token 
      });
    }
    return { data: null };
  },
};

export const UploadAPI = {
  uploadPhoto: async (uri: string) => {
    // Upload logic using Supabase Storage
    const { data: user } = await supabase.auth.getUser();
    const ext = uri.substring(uri.lastIndexOf(".") + 1).toLowerCase() || "jpg";
    const filename = `${user.user?.id}/${Date.now()}.${ext}`;

    let mimeType = `image/${ext}`;
    if (ext === "mp4" || ext === "mov") {
      mimeType = `video/${ext}`;
    }

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: filename,
      type: mimeType,
    } as any);

    const { data, error } = await supabase.storage
      .from("photos")
      .upload(filename, formData);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(filename);

    return { data: { url: publicUrl } };
  },
};

export const MessagesAPI = {
  conversations: async () => {
    // Simplifying conversations query for now
    return { data: [] };
  },
  history: async (otherUserId: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not logged in");

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(senderId.eq.${user.user.id},receiverId.eq.${otherUserId}),and(senderId.eq.${otherUserId},receiverId.eq.${user.user.id})`)
      .order('createdAt', { ascending: true });
    
    if (error) throw error;
    return { data };
  },
  send: async (receiverId: string, content: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not logged in");

    const { data, error } = await supabase
      .from('messages')
      .insert({
        senderId: user.user.id,
        receiverId,
        content
      })
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  }
};
