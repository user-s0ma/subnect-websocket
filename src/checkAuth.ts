import { PrismaClient } from "@prisma/client";

export default async function checkAuth(request: Request, prisma: PrismaClient): Promise<{
  planName?: string;
  userId?: string;
  profileId?: string;
}> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return {};
  };
  const sessionToken = cookieHeader
    .split(";")
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith("subnect.session-token="))
    ?.split("=")[1];

  if (!sessionToken) {
    return {};
  };

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    select: {
      userId: true,
    },
  });
  const userId = session?.userId;
  if (!userId) {
    return {};
  }

  const session_profileId = cookieHeader
    .split(";")
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith("subnect.session-profileId="))
    ?.split("=")[1];
  let profile: { profileId: string };
  if (session_profileId) {
    profile = await prisma.profile.findUnique({
      where: { profileId: session_profileId, deletedAt: null },
      select: {
        profileId: true,
      }
    });
  };
  if (!profile) {
    profile = await prisma.profile.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: {
        profileId: true,
      }
    });
  };
  if (!profile) {
    return {};
  };

  const subscription = await prisma.subscription.findUnique({
    where: {
      profileId: profile.profileId,
    },
    select: {
      planName: true,
      currentPeriodEnd: true,
      status: true,
    },
  });

  let planName: string;
  if (
    subscription &&
    (subscription.status === "active" || subscription.status === "canceled") &&
    subscription.currentPeriodEnd > new Date()
  ) {
    planName = subscription.planName;
  }

  return {
    planName,
    userId,
    profileId: profile.profileId
  };
}