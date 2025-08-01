import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

let cachedClient: typeof mongoose | null = null;

export async function connectDB() {
    if (cachedClient) {
        console.log('=> using existing database connection');
        return cachedClient;
    }

    try {
        console.log('=> using new database connection');
        const client = await mongoose.connect(MONGO_URI as string);
        cachedClient = client;
        return client;
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}

export async function disconnectDB() {
    if (cachedClient) {
        console.log('=> disconnecting from database');
        await mongoose.disconnect();
        cachedClient = null;
    }
} 