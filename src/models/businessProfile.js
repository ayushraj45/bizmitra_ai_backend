import { DataTypes, Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import generateSystemPrompt from '../utils/generateSystemPrompt.js'; // adjust if needed

class BusinessProfile extends Model {
  static associate(models) {
    BusinessProfile.belongsTo(models.Business, { foreignKey: 'business_id' });
  }

  static initHooks() {
    BusinessProfile.afterCreate(async (profile, options) => {
      const business = await profile.getBusiness();
      profile.system_prompt = generateSystemPrompt(business, profile);
      await profile.save({ hooks: false }); // avoid infinite loop
    });

    BusinessProfile.afterUpdate(async (profile, options) => {
      const business = await profile.getBusiness();
      profile.system_prompt = generateSystemPrompt(business, profile);
      await profile.save({ hooks: false });
    });
  }
}

function initModel(sequelize) {
  BusinessProfile.init(
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
      tone: DataTypes.STRING,
      services: DataTypes.JSON, // [{ name: 'Haircut', price: 30 }]
      about: DataTypes.TEXT,
      instructions: DataTypes.TEXT,
      notes: DataTypes.TEXT,
      website: DataTypes.STRING,
      hours_of_operation: DataTypes.STRING,
      timezone: DataTypes.STRING,
      business_type: DataTypes.STRING,
      system_prompt: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'BusinessProfile',
      tableName: 'business_profiles',
      underscored: true,
    }
  );

  BusinessProfile.initHooks(); // ⬅️ Call hooks here after .init()

  return BusinessProfile;
}

export default { initModel, BusinessProfile };
