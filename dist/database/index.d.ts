import sqlite3 from 'sqlite3';
/**
 * Database manager class that handles all database operations
 * Uses SQLite for simplicity but designed to be easily replaceable
 * with other database systems like PostgreSQL or MySQL
 */
export declare class Database {
    private db;
    constructor();
    /**
     * Creates all necessary tables for the sports bot
     * This includes tables for teams, players, trades, games, and configuration
     */
    private initializeSchema;
    /**
     * Creates database indexes to improve query performance
     * These are especially important for frequently searched columns
     */
    private createIndexes;
    /**
     * Generic method to run SQL queries with promise support
     * This makes it easier to use async/await with the database
     */
    run(sql: string, params?: any[]): Promise<sqlite3.RunResult>;
    /**
     * Get a single row from the database
     */
    get(sql: string, params?: any[]): Promise<any>;
    /**
     * Get multiple rows from the database
     */
    all(sql: string, params?: any[]): Promise<any[]>;
    /**
     * Close the database connection
     * Important for graceful shutdown
     */
    close(): Promise<void>;
}
export declare const database: Database;
//# sourceMappingURL=index.d.ts.map