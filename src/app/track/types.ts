export const types = `#graphql
    input createTrackPayload {
        title: String!
        audioFileUrl: String!      
        coverImageUrl: String
        artist: String
        language: String
        genre: String
        duration: String!
    }

    type Track {
        id: ID!                    # Unique identifier
        title: String!             # Track title
        artist: String!            # Name of the artist or band
        duration: String!             # Duration of the track in seconds
        coverImageUrl: String      # URL to the cover image (optional)
        audioFileUrl: String!      # URL to the audio file
        hasLiked: Boolean!

        authorName: String!
    }
`