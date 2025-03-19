"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = exports.queries = void 0;
const db_1 = require("../../clients/db");
exports.queries = {
    getUserProfile: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { username }, ctx) {
        var _b;
        try {
            const currentUserId = (_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id;
            const user = yield db_1.prismaClient.user.findUnique({
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
        }
        catch (error) {
            console.error("Error fetching user profile:", error);
            throw new Error(error.message || "An error occurred while fetching the user profile.");
        }
    }),
    getUserTracks: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { payload }, ctx) {
        var _b;
        try {
            const { username, page } = payload;
            const tracks = yield db_1.prismaClient.track.findMany({
                where: { author: { username } },
                orderBy: {
                    createdAt: "desc", // Sort by creation date
                },
                include: {
                    _count: {
                        select: { likes: true }, // Retrieve the count of likes
                    },
                    likes: ((_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id)
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
            return tracks.map((track) => {
                var _a;
                return ({
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    duration: track.duration,
                    coverImageUrl: track.coverImageUrl,
                    audioFileUrl: track.audioFileUrl,
                    hasLiked: ((_a = ctx.user) === null || _a === void 0 ? void 0 : _a.id) ? track.likes.length > 0 : false, // Boolean to indicate if the user liked the track
                    authorName: username
                });
            });
        }
        catch (error) {
            console.error("Error fetching user tracks:", error);
            throw new Error(error.message || "Failed to fetch user tracks. Please try again.");
        }
    }),
};
exports.resolvers = { queries: exports.queries };
