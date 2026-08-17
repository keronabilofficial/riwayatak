import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminRouter, catalogRouter, libraryRouter, reviewsRouter } from "./routers/content";
import { operationsRouter } from "./routers/operations";
import { mediaRouter } from "./routers/media";
import { adsRouter } from "./routers/ads";
import { audioRouter } from "./routers/audio";
import { subscriptionsRouter } from "./routers/subscriptions";
import { platformSettingsRouter } from "./routers/platformSettings";
import { communityRouter } from "./routers/community";
import { languageRouter } from "./routers/language";
import { contactRouter } from "./routers/contact";
import { profileRouter } from "./routers/profile";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  catalog: catalogRouter,
  library: libraryRouter,
  reviews: reviewsRouter,
  admin: adminRouter,
  operations: operationsRouter,
  media: mediaRouter,
  ads: adsRouter,
  audio: audioRouter,
  subscriptions: subscriptionsRouter,
  platform: platformSettingsRouter,
  community: communityRouter,
  language: languageRouter,
  contact: contactRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
