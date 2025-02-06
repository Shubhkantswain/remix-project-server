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
exports.resolvers = void 0;
const db_1 = require("../../clients/db");
const cloudinary_1 = require("cloudinary");
const queries = {
    getFeedTracks: (_parent, _args, _ctx) => __awaiter(void 0, void 0, void 0, function* () {
        const tracks = yield db_1.prismaClient.track.findMany();
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
    }),
};
const mutations = {
    createTrack: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { payload }, ctx) {
        try {
            // Ensure the user is authenticated
            if (!ctx.user)
                throw new Error("Please Login/Signup first!");
            const { title, audioFileUrl, coverImageUrl, artist, duration } = payload;
            // Upload audio URL to Cloudinary
            const uploadAudioResult = yield cloudinary_1.v2.uploader.upload(audioFileUrl, {
                resource_type: "auto",
            });
            // Upload cover image URL to Cloudinary (if provided)
            let uploadImageResult = null;
            if (coverImageUrl) {
                uploadImageResult = yield cloudinary_1.v2.uploader.upload(coverImageUrl, {
                    resource_type: "auto",
                });
            }
            // Create track in the database
            const track = yield db_1.prismaClient.track.create({
                data: {
                    title,
                    artist,
                    duration,
                    audioFileUrl: uploadAudioResult.secure_url,
                    coverImageUrl: uploadImageResult === null || uploadImageResult === void 0 ? void 0 : uploadImageResult.secure_url,
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
        }
        catch (error) {
            // Handle errors gracefully
            console.error("Error creating track:", error);
            throw new Error(error.message || "An error occurred while creating the track.");
        }
    }),
};
exports.resolvers = { queries, mutations };
