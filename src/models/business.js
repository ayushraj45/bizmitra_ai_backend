import { DataTypes, Model} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

class Business extends Model{
  static associate(models){
    Business.hasMany(models.BClient, { foreignKey: 'business_id' });
    Business.hasMany(models.Booking, { foreignKey: 'business_id' });
    Business.hasMany(models.BTask, { foreignKey: 'business_id' });
    Business.hasOne(models.BusinessProfile, { foreignKey: 'business_id' });
  }
}
 
function initModel(sequelize){

  Business.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true
    },
    name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    phone_number: DataTypes.STRING,
    whatsapp_number: DataTypes.STRING,
    business_type: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    timezone: DataTypes.STRING,
    gcal_refresh_token: DataTypes.STRING,
    hours_of_operation: DataTypes.JSON,
    waba_access_token: DataTypes.TEXT,
    waba_business_token: DataTypes.TEXT,
    customer_business_id: DataTypes.STRING,
    api_key: DataTypes.STRING,
    api_key_created_at: DataTypes.DATE,
    api_key_last_used_at: DataTypes.DATE,
    api_key_usage_count: DataTypes.INTEGER,
    affiliate_source: DataTypes.STRING,
    waba_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
  },
    phone_number_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Business',
    tableName: 'businesses',
    underscored: true
  });

  return Business;
  };

 export default {initModel, Business};

