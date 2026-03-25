/**
 * Database abstraction layer for @capacitor-community/sqlite.
 *
 * Provides a unified interface for SQLite operations across platforms:
 * - Native (iOS/Android): real SQLite via Capacitor plugin
 * - Web: jeep-sqlite (WASM-based SQLite)
 * - Testing: in-memory Map-based mock
 *
 * Follows the Bok pattern: DatabaseAdapter interface + platform-specific implementations.
 *
 * @module persistence/database
 */

import { Capacitor } from "@capacitor/core";
import {
	CapacitorSQLite,
	SQLiteConnection,
	type SQLiteDBConnection,
} from "@capacitor-community/sqlite";

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface DatabaseAdapter {
	execute(sql: string, params?: unknown[]): Promise<void>;
	query<T>(sql: string, params?: unknown[]): Promise<T[]>;
	close(): Promise<void>;
}

// ---------------------------------------------------------------------------
// CapacitorDatabase — production adapter
// ---------------------------------------------------------------------------

export class CapacitorDatabase implements DatabaseAdapter {
	#db: SQLiteDBConnection | null = null;
	readonly #dbName: string;

	constructor(dbName = "otter_elite_force") {
		this.#dbName = dbName;
	}

	async open(): Promise<void> {
		const sqlite = new SQLiteConnection(CapacitorSQLite);
		const ret = await sqlite.checkConnectionsConsistency();
		const isConn = (await sqlite.isConnection(this.#dbName, false)).result;
		if (ret.result && isConn) {
			this.#db = await sqlite.retrieveConnection(this.#dbName, false);
		} else {
			this.#db = await sqlite.createConnection(this.#dbName, false, "no-encryption", 1, false);
		}
		await this.#db.open();
	}

	async execute(sql: string, params?: unknown[]): Promise<void> {
		if (!this.#db) throw new Error("Database not open — call open() first");
		await this.#db.run(sql, params as (string | number | boolean | null)[]);
	}

	async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
		if (!this.#db) throw new Error("Database not open — call open() first");
		const result = await this.#db.query(sql, params as (string | number | boolean | null)[]);
		return (result.values ?? []) as T[];
	}

	async close(): Promise<void> {
		if (this.#db) {
			await this.#db.close();
			this.#db = null;
		}
	}
}

// ---------------------------------------------------------------------------
// InMemoryDatabase — test / web-fallback adapter
// ---------------------------------------------------------------------------

/**
 * Lightweight in-memory adapter with simplified SQL parsing.
 * Handles CREATE TABLE, INSERT (OR REPLACE), SELECT, UPDATE, DELETE.
 * Suitable for unit tests and web development without WASM.
 */
export class InMemoryDatabase implements DatabaseAdapter {
	readonly #tables = new Map<string, unknown[][]>();
	readonly #columns = new Map<string, string[]>();
	readonly #primaryKeys = new Map<string, number[]>();
	readonly #autoInc = new Map<string, number>();

	async execute(sql: string, params?: unknown[]): Promise<void> {
		const trimmed = sql.trim();

		// CREATE TABLE
		const createMatch = trimmed.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
		if (createMatch) {
			const table = createMatch[1];
			if (!this.#tables.has(table)) this.#tables.set(table, []);
			const lines = trimmed
				.split("\n")
				.map((l) => l.trim())
				.filter(Boolean);
			const cols: string[] = [];
			const pkCols: string[] = [];
			for (const line of lines) {
				if (/^PRIMARY KEY\s*\(/i.test(line)) {
					const m = line.match(/PRIMARY KEY\s*\(([^)]+)\)/i);
					if (m) pkCols.push(...m[1].split(",").map((c) => c.trim()));
					continue;
				}
				if (/^(CREATE|FOREIGN|\)|CHECK)/i.test(line)) continue;
				const colMatch = line.match(/^(\w+)\s+(INTEGER|TEXT|REAL|BLOB|NUMERIC)/i);
				if (colMatch) {
					cols.push(colMatch[1]);
					if (/PRIMARY KEY/i.test(line) && !pkCols.length) {
						pkCols.push(colMatch[1]);
					}
				}
			}
			if (cols.length > 0) {
				this.#columns.set(table, cols);
				if (pkCols.length > 0) {
					this.#primaryKeys.set(
						table,
						pkCols.map((c) => cols.indexOf(c)).filter((i) => i >= 0),
					);
				}
			}
			return;
		}

		// INSERT (OR REPLACE)
		const insertMatch = trimmed.match(/INSERT\s+(?:OR REPLACE\s+)?INTO\s+(\w+)/i);
		if (insertMatch && params) {
			const table = insertMatch[1];
			const rows = this.#tables.get(table) ?? [];
			const valsMatch = trimmed.match(/VALUES\s*\(([^)]+)\)/i);
			let row: unknown[];
			if (valsMatch) {
				const tokens = valsMatch[1].split(",").map((t) => t.trim());
				let pi = 0;
				row = tokens.map((t) => {
					if (t === "?") return params[pi++];
					return Number.isNaN(Number(t)) ? t : Number(t);
				});
			} else {
				row = [...params];
			}

			// Auto-increment id if not included in column list
			const colsMatch = trimmed.match(/INTO\s+\w+\s*\(([^)]+)\)/i);
			if (colsMatch) {
				const insertCols = colsMatch[1].split(",").map((c) => c.trim());
				const schemaCols = this.#columns.get(table) ?? [];
				if (!insertCols.includes("id") && schemaCols.includes("id")) {
					const nextId = (this.#autoInc.get(table) ?? 0) + 1;
					this.#autoInc.set(table, nextId);
					row = [nextId, ...row];
				}
			}

			// Handle OR REPLACE
			if (/INSERT\s+OR REPLACE/i.test(trimmed) && rows.length > 0) {
				const pkIndices = this.#primaryKeys.get(table) ?? [0];
				const idx = rows.findIndex((r) => pkIndices.every((i) => r[i] === row[i]));
				if (idx !== -1) rows.splice(idx, 1);
			}

			rows.push(row);
			this.#tables.set(table, rows);
			return;
		}

		// UPDATE
		const updateMatch = trimmed.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
		if (updateMatch && params) {
			const table = updateMatch[1];
			const cols = this.#columns.get(table) ?? [];
			const rows = this.#tables.get(table) ?? [];
			const setTokens = updateMatch[2].split(",").map((s) => s.trim());
			const setEntries: Array<{ colIdx: number; paramIdx: number }> = [];
			let pIdx = 0;
			for (const token of setTokens) {
				const colName = token.split("=")[0].trim();
				const colIdx = cols.indexOf(colName);
				if (colIdx >= 0) setEntries.push({ colIdx, paramIdx: pIdx });
				pIdx++;
			}
			const filterFn = this.#buildWhere(updateMatch[3], cols, params, pIdx);
			for (const row of rows) {
				if (filterFn(row)) {
					for (const entry of setEntries) {
						row[entry.colIdx] = params[entry.paramIdx];
					}
				}
			}
			return;
		}

		// DELETE
		const deleteMatch = trimmed.match(/DELETE FROM (\w+)/i);
		if (deleteMatch) {
			const table = deleteMatch[1];
			const whereMatch = trimmed.match(/WHERE\s+(.+)/i);
			if (whereMatch && params) {
				const cols = this.#columns.get(table) ?? [];
				const filterFn = this.#buildWhere(whereMatch[1], cols, params, 0);
				const rows = this.#tables.get(table) ?? [];
				this.#tables.set(
					table,
					rows.filter((r) => !filterFn(r)),
				);
			} else {
				this.#tables.set(table, []);
			}
		}
	}

	async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
		const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)/i);
		if (!selectMatch) return [];

		const table = selectMatch[2];
		const cols = this.#columns.get(table) ?? [];
		let rows = [...(this.#tables.get(table) ?? [])];

		// WHERE
		const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s*$)/i);
		if (whereMatch && params && params.length > 0) {
			const filterFn = this.#buildWhere(whereMatch[1], cols, params, 0);
			rows = rows.filter(filterFn);
		}

		// ORDER BY
		const orderMatch = sql.match(/ORDER BY\s+(\w+)\s+(ASC|DESC)/i);
		if (orderMatch) {
			const colIdx = cols.indexOf(orderMatch[1]);
			const desc = orderMatch[2].toUpperCase() === "DESC";
			if (colIdx >= 0) {
				rows.sort((a, b) => {
					const va = a[colIdx] as number;
					const vb = b[colIdx] as number;
					return desc ? vb - va : va - vb;
				});
			}
		}

		// LIMIT
		const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
		if (limitMatch) {
			rows = rows.slice(0, Number(limitMatch[1]));
		}

		// Convert raw arrays to named objects
		if (cols.length > 0) {
			return rows.map((row) => {
				const obj: Record<string, unknown> = {};
				for (let i = 0; i < cols.length; i++) {
					obj[cols[i]] = row[i];
				}
				return obj as T;
			});
		}

		return rows as T[];
	}

	async close(): Promise<void> {
		this.#tables.clear();
		this.#columns.clear();
		this.#primaryKeys.clear();
		this.#autoInc.clear();
	}

	#buildWhere(
		clause: string,
		cols: string[],
		params: unknown[],
		offset: number,
	): (row: unknown[]) => boolean {
		const conditions = clause.split(/\s+AND\s+/i);
		const checks: Array<{ colIdx: number; value: unknown }> = [];
		let pIdx = offset;
		for (const cond of conditions) {
			const m = cond.trim().match(/(\w+)\s*=\s*\?/);
			if (m) {
				const colIdx = cols.indexOf(m[1]);
				if (colIdx >= 0) checks.push({ colIdx, value: params[pIdx] });
				pIdx++;
			}
		}
		return (row: unknown[]) => checks.every((c) => row[c.colIdx] === c.value);
	}
}

// ---------------------------------------------------------------------------
// Factory — platform-aware database creation
// ---------------------------------------------------------------------------

let _db: DatabaseAdapter | null = null;

/**
 * Initialize the database. Returns the singleton adapter.
 * On native: CapacitorDatabase (real SQLite).
 * On web: InMemoryDatabase (swap for jeep-sqlite when WASM persistence needed).
 */
export async function initDatabase(): Promise<DatabaseAdapter> {
	if (_db) return _db;

	if (Capacitor.isNativePlatform()) {
		const db = new CapacitorDatabase();
		await db.open();
		_db = db;
	} else {
		_db = new InMemoryDatabase();
	}

	return _db;
}

/** Get the current database instance. Throws if not initialized. */
export function getDatabase(): DatabaseAdapter {
	if (!_db) throw new Error("Database not initialized — call initDatabase() first");
	return _db;
}

/** Close the database and clear the singleton. */
export async function closeDatabase(): Promise<void> {
	if (_db) {
		await _db.close();
		_db = null;
	}
}

/**
 * Replace the singleton with a custom adapter (for testing).
 * Returns the adapter for chaining.
 */
export function setDatabase(adapter: DatabaseAdapter): DatabaseAdapter {
	_db = adapter;
	return adapter;
}
