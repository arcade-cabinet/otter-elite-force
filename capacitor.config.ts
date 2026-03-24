import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "com.arcadecabinet.ottereliteforce",
	appName: "Otter Elite Force",
	webDir: "dist",
	plugins: {
		CapacitorSQLite: {
			iosDatabaseLocation: "Library/CapacitorDatabase",
			iosIsEncryption: false,
			androidIsEncryption: false,
		},
	},
};

export default config;
