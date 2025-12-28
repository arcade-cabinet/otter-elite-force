/**
 * Joystick Zone Indicators
 * Visual feedback for mobile touch controls
 */

export function JoystickZones() {
	return (
		<>
			<div
				id="joystick-move"
				className="joystick-zone left"
				style={{
					position: "absolute",
					left: "20px",
					bottom: "20px",
					width: "150px",
					height: "150px",
					borderRadius: "50%",
					border: "2px dashed rgba(255, 170, 0, 0.3)",
					background: "radial-gradient(circle, rgba(255, 170, 0, 0.1) 0%, transparent 70%)",
				}}
			>
				<div
					style={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						color: "rgba(255, 170, 0, 0.4)",
						fontSize: "0.7rem",
						textAlign: "center",
						pointerEvents: "none",
					}}
				>
					MOVE
				</div>
			</div>
			<div
				id="joystick-look"
				className="joystick-zone drag-area"
				style={{
					position: "absolute",
					right: "20px",
					bottom: "180px",
					width: "150px",
					height: "150px",
					borderRadius: "8px",
					border: "2px dashed rgba(255, 170, 0, 0.2)",
					background: "rgba(255, 170, 0, 0.05)",
				}}
			>
				<div
					style={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						color: "rgba(255, 170, 0, 0.3)",
						fontSize: "0.7rem",
						textAlign: "center",
						pointerEvents: "none",
					}}
				>
					DRAG TO
					<br />
					AIM
				</div>
			</div>
		</>
	);
}
