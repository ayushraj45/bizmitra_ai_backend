import { DataTypes, Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

class Thread extends Model{
  static associate(models){}

  static initHooks() {
    this.afterUpdate(async (thread, options) => {
      if (Array.isArray(thread.context) && thread.context.length > 20) {
      // Keep only the last 20 items
      const trimmedContext = thread.context.slice(-20);
      thread.context = trimmedContext;
      await thread.save({ transaction: options.transaction });
  } 
});
  }
}

function initModel(sequelize){
Thread.init(
  {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv4,
    primaryKey: true,
  },
  assistantThread_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  client_id: DataTypes.UUID,
  business_id:DataTypes.UUID,
  client_phone_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    previousResponse_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  context: {
    type: DataTypes.JSON,  // store conversation messages or tokens
    defaultValue: [],
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active',  // active, closed, etc
  }
}, {
  sequelize,
  modelName: 'Thread',
  tableName: 'threads',
  underscored: true,
});

Thread.initHooks();

return Thread; 

};

export default { initModel, Thread};
