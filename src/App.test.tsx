import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "./App";

test("renders without crashing", () => {
	const { getByText } = render(<App />);
	expect(getByText(/OTTER: ELITE FORCE/i)).toBeInTheDocument();
});
