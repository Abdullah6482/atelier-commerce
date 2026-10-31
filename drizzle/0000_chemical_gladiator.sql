CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` real NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`customer_name` text NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`country` text NOT NULL,
	`subtotal` real NOT NULL,
	`shipping` real NOT NULL,
	`total` real NOT NULL,
	`status` text DEFAULT 'Confirmed' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`price` real NOT NULL,
	`compare_at_price` real,
	`color` text NOT NULL,
	`accent` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);