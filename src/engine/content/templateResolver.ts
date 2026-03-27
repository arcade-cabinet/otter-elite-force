/**
 * Template Resolver — resolves `extends` chains in JSON templates.
 *
 * Rules:
 *   - Deep merges parent -> child for nested objects (stats, visual, training, etc.)
 *   - Arrays REPLACE (do not concat) — e.g. abilities list is the child's list
 *   - Primitives override
 *   - `null` values in child override parent (explicit null is intentional)
 *   - Circular extends chains throw
 */

/**
 * Deep merge two plain objects. Child values take precedence.
 *
 * - Arrays in child replace parent arrays entirely.
 * - Nested plain objects are merged recursively.
 * - Primitives and null in child override parent.
 */
export function deepMerge<T extends Record<string, unknown>>(parent: T, child: Partial<T>): T {
	const result: Record<string, unknown> = { ...parent };

	for (const key of Object.keys(child)) {
		const childVal = (child as Record<string, unknown>)[key];
		const parentVal = result[key];

		if (childVal === undefined) {
			// Child doesn't specify this key — keep parent value
			continue;
		}

		if (childVal === null) {
			// Explicit null overrides parent
			result[key] = null;
			continue;
		}

		if (Array.isArray(childVal)) {
			// Arrays replace entirely — no concat
			result[key] = [...childVal];
			continue;
		}

		if (
			typeof childVal === "object" &&
			typeof parentVal === "object" &&
			parentVal !== null &&
			!Array.isArray(parentVal)
		) {
			// Recursive merge for nested objects
			result[key] = deepMerge(
				parentVal as Record<string, unknown>,
				childVal as Record<string, unknown>,
			);
			continue;
		}

		// Primitive override
		result[key] = childVal;
	}

	return result as T;
}

/**
 * Resolve an `extends` chain for a single template.
 *
 * @param id - The template ID being resolved
 * @param raw - The raw template map (id -> raw template data)
 * @param resolved - Cache of already-resolved templates
 * @param visited - Cycle detection set for the current chain
 * @returns The fully resolved template (extends stripped)
 */
export function resolveTemplate<T extends Record<string, unknown>>(
	id: string,
	raw: Record<string, T & { extends?: string }>,
	resolved: Map<string, T>,
	visited: Set<string> = new Set(),
): T {
	// Already resolved
	const cached = resolved.get(id);
	if (cached) return cached;

	const template = raw[id];
	if (!template) {
		throw new Error(`resolveTemplate: unknown template ID '${id}'`);
	}

	// Cycle detection
	if (visited.has(id)) {
		throw new Error(
			`resolveTemplate: circular extends chain detected: ${[...visited, id].join(" -> ")}`,
		);
	}
	visited.add(id);

	let result: T;

	if (template.extends) {
		const parentId = template.extends;
		const parent = resolveTemplate(parentId, raw, resolved, visited);

		// Deep merge parent -> child (strip the `extends` key from child)
		const { extends: _extends, ...childFields } = template;
		result = deepMerge(parent, childFields as Partial<T>);
	} else {
		// No parent — template is self-contained
		result = { ...template };
	}

	// Remove `extends` from resolved result
	delete (result as Record<string, unknown>).extends;

	resolved.set(id, result);
	return result;
}

/**
 * Resolve all templates in a raw record, returning a Map of fully resolved templates.
 */
export function resolveAllTemplates<T extends Record<string, unknown>>(
	raw: Record<string, T & { extends?: string }>,
): Map<string, T> {
	const resolved = new Map<string, T>();
	for (const id of Object.keys(raw)) {
		resolveTemplate(id, raw, resolved);
	}
	return resolved;
}
