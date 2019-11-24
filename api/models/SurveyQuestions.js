/**
 * SurveyQuestions.js
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
    contentQuestion: {
      type: 'string'
    },
    typeQuestion: {
      type: 'integer',
      enum: [1,2]
    },
    selections: {
      collection: 'selections',
      via: 'surveyQuestionId'
    },
    surveyId: {
      model: 'surveys'
    },
    owner: {
      model: 'users'
    }
  }
};

