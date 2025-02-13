import { prismaClient } from "../../clients/db";
import { CreateTrackPayload, GraphqlContext } from "../../interfaces";
import { v2 as cloudinary } from 'cloudinary';

const queries = {
    getFeedTracks: async (_parent: any, _args: any, _ctx: GraphqlContext) => {
        // await new Promise((resolve) => setTimeout(resolve, 30000));

        const tracks = await prismaClient.track.findMany();

        return tracks.map((track) => ({
            id: track.id,
            title: track.title,
            artist: track.artist,
            duration: track.duration.toString(), // Ensure consistent format
            coverImageUrl: track.coverImageUrl || null, // Handle optional fields
            audioFileUrl: track.audioFileUrl,
            hasLiked: true, // Hardcoded for now
            authorName: "me", // Hardcoded for now   
        }));
    },
}

const mutations = {
    createTrack: async (
        parent: any,
        { payload }: { payload: CreateTrackPayload },
        ctx: GraphqlContext
    ) => {
        try {
            // Ensure the user is authenticated
            if (!ctx.user) throw new Error("Please Login/Signup first!");

            const { title, audioFileUrl, coverImageUrl, artist, duration } = payload;

            cloudinary.config({ 
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
                api_key: process.env.CLOUDINARY_API_KEY, 
                api_secret: process.env.CLOUDINARY_API_SECRET 
            });
            
            // Upload audio URL to Cloudinary
            const uploadAudioResult = await cloudinary.uploader.upload(audioFileUrl, {
                resource_type: "auto",
            });
 
            // export const cloudinaryConfig = () =>  {
            // }

            // Upload cover image URL to Cloudinary (if provided)
            let uploadImageResult = null;
            if (coverImageUrl) {
                uploadImageResult = await cloudinary.uploader.upload(coverImageUrl, {
                    resource_type: "auto",
                });
            }

            // Create track in the database
            const track = await prismaClient.track.create({
                data: {
                    title,
                    artist,
                    duration,
                    audioFileUrl: uploadAudioResult.secure_url,
                    coverImageUrl: uploadImageResult?.secure_url,
                    authorId: ctx.user.id, // Link track to the authenticated user
                },
            });

            return {
                id: track.id,
                title: track.title,
                artist: track.artist,
                duration: track.duration,
                coverImageUrl: track.coverImageUrl,
                audioFileUrl: track.audioFileUrl,
                hasLiked: false,

                authorName: ctx.user.username
            };
        } catch (error: any) {
            // Handle errors gracefully
            console.error("Error creating track:", error);
            throw new Error(error.message || "An error occurred while creating the track.");
        }
    },

    deleteTrack: async (
        parent: any,
        { trackId }: { trackId: string },
        ctx: GraphqlContext
    ) => {
        try {
            // Ensure the user is authenticated
            if (!ctx.user) throw new Error("Please Login/Signup first!");

            const track = await prismaClient.track.findUnique({ where: { id: trackId } })

            if (!track) {
                throw new Error("Post Doest exist!");
            }

            if (track.authorId.toString() != ctx.user.id.toString()) {
                throw new Error("You cant delete someone else post!");
            }

            await prismaClient.track.delete({ where: { id: trackId } })

            return true

        } catch (error: any) {
            // Handle errors gracefully (Cloudinary or Prisma issues)
            console.error("Error toggling like:", error);
            throw new Error(error.message || "An error occurred while toggling the like on the post.");
        }
    },

    likeTrack: async (parent: any, { trackId }: { trackId: string }, ctx: GraphqlContext) => {
        try {

            if (!ctx.user) throw new Error("Please Login/Signup first");

            // Attempt to delete the like (unlike the track)
            await prismaClient.like.delete({
                where: {
                    userId_trackId: {
                        userId: ctx.user.id,
                        trackId,
                    },
                },
            });
            // If successful, return false (indicating the track is now unliked)
            return false;

        } catch (error: any) {
            if (error.code === 'P2025') {
                // Create a like if not found (toggle to liked)
                await prismaClient.like.create({
                    data: {
                        userId: ctx?.user?.id || "",
                        trackId,
                    },
                });
                return true; // Indicate the track is now liked
            }

            throw new Error(error.message || "something went wrong");
        }
    },
}

export const resolvers = { queries, mutations }