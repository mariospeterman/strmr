import { AccessToken, AccessTokenOptions, RoomServiceClient } from 'livekit-server-sdk';
import type { AppEnv } from '../config/env';

export type LiveKitServerService = ReturnType<typeof createLiveKitService>;

export const createLiveKitService = (env: AppEnv) => {
  const roomService = new RoomServiceClient(env.LIVEKIT_HOST, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);

  const createToken = (options: AccessTokenOptions & { roomName: string; identity: string; metadata?: Record<string, unknown> }) => {
    const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity: options.identity,
      ttl: options.ttl ?? 60 * 60,
      metadata: options.metadata ? JSON.stringify(options.metadata) : undefined
    });

    token.addGrant({
      room: options.roomName,
      roomJoin: true,
      canPublish: options.canPublish ?? true,
      canSubscribe: options.canSubscribe ?? true,
      canPublishData: true
    });

    return token.toJwt();
  };

  const ensureRoom = async (roomName: string, metadata?: Record<string, unknown>) => {
    await roomService.createRoom({
      name: roomName,
      emptyTimeout: 60,
      maxParticipants: 100,
      metadata: metadata ? JSON.stringify(metadata) : undefined
    }).catch(async (error) => {
      if (error.message.includes('already exists')) {
        return roomService.updateRoomMetadata(roomName, metadata ? JSON.stringify(metadata) : undefined);
      }
      throw error;
    });
  };

  const endRoom = (roomName: string) => roomService.deleteRoom(roomName);

  return {
    createToken,
    ensureRoom,
    endRoom,
    roomService
  };
};
