import { pgTable, foreignKey, serial, integer, varchar, json, timestamp, text, boolean, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const activityLogs = pgTable("activity_logs", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	action: varchar({ length: 255 }).notNull(),
	entityType: varchar("entity_type", { length: 100 }).notNull(),
	entityId: integer("entity_id"),
	details: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activity_logs_user_id_users_id_fk"
		}),
]);

export const applications = pgTable("applications", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	url: varchar({ length: 500 }),
	icon: varchar({ length: 255 }),
	status: varchar({ length: 50 }).default('approved').notNull(),
	approvedDepartments: text("approved_departments").array(),
	categories: text().array(),
	hideFromPublic: boolean("hide_from_public").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text().notNull(),
	color: varchar({ length: 7 }).default('#3b82f6').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("categories_name_unique").on(table.name),
]);

export const departments = pgTable("departments", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("departments_name_unique").on(table.name),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: text().notNull(),
	firstName: varchar("first_name", { length: 255 }).notNull(),
	lastName: varchar("last_name", { length: 255 }).notNull(),
	department: varchar({ length: 255 }).notNull(),
	isAdmin: boolean("is_admin").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const accessRequests = pgTable("access_requests", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	applicationId: integer("application_id").notNull(),
	firstName: varchar("first_name", { length: 255 }).default(').notNull(),
	lastName: varchar("last_name", { length: 255 }).default(').notNull(),
	email: varchar({ length: 255 }).default(').notNull(),
	department: varchar({ length: 255 }).notNull(),
	managerEmail: varchar("manager_email", { length: 255 }).default(').notNull(),
	justification: text().notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	reviewedBy: integer("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	jiraTicketKey: varchar("jira_ticket_key", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [applications.id],
			name: "access_requests_application_id_applications_id_fk"
		}),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "access_requests_reviewed_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "access_requests_user_id_users_id_fk"
		}),
]);
