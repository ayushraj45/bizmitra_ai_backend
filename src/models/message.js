import { DataTypes, Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

class Message extends Model{
  static associate(models){
    Message.belongsTo(models.Thread, { foreignKey: 'thread_id' });
  }
}

function initModel(sequelize){

 Message.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv4,
    primaryKey: true,
  },
  thread_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  sender: {
    type: DataTypes.STRING, // 'client' or 'assistant' or 'system'
    allowNull: false,
  },
  message_type: {
    type: DataTypes.STRING, // 'text', 'image', 'event', etc.
    defaultValue: 'text',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  modelName: 'Messages',
  tableName: 'messages',
  underscored: true,
});
return Message;
};

export default {initModel, Message};
