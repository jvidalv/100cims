import { relations } from "drizzle-orm/relations";
import {
  challenge,
  challengeHasMountain,
  mountain,
  user,
  donor,
  plan,
  planHasMountains,
  planHasUsers,
  planMessage,
  planUserLog,
  planUserMessageRead,
  summit,
  summitHasUsers,
  userPlanVisit,
  summitReaction,
  updateSeen,
  emailLog,
  userPeople,
} from "./schema";

export const challengeHasMountainRelations = relations(
  challengeHasMountain,
  ({ one }) => ({
    challenge: one(challenge, {
      fields: [challengeHasMountain.challengeId],
      references: [challenge.id],
    }),
    mountain: one(mountain, {
      fields: [challengeHasMountain.mountainId],
      references: [mountain.id],
    }),
  }),
);

export const challengeRelations = relations(challenge, ({ one, many }) => ({
  challengeHasMountains: many(challengeHasMountain),
  plans: many(plan),
  user: one(user, {
    fields: [challenge.creatorId],
    references: [user.id],
  }),
}));

export const mountainRelations = relations(mountain, ({ one, many }) => ({
  challengeHasMountains: many(challengeHasMountain),
  planHasMountains: many(planHasMountains),
  summits: many(summit),
  user: one(user, {
    fields: [mountain.creatorId],
    references: [user.id],
  }),
}));

export const donorRelations = relations(donor, ({ one }) => ({
  user: one(user, {
    fields: [donor.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  donors: many(donor),
  plans: many(plan),
  planHasUsers: many(planHasUsers),
  planMessages: many(planMessage),
  planUserLogs: many(planUserLog),
  planUserMessageReads: many(planUserMessageRead),
  summitHasUsers: many(summitHasUsers),
  userPlanVisits: many(userPlanVisit),
  summits: many(summit),
  summitReactions: many(summitReaction),
  updateSeens: many(updateSeen),
  mountains: many(mountain),
  challenges: many(challenge),
  emailLogs: many(emailLog),
  userPeople_userAId: many(userPeople, {
    relationName: "userPeople_userAId_user_id",
  }),
  userPeople_userBId: many(userPeople, {
    relationName: "userPeople_userBId_user_id",
  }),
}));

export const planRelations = relations(plan, ({ one, many }) => ({
  user: one(user, {
    fields: [plan.creatorId],
    references: [user.id],
  }),
  challenge: one(challenge, {
    fields: [plan.challengeId],
    references: [challenge.id],
  }),
  planHasMountains: many(planHasMountains),
  planHasUsers: many(planHasUsers),
  planMessages: many(planMessage),
  planUserLogs: many(planUserLog),
  planUserMessageReads: many(planUserMessageRead),
}));

export const planHasMountainsRelations = relations(
  planHasMountains,
  ({ one }) => ({
    plan: one(plan, {
      fields: [planHasMountains.planId],
      references: [plan.id],
    }),
    mountain: one(mountain, {
      fields: [planHasMountains.mountainId],
      references: [mountain.id],
    }),
  }),
);

export const planHasUsersRelations = relations(planHasUsers, ({ one }) => ({
  plan: one(plan, {
    fields: [planHasUsers.planId],
    references: [plan.id],
  }),
  user: one(user, {
    fields: [planHasUsers.userId],
    references: [user.id],
  }),
}));

export const planMessageRelations = relations(planMessage, ({ one }) => ({
  plan: one(plan, {
    fields: [planMessage.planId],
    references: [plan.id],
  }),
  user: one(user, {
    fields: [planMessage.userId],
    references: [user.id],
  }),
}));

export const planUserLogRelations = relations(planUserLog, ({ one }) => ({
  plan: one(plan, {
    fields: [planUserLog.planId],
    references: [plan.id],
  }),
  user: one(user, {
    fields: [planUserLog.userId],
    references: [user.id],
  }),
}));

export const planUserMessageReadRelations = relations(
  planUserMessageRead,
  ({ one }) => ({
    plan: one(plan, {
      fields: [planUserMessageRead.planId],
      references: [plan.id],
    }),
    user: one(user, {
      fields: [planUserMessageRead.userId],
      references: [user.id],
    }),
  }),
);

export const summitHasUsersRelations = relations(summitHasUsers, ({ one }) => ({
  summit: one(summit, {
    fields: [summitHasUsers.summitId],
    references: [summit.id],
  }),
  user: one(user, {
    fields: [summitHasUsers.userId],
    references: [user.id],
  }),
}));

export const summitRelations = relations(summit, ({ one, many }) => ({
  summitHasUsers: many(summitHasUsers),
  mountain: one(mountain, {
    fields: [summit.mountainId],
    references: [mountain.id],
  }),
  user: one(user, {
    fields: [summit.userId],
    references: [user.id],
  }),
  summitReactions: many(summitReaction),
}));

export const userPlanVisitRelations = relations(userPlanVisit, ({ one }) => ({
  user: one(user, {
    fields: [userPlanVisit.userId],
    references: [user.id],
  }),
}));

export const summitReactionRelations = relations(summitReaction, ({ one }) => ({
  summit: one(summit, {
    fields: [summitReaction.summitId],
    references: [summit.id],
  }),
  user: one(user, {
    fields: [summitReaction.userId],
    references: [user.id],
  }),
}));

export const updateSeenRelations = relations(updateSeen, ({ one }) => ({
  user: one(user, {
    fields: [updateSeen.userId],
    references: [user.id],
  }),
}));

export const emailLogRelations = relations(emailLog, ({ one }) => ({
  user: one(user, {
    fields: [emailLog.userId],
    references: [user.id],
  }),
}));

export const userPeopleRelations = relations(userPeople, ({ one }) => ({
  user_userAId: one(user, {
    fields: [userPeople.userAId],
    references: [user.id],
    relationName: "userPeople_userAId_user_id",
  }),
  user_userBId: one(user, {
    fields: [userPeople.userBId],
    references: [user.id],
    relationName: "userPeople_userBId_user_id",
  }),
}));
