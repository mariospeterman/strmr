import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

type JwtPayload = {
  sub: string;
  role: 'fan' | 'creator' | 'admin';
  tenantId: string;
};

const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const payload = await request.jwtVerify<JwtPayload>();
    request.user = {
      id: payload.sub,
      role: payload.role,
      tenantId: payload.tenantId
    };
    request.tenantId = payload.tenantId;
  } catch (error) {
    reply.code(401).send({ message: 'Unauthorized' });
  }
};

export default fp(async (fastify: FastifyInstance) => {
  fastify.register(fastifyJwt, {
    secret: fastify.config.LIVEKIT_API_SECRET // placeholder secret, replace with dedicated JWT secret
  });

  fastify.decorate('authenticate', authenticate);
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}
