import { DataTypes, Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

class ChatMessage extends Model {
  static associate(models) {
    ChatMessage.belongsTo(models.Chat, { foreignKey: 'chat_id' });
  }
}

function initModel(sequelize) {
  ChatMessage.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    chat_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    sender_type: {
      type: DataTypes.ENUM('business', 'client', 'system'),
      allowNull: false,
    },
    message_type: {
      type: DataTypes.STRING, // 'text', 'image', 'video', 'document', etc.
      defaultValue: 'text',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    sequelize,
    modelName: 'ChatMessage',
    tableName: 'chat_messages',
    underscored: true,
  });

  return ChatMessage;
}

export default { initModel, ChatMessage };