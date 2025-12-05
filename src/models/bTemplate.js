// models/BTemplate.js
import { DataTypes, Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

class BTemplate extends Model {
  static associate(models) {
    BTemplate.belongsTo(models.Business, { foreignKey: 'business_id' });
  }
}

function initModel(sequelize) {
  BTemplate.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true
    },
    template_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    business_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: 'en_US'
    },
    category: {
      type: DataTypes.ENUM('TRANSACTIONAL', 'MARKETING', 'OTP','UTILITY'),
      allowNull: false
    },
    header: DataTypes.STRING,
    body: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    components: {
    type: DataTypes.JSON,  // store conversation messages or tokens
    defaultValue: [],
  },
    footer: DataTypes.STRING,
    buttons: DataTypes.JSONB,
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING'
    },
    waba_template_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'BTemplate',
    tableName: 'btemplates',
    underscored: true
  });

  return BTemplate;
}

export default { initModel, BTemplate };
