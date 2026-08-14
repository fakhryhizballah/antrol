# Relational Database Model Documentation

This document serves as a quick reference for writing and maintaining
ORM‑based models in the **antrol** codebase.  The project uses
**Sequelize** (Node.js) to map JavaScript classes to relational tables.

## 1. Project Structure

```
models/
  ├─ <model_name>.js   # Sequelize model definition
  └─ index.js          # Exports all models and initializes Sequelize
```

Each model file follows the same pattern:

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const <ModelName> = sequelize.define('<table_name>', {
  // column definitions
});

module.exports = <ModelName>;
```

The `index.js` file in the `models` directory imports all models and
establishes associations.

## 2. Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Model class | PascalCase | `Pasien`, `Dokter` |
| Table name | snake_case, plural | `pasien`, `dokter` |
| Primary key | `id` | `id` |
| Foreign key | `<model>_id` | `dokter_id` |
| Timestamps | `createdAt`, `updatedAt` | automatically added by Sequelize |

## 3. Column Types

| Sequelize Type | SQL Equivalent | Notes |
|----------------|----------------|-------|
| `DataTypes.STRING` | `VARCHAR` | Use `allowNull: false` for required fields |
| `DataTypes.INTEGER` | `INT` | For numeric IDs |
| `DataTypes.DATE` | `DATETIME` | For timestamps |
| `DataTypes.BOOLEAN` | `BOOLEAN` | For flags |
| `DataTypes.TEXT` | `TEXT` | For long strings |

## 4. Associations

Define relationships in `models/index.js` after all models are loaded.

```js
const Pasien = require('./pasien');
const Dokter = require('./dokter');

Pasien.belongsTo(Dokter, { foreignKey: 'dokter_id' });
Dokter.hasMany(Pasien, { foreignKey: 'dokter_id' });
```

Supported association types:

* `belongsTo`
* `hasOne`
* `hasMany`
* `belongsToMany` (through a join table)

