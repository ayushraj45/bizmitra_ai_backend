import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { pathToFileURL } from 'url';

dotenv.config();

const rdsCa = fs.readFileSync("ap-south-1-bundle.pem");

const __dirname = path.resolve(); // for ESM
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
  ssl: {
    require: true,
    ca: [rdsCa], // Trusts only this CA
  }
},
});

const models = {};

// Dynamically import all models
const modelsDir = path.join(__dirname, 'src','models');
const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));

for (const file of modelFiles) {
  const filePath = path.join(modelsDir, file);
const { default: modelDef } = await import(pathToFileURL(filePath).href);
  
  // Check for initModel (like in previous example)
  if (typeof modelDef.initModel === 'function') {
    const model = modelDef.initModel(sequelize);
    models[model.name] = model;
  }
}

// Optional: setup associations if you have them
Object.values(models).forEach(model => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

await sequelize.sync({ alter: true }); // only for dev

export { sequelize, models };
