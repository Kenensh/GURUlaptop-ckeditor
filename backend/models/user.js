// models/User.js
import { Model, DataTypes } from 'sequelize'

class User extends Model {
  // 可以在這裡加入實例方法
  static associate(models) {
    // 在這裡定義與其他模型的關聯
  }
}

const initUser = (sequelize) => {
  User.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      gender: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      birthdate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      country: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      district: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      road_name: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      detailed_address: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      image_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      remarks: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      valid: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      google_uid: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false, // 如果不需要 updated_at
      indexes: [
        {
          unique: true,
          fields: ['email'],
        },
      ],
    }
  )

  return User
}

export default initUser
