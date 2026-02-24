/**
 * Mock for reactylon/web - stubs out Babylon.js Engine to prevent
 * initialization in test environment (no real WebGL canvas)
 */
import React from "react";

export const Engine = ({
	children,
	canvasId,
}: {
	children?: React.ReactNode;
	canvasId?: string;
}) => {
	return React.createElement(
		"div",
		{ "data-testid": `babylon-engine-${canvasId ?? "default"}` },
		children,
	);
};

export const CustomLoadingScreen = () => null;
