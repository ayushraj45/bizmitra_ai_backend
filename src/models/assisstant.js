import { DataTypes, Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

class Assistant extends Model{
  static associate(models){
    Assistant.belongsTo(models.Business, { foreignKey: 'user_id' }); 
  }
}

function initModel(sequelize){
 Assistant.init( {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv4,
    primaryKey: true,
  },
  user_id: {                         // Reference to the Business or User owning this assistant
    type: DataTypes.UUID,
    allowNull: false,
  },
  assistant_id: {                   // OpenAI Assistant ID (string from OpenAI)
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  name: {                          // Friendly name for this assistant
    type: DataTypes.STRING,
    allowNull: false,
  },
  instructions: {                  // JSON or text instructions given to OpenAI
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tools_config: {                  // JSON storing what functions/tools this assistant uses
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  status: {                       // Optional: active, inactive etc
    type: DataTypes.STRING,
    defaultValue: 'active',
  }
}, {
  sequelize,
  modelName: 'Assistant',
  tableName: 'assistants',
  underscored: true,
});

return Assistant;
};

export default {Assistant, initModel};
