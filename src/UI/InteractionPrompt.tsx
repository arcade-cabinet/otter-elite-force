/**
 * Interaction Prompt Component
 *
 * Shows interaction prompts and progress bar when player is near an interactable object
 */

import type React from "react";

interface InteractionPromptProps {
	promptText: string | null;
	progress: number; // 0-1
	isInteracting: boolean;
}

export const InteractionPrompt: React.FC<InteractionPromptProps> = ({
	promptText,
	progress,
	isInteracting,
}) => {
	if (!promptText) return null;

	return (
		<div
			style={{
				position: "fixed",
				bottom: "30%",
				left: "50%",
				transform: "translateX(-50%)",
				textAlign: "center",
				zIndex: 100,
			}}
		>
			<div
				style={{
					background: "rgba(0, 0, 0, 0.8)",
					padding: "12px 24px",
					borderRadius: "8px",
					border: "2px solid #4d4233",
					fontFamily: "monospace",
					fontSize: "16px",
					color: "#fff",
					textTransform: "uppercase",
					letterSpacing: "2px",
					marginBottom: "8px",
				}}
			>
				{promptText}
			</div>

			{isInteracting && (
				<div
					style={{
						width: "200px",
						height: "20px",
						background: "rgba(0, 0, 0, 0.8)",
						border: "2px solid #4d4233",
						borderRadius: "4px",
						overflow: "hidden",
						margin: "0 auto",
					}}
				>
					<div
						style={{
							width: `${progress * 100}%`,
							height: "100%",
							background: "linear-gradient(90deg, #4d4233, #8d6e63)",
							transition: "width 0.1s linear",
						}}
					/>
				</div>
			)}
		</div>
	);
};
