/**
 * Users.js
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
    name: {
      type: 'string'
    },
    username: {
      type: 'string'
    },
    password: {
      type: 'string'
    },
    role: {
      type: 'string',
      enum: ['admin', 'master', 'student']
    },
    sessions: {
      collection: 'sessions',
      via: 'owner'
    },
    questions: {
      collection: 'questions',
      via: 'owner'
    },
    answers: {
      collection: 'answers',
      via: 'owner'
    }
  },
  beforeCreate: function (values, next) {
    bcryptjs.genSalt(10, function (err, salt) {
      if (err) return next(err);
      bcryptjs.hash(values.password, salt, function (err, hash) {
        if (err) return next(err);
        values.password = hash;
        next();
      })
    })
  },
  beforeUpdate: function (values, next) {
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

