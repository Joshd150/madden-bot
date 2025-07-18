import sqlite3 from 'sqlite3';
import { config } from '../config';
import path from 'path';
import fs from 'fs';

/**
 * Database manager class that handles all database operations
 * Uses SQLite for simplicity but designed to be easily replaceable
 * with other database systems like PostgreSQL or MySQL
 */
export class Database {
  private db: sqlite3.Database;

  constructor() {
    // Ensure the data directory exists before creating the database
    const dbDir = path.dirname(config.database.path);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize SQLite database with proper error handling
    this.db = new sqlite3.Database(config.database.path, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        throw err;
      }
      console.log('Connected to SQLite database');
    });

    // Initialize database schema
    this.initializeSchema();
  }

  /**
   * Creates all necessary tables for the sports bot
   * This includes tables for teams, players, trades, games, and configuration
   */
  private initializeSchema(): void {
    const schemas = [
      // Teams table - stores information about all teams in the league
      `CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        abbreviation TEXT NOT NULL UNIQUE,
        city TEXT NOT NULL,
        logo_url TEXT,
        primary_color TEXT DEFAULT '#000000',
        secondary_color TEXT DEFAULT '#FFFFFF',
        conference TEXT,
        division TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Players table - comprehensive player information
      `CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        position TEXT NOT NULL,
        team_id INTEGER,
        jersey_number INTEGER,
        age INTEGER,
        height TEXT,
        weight INTEGER,
        college TEXT,
        years_pro INTEGER,
        salary INTEGER DEFAULT 0,
        contract_years INTEGER DEFAULT 0,
        stats_json TEXT, -- JSON field for flexible stats storage
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams (id)
      )`,

      // Trades table - tracks all trading activity
      `CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_team_id INTEGER NOT NULL,
        to_team_id INTEGER NOT NULL,
        player_ids TEXT NOT NULL, -- JSON array of player IDs
        draft_picks TEXT, -- JSON array of draft pick details
        trade_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        value_assessment TEXT,
        posted_to_discord BOOLEAN DEFAULT FALSE,
        discord_message_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_team_id) REFERENCES teams (id),
        FOREIGN KEY (to_team_id) REFERENCES teams (id)
      )`,

      // Games table - stores game information and results
      `CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        home_team_id INTEGER NOT NULL,
        away_team_id INTEGER NOT NULL,
        game_date DATETIME NOT NULL,
        week INTEGER,
        season INTEGER,
        home_score INTEGER DEFAULT 0,
        away_score INTEGER DEFAULT 0,
        status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed
        stats_json TEXT, -- Detailed game statistics
        posted_to_discord BOOLEAN DEFAULT FALSE,
        discord_message_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (home_team_id) REFERENCES teams (id),
        FOREIGN KEY (away_team_id) REFERENCES teams (id)
      )`,

      // Bot configuration table - stores Discord server settings
      `CREATE TABLE IF NOT EXISTS bot_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL UNIQUE,
        trades_channel_id TEXT,
        scores_channel_id TEXT,
        news_channel_id TEXT,
        admin_role_id TEXT,
        auto_post_trades BOOLEAN DEFAULT TRUE,
        auto_post_scores BOOLEAN DEFAULT TRUE,
        embed_color TEXT DEFAULT '#1f8b4c',
        timezone TEXT DEFAULT 'America/New_York',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // News/Updates table - for posting league news and updates
      `CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT,
        category TEXT DEFAULT 'general', -- general, trades, injuries, etc.
        priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high
        published BOOLEAN DEFAULT FALSE,
        publish_date DATETIME,
        posted_to_discord BOOLEAN DEFAULT FALSE,
        discord_message_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Statistics table - flexible stats storage for various metrics
      `CREATE TABLE IF NOT EXISTS statistics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL, -- 'player', 'team', 'league'
        entity_id INTEGER NOT NULL,
        stat_type TEXT NOT NULL, -- 'passing', 'rushing', 'receiving', etc.
        stat_name TEXT NOT NULL,
        stat_value REAL NOT NULL,
        game_id INTEGER,
        week INTEGER,
        season INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games (id)
      )`
    ];

    // Execute each schema creation statement
    schemas.forEach((schema, index) => {
      this.db.run(schema, (err) => {
        if (err) {
          console.error(`Error creating table ${index + 1}:`, err.message);
        }
      });
    });

    // Create indexes for better query performance
    this.createIndexes();
  }

  /**
   * Creates database indexes to improve query performance
   * These are especially important for frequently searched columns
   */
  private createIndexes(): void {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_players_team_id ON players (team_id)',
      'CREATE INDEX IF NOT EXISTS idx_players_position ON players (position)',
      'CREATE INDEX IF NOT EXISTS idx_trades_date ON trades (trade_date)',
      'CREATE INDEX IF NOT EXISTS idx_games_date ON games (game_date)',
      'CREATE INDEX IF NOT EXISTS idx_games_teams ON games (home_team_id, away_team_id)',
      'CREATE INDEX IF NOT EXISTS idx_statistics_entity ON statistics (entity_type, entity_id)',
      'CREATE INDEX IF NOT EXISTS idx_statistics_type ON statistics (stat_type, stat_name)',
      'CREATE INDEX IF NOT EXISTS idx_bot_config_guild ON bot_config (guild_id)',
    ];

    indexes.forEach(index => {
      this.db.run(index, (err) => {
        if (err) {
          console.error('Error creating index:', err.message);
        }
      });
    });
  }

  /**
   * Generic method to run SQL queries with promise support
   * This makes it easier to use async/await with the database
   */
  public run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  /**
   * Get a single row from the database
   */
  public get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Get multiple rows from the database
   */
  public all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Close the database connection
   * Important for graceful shutdown
   */
  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }
}

// Export a singleton instance for use throughout the application
export const database = new Database();