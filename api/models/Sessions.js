/**
 * Sessions.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
const bcryptjs = require('bcryptjs');
module.exports = {

  attributes: {
    id: {
      primaryKey: true,
      type: 'integer',
      autoIncrement: true
    },
    password: {
      type: 'string'
    },
    topic: {
      type: 'string'
    },
    description: {
      type: 'string'
    },
    closedAt: {
      type: 'datetime'
    },
    owner: {
      model: 'users'
    },
    questions: {
      collection: 'questions',
      via: 'sessionId'
    },
  },
  beforeCreate: function (values, next) {
    if (!values.password) {
      next();
    }
    else {
      bcryptjs.genSalt(10, function (err, salt) {
        if (err) return next(err);
        bcryptjs.hash(values.password, salt, function (err, hash) {
          if (err) return next(err);
          values.password = hash;
          next();
        })
      })
    }
  },
};

