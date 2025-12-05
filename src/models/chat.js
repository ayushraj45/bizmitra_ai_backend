import { DataTypes, Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

class Chat extends Model {
  static associate(models) {
    Chat.hasMany(models.ChatMessage, { foreignKey: 'chat_id' });
    Chat.belongsTo(models.BClient, { foreignKey: 'client_id' });
    Chat.belongsTo(models.Business, { foreignKey: 'business_id' });
  }
}

function initModel(sequelize) {
  Chat.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    business_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    thread_id:{
        type: DataTypes.UUID,
        allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'closed', 'archived'),
      defaultValue: 'active',
    },
    last_message_timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    sequelize,
    modelName: 'Chat',
    tableName: 'chats',
    underscored: true,
    timestamps: true
  });

  return Chat;
}

export default { initModel, Chat };