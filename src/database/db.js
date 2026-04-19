import * as SQLite from 'expo-sqlite'

let db

try {
  db = SQLite.openDatabaseSync('tareaya.db')
} catch (e) {
  console.log('Error abriendo DB:', e)
}

export const initDB = () => {
  try {
    db.execSync(`PRAGMA journal_mode = WAL;`)
    db.execSync(`PRAGMA foreign_keys = ON;`)

    db.execSync(`
      CREATE TABLE IF NOT EXISTS hijos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        grado TEXT,
        color TEXT DEFAULT '#5B4FCF',
        foto TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `)

    db.execSync(`
      CREATE TABLE IF NOT EXISTS materias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        color TEXT DEFAULT '#1D9E75',
        hijo_id INTEGER,
        FOREIGN KEY (hijo_id) REFERENCES hijos(id) ON DELETE CASCADE
      );
    `)

    db.execSync(`
      CREATE TABLE IF NOT EXISTS tareas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descripcion TEXT DEFAULT '',
        materia_id INTEGER,
        hijo_id INTEGER NOT NULL,
        tipo TEXT DEFAULT 'tarea',
        prioridad TEXT DEFAULT 'media',
        estado TEXT DEFAULT 'pendiente',
        fecha_entrega TEXT,
        foto_adjunta TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL,
        FOREIGN KEY (hijo_id) REFERENCES hijos(id) ON DELETE CASCADE
      );
    `)

    db.execSync(`
      CREATE TABLE IF NOT EXISTS recordatorios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tarea_id INTEGER NOT NULL,
        fecha_hora TEXT NOT NULL,
        mensaje TEXT DEFAULT '',
        repeticion TEXT DEFAULT 'una_vez',
        activo INTEGER DEFAULT 1,
        FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE
      );
    `)

  } catch (error) {
    console.log('DB init error:', error)
  }
}

export default db