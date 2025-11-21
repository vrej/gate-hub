import { relations } from "drizzle-orm/relations";
import { users, activityLogs, applications, accessRequests } from "./schema";

export const activityLogsRelations = relations(activityLogs, ({one}) => ({
	user: one(users, {
		fields: [activityLogs.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	activityLogs: many(activityLogs),
	accessRequests_reviewedBy: many(accessRequests, {
		relationName: "accessRequests_reviewedBy_users_id"
	}),
	accessRequests_userId: many(accessRequests, {
		relationName: "accessRequests_userId_users_id"
	}),
}));

export const accessRequestsRelations = relations(accessRequests, ({one}) => ({
	application: one(applications, {
		fields: [accessRequests.applicationId],
		references: [applications.id]
	}),
	user_reviewedBy: one(users, {
		fields: [accessRequests.reviewedBy],
		references: [users.id],
		relationName: "accessRequests_reviewedBy_users_id"
	}),
	user_userId: one(users, {
		fields: [accessRequests.userId],
		references: [users.id],
		relationName: "accessRequests_userId_users_id"
	}),
}));

export const applicationsRelations = relations(applications, ({many}) => ({
	accessRequests: many(accessRequests),
}));