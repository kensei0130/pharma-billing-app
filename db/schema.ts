import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// 薬品マスタ
export const drugs = sqliteTable("drugs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    furigana: text("furigana"), // 検索用
    category: text("category"), // 分類
    unit: text("unit").notNull(), // 単位 (錠, 本, ml)
    isInactive: integer("is_inactive", { mode: "boolean" }).default(false).notNull(), // 論理削除用
});

// 病棟マスタ
export const wards = sqliteTable("wards", {
    id: text("id").primaryKey(), // '1', '2' or 'admin'
    name: text("name").notNull(), // 内科病棟, 外科病棟
    password: text("password").notNull(),
    role: text("role", { enum: ["admin", "user"] }).default("user").notNull(),
    isInactive: integer("is_inactive", { mode: "boolean" }).default(false).notNull(),
});

// 定数セット（New）
export const constantSets = sqliteTable("constant_sets", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    wardId: text("ward_id").notNull().references(() => wards.id),
    name: text("name").notNull(),
});

// 定数薬品（常備薬）マスタ (Modified - Transitive State)
export const wardConstantDrugs = sqliteTable("ward_constant_drugs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    wardId: text("ward_id").references(() => wards.id), // Keep for now (Nullable to allow omitting in future)
    setId: integer("set_id").references(() => constantSets.id, { onDelete: "cascade" }), // Nullable to avoid truncate
    drugId: integer("drug_id").notNull().references(() => drugs.id),
    quantity: integer("quantity").notNull(), // 定数
    displayOrder: integer("display_order").default(0), // 表示順
});

// ... (Rest of existing tables)

// 請求（オーダー）ヘッダー
export const orders = sqliteTable("orders", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    wardId: text("ward_id").notNull().references(() => wards.id),
    requestId: text("request_id"), // 請求ID (例: 15-1) 表示用
    orderDate: text("order_date").default(sql`CURRENT_TIMESTAMP`).notNull(),
    weekStart: text("week_start"), // 定時請求の対象週開始日

    type: text("type", { enum: ["臨時", "定時", "緊急"] }).default("臨時").notNull(),
    reason: text("reason"), // 請求理由

    status: text("status", { enum: ["承認待ち", "部分承認", "承認済み", "却下"] }).default("承認待ち").notNull(),

    approvedDate: text("approved_date"),
    approvedBy: text("approved_by"), // 承認者名

    isCancelled: integer("is_cancelled", { mode: "boolean" }).default(false).notNull(), // 論理削除
    rejectReason: text("reject_reason"), // オーダー全体の却下理由
});

// 請求明細（アイテム）
export const orderItems = sqliteTable("order_items", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    drugId: integer("drug_id").notNull().references(() => drugs.id),

    quantity: integer("quantity").notNull(), // 請求数量

    // 承認・変更用フィールド
    approvedQuantity: integer("approved_quantity").default(0), // 承認数量
    rejectedQuantity: integer("rejected_quantity").default(0), // 却下数量

    status: text("status", { enum: ["承認待ち", "承認済み", "部分承認", "却下"] }).default("承認待ち").notNull(),
    comment: text("comment"), // アイテムごとのコメント
});

// 承認履歴（Audit Log）
export const approvalHistory = sqliteTable("approval_history", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    drugId: integer("drug_id").references(() => drugs.id),

    action: text("action").notNull(), // 'approve', 'reject', 'modify', 'cancel'
    previousQuantity: integer("previous_quantity"),
    newQuantity: integer("new_quantity"),

    actorName: text("actor_name").notNull(), // 操作した管理者名
    comment: text("comment"),
    timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// お知らせマスタ
export const announcements = sqliteTable("announcements", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    content: text("content"),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Relations
import { relations } from "drizzle-orm";

export const ordersRelations = relations(orders, ({ one, many }) => ({
    ward: one(wards, {
        fields: [orders.wardId],
        references: [wards.id],
    }),
    items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    drug: one(drugs, {
        fields: [orderItems.drugId],
        references: [drugs.id],
    }),
}));

export const drugsRelations = relations(drugs, ({ many }) => ({
    orderItems: many(orderItems),
    constantWards: many(wardConstantDrugs),
}));

export const constantSetsRelations = relations(constantSets, ({ one, many }) => ({
    ward: one(wards, {
        fields: [constantSets.wardId],
        references: [wards.id],
    }),
    items: many(wardConstantDrugs),
}));

export const wardConstantDrugsRelations = relations(wardConstantDrugs, ({ one }) => ({
    ward: one(wards, {
        fields: [wardConstantDrugs.wardId],
        references: [wards.id],
    }),
    set: one(constantSets, {
        fields: [wardConstantDrugs.setId],
        references: [constantSets.id],
    }),
    drug: one(drugs, {
        fields: [wardConstantDrugs.drugId],
        references: [drugs.id],
    }),
}));

export const wardsRelations = relations(wards, ({ many }) => ({
    orders: many(orders),
    constantSets: many(constantSets),
}));
