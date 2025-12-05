import { DataTypes, Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

class Booking extends Model{
  static associate(models) {
    Booking.belongsTo(models.Business, { foreignKey: 'business_id' });
    Booking.belongsTo(models.BClient, { foreignKey: 'client_id' });
  }

   static initHooks(models) {
    Booking.afterCreate(async (booking, options) => {
      if (booking.client_id) {
        const client = await models.BClient.findByPk(booking.client_id);
        if (client && client.name) {
          booking.client_name = client.name;
          await booking.save({ transaction: options.transaction });
        }
      }
    });
  }
}

function initModel(sequelize){
  Booking.init({
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
      allowNull: false
    },
    client_name: {
      type: DataTypes.STRING, 
      allowNull: true
    },
    event_id: DataTypes.STRING,
    session_type: DataTypes.STRING,
    start_time: DataTypes.DATE,
    end_time: DataTypes.DATE,
    status: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    payment_status: DataTypes.ENUM('unpaid', 'paid', 'proof_requested'),
    notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings',
    underscored: true
  });

  return Booking;

  
  };

export default {initModel, Booking}
