"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = void 0;
exports.types = `#graphql
    type getUserProfileResponse {
        id: ID!
        username: String!
        fullName: String!
        profileImageURL: String
        bio: String
        totalTracks: Int!
        followedByMe: Boolean!
    }

    input GetUserTracksPayload {
        username: String!
        page: Int!
    }
`;
