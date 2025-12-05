import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { pathToFileURL } from 'url';

dotenv.config(); 

const __dirname = path.resolve();

// SSL Configuration
let dialectOptions = {};
if (process.env.DB_SSL_CA_PATH) {
  try {
    const rdsCa = fs.readFileSync(path.resolve(process.env.DB_SSL_CA_PATH));
    dialectOptions = {
      ssl: {
        require: true,
        ca: [rdsCa],
      },
    };
  } catch (error) {
    console.warn("Warning: SSL Certificate defined but not found at path. connecting without specific CA.");
  }
} else if (process.env.NODE_ENV === 'production') {
   dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false 
      }
   }
}

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries
  dialectOptions: dialectOptions,
});

const models = {};

const loadModels = async () => {
  const modelsDir = path.join(__dirname, 'src', 'models');
  
  if (fs.existsSync(modelsDir)) {
    const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));

    for (const file of modelFiles) {
      const filePath = path.join(modelsDir, file);
      const { default: modelDef } = await import(pathToFileURL(filePath).href);

      if (modelDef && typeof modelDef.initModel === 'function') {
        const model = modelDef.initModel(sequelize);
        models[model.name] = model;
      }
    }

    // Setup associations
    Object.values(models).forEach(model => {
      if (typeof model.associate === 'function') {
        model.associate(models);
      }
    });
  } else {
    console.warn('Models directory not found. Skipping model loading.');
  }
};

await loadModels();

export { sequelize, models };