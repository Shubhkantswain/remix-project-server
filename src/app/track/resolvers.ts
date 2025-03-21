import { title } from "process";
import { prismaClient } from "../../clients/db";
import { CreateTrackPayload, GraphqlContext } from "../../interfaces";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv'

dotenv.config()

const queries = {
    getFeedTracks: async (_parent: any, _args: any, _ctx: GraphqlContext) => {
        if (!_ctx.user) {
            throw new Error("User not authenticated");
        }

        const userId = _ctx.user.id; // Get the current user's ID

        const tracks = await prismaClient.track.findMany({
            include: {
                likes: {
                    where: {
                        userId: userId
                    }
                }
            }
        });

        return tracks.map((track) => ({
            id: track.id,
            title: track.title,
            artist: track.artist,
            duration: track.duration.toString(),
            coverImageUrl: track.coverImageUrl || null,
            audioFileUrl: track.audioFileUrl,
            hasLiked: track.likes.length > 0, // Check if the user has liked the track
            authorName: "me", // Assuming you want to show the author's name
        }));
    },

    getLikedTracks: async (_parent: any, _args: any, _ctx: GraphqlContext) => {
        if (!_ctx.user) {
            throw new Error("User not authenticated");
        }

        console.log("_ctx.user", _ctx.user);

        try {
            const likedTracks = await prismaClient.like.findMany({
                where: {
                    userId: _ctx.user.id
                },
                select: {
                    track: {
                        select: {
                            id: true,
                            title: true,
                            artist: true,
                            duration: true,
                            coverImageUrl: true,
                            audioFileUrl: true,
                        }
                    }
                }
            });

            const tracks = likedTracks.map(like => ({
                id: like.track.id,
                title: like.track.title,
                artist: like.track.artist,
                duration: like.track.duration,
                coverImageUrl: like.track.coverImageUrl,
                audioFileUrl: like.track.audioFileUrl,
                hasLiked: true,
                authorName: "me"
            }))

            console.log("tracks", tracks);

            return likedTracks.map(like => ({
                id: like.track.id,
                title: like.track.title,
                artist: like.track.artist,
                duration: like.track.duration,
                coverImageUrl: like.track.coverImageUrl,
                audioFileUrl: like.track.audioFileUrl,
                hasLiked: true,
                authorName: "me"
            }));

        } catch (error) {
            console.error("Error fetching liked tracks:", error);
            throw new Error("Failed to fetch liked tracks");
        }
    }
};


const mutations = {
    createTrack: async (
        parent: any,
        { payload }: { payload: CreateTrackPayload },
        ctx: GraphqlContext
    ) => {
        try {
            // Ensure the user is authenticated
            if (!ctx.user) throw new Error("Please Login/Signup first!");

            const { title, audioFileUrl, coverImageUrl, language, genre, artist, duration } = payload;

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
                    language,
                    genre,
                    authorId: ctx.user.id,
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