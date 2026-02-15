CREATE TABLE `announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`is_effective` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `drugs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`furigana` text DEFAULT '' NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL,
	`is_inactive` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`drug_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`approved_quantity` integer DEFAULT 0,
	`status` text DEFAULT '承認待ち' NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`drug_id`) REFERENCES `drugs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ward_id` text NOT NULL,
	`request_id` text,
	`type` text NOT NULL,
	`status` text DEFAULT '承認待ち' NOT NULL,
	`reason` text,
	`order_date` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`week_start_date` text,
	`approved_date` text,
	`reject_reason` text,
	`version` integer DEFAULT 1 NOT NULL,
	`last_modified` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`ward_id`) REFERENCES `wards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ward_constant_drugs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ward_id` text NOT NULL,
	`drug_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`expiry_dates` text,
	FOREIGN KEY (`ward_id`) REFERENCES `wards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`drug_id`) REFERENCES `drugs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'ward' NOT NULL,
	`is_inactive` integer DEFAULT false NOT NULL
);
