import { DataTypes, Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

class BTask extends Model {
  static associate(models){
    BTask.belongsTo(models.Business, { foreignKey: 'business_id' });
    BTask.belongsTo(models.BClient, { foreignKey: 'client_id', allowNull: true });
  }

  static initHooks(models) {
    BTask.afterCreate(async (btask, options) => {
      if (btask.client_id) {
        const client = await models.BClient.findByPk(btask.client_id);
        if (client && client.name) {
          btask.client_name = client.name;
          await btask.save({ transaction: options.transaction });
        }
      }
    });
  }
}

function initModel(sequelize){
  BTask.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true
    },
    business_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    client_name:{
      type: DataTypes.STRING,
      allowNull: true
    },
    message_log_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    description: DataTypes.TEXT,
    status: DataTypes.ENUM('open', 'in_progress', 'resolved'),
    priority: DataTypes.ENUM('low', 'medium', 'high'),
    created_by: DataTypes.ENUM('system', 'agent', 'business'),
    resolved_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'BTask',
    tableName: 'btasks',
    underscored: true
  });

  BTask.initHooks(sequelize.models); // Initialize hooks after .init()
  
  return BTask;
   
  };

export default {initModel, BTask};

