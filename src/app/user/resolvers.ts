import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";

interface GetUserTracksPayload {
  username: string;
  page: number;
}

interface GetUserTracksPahhhhhyload {
  username: string;
  page: number;
}

export const queries = {
  getUserProfile: async (
    parent: any,
    { username }: { username: string },
    ctx: GraphqlContext
  ) => {
    try {
      const currentUserId = ctx.user?.id;

      const user = await prismaClient.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          fullName: true,
          profileImageURL: true,
          bio: true,
          _count: {
            select: {
              tracks: true,
            },
          },
          followers: currentUserId
            ? {
              where: {
                followerId: currentUserId,
              },
              select: { id: true }, // Only retrieve necessary fields
            }
            : undefined, // Skip this query if currentUserId is not defined
        },
      });


      if (!user) {
        return null; // Return null if user does not exist
      }


      const totalTracks = user._count.tracks;
      const followedByMe = currentUserId ? user.followers.length > 0 : false;

      return {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        profileImageURL: user.profileImageURL || "", // Default to an empty string
        bio: user.bio,
        totalTracks,
        followedByMe,
      };
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      throw new Error(
        error.message || "An error occurred while fetching the user profile."
      );
    }
  },

  getUserTracks: async (
    parent: any,
    { payload }: { payload: GetUserTracksPayload },
    ctx: GraphqlContext
  ) => {
    try {
      const { username, page } = payload
      const tracks = await prismaClient.track.findMany({
        where: { author: { username } },
        orderBy: {
          createdAt: "desc", // Sort by creation date
        },
        include: {
          _count: {
            select: { likes: true }, // Retrieve the count of likes
          },
          likes: ctx.user?.id
            ? {
              where: { userId: ctx.user.id },
              select: { userId: true }, // Check if the current user has liked the track
            }
            : undefined, // Skip if the user is not logged in
        },
        skip: (page - 1) * 5,
        take: 5
      });

      // id                  
      // title           
      // artist 
      // duration           
      // coverImageUrl     
      // audioFileUrl            
      // hasLiked 
      // authorName

      return tracks.map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        coverImageUrl: track.coverImageUrl,
        audioFileUrl: track.audioFileUrl,
        hasLiked: ctx.user?.id ? track.likes.length > 0 : false, // Boolean to indicate if the user liked the track
        authorName: username
      }));
    } catch (error: any) {
      console.error("Error fetching user tracks:", error);
      throw new Error(
        error.message || "Failed to fetch user tracks. Please try again."
      );
    }
  },

};

export const resolvers = { queries }