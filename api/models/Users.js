/**
 * Users.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
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
  }
};

