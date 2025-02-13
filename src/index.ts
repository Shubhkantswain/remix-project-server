import { initServer } from "./app"
import dotenv from 'dotenv'
import { v2 as cloudinary } from 'cloudinary';

dotenv.config()

async function init() {
    const app = await initServer()
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    app.listen(4000, () => console.log("server started at port: " + 4000))
}

init()