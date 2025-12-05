import { DataTypes, Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

class BClient extends Model {
  static associate(models) {
    BClient.belongsTo(models.Business, { foreignKey: 'business_id' });
    BClient.hasMany(models.Booking, { foreignKey: 'client_id' });
    BClient.hasMany(models.BTask, { foreignKey: 'client_id' });
  }
}

function initModel(sequelize) {
  BClient.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        primaryKey: true,
      },
      business_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      thread_id: {
        type: DataTypes.UUID,
      },
      name: DataTypes.STRING,
      phone_number: DataTypes.STRING,
      email: DataTypes.STRING,
      notes: DataTypes.TEXT,
      last_interaction_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'BClient',
      tableName: 'bclients',
      underscored: true,
    }
  );
  return BClient;
}

export default { initModel, BClient };
