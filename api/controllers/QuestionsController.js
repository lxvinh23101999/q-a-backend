/**
 * QuestionsController
 *
 * @description :: Server-side logic for managing questions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const _ = require('lodash');
module.exports = {
    create: (req, res) => {
        try {
            const contentQuestion = req.body.contentQuestion;
            const sessionId = req.body.sessionId;
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token);
            const owner = userInfo.id;
            if (!contentQuestion || contentQuestion === '') {
                return res.badRequest('Vui lòng điển đầy đủ thông tin !!!');
            }
            Questions.create({ contentQuestion: contentQuestion, sessionId: sessionId, owner: owner, likeUsers: [] }).exec((err, question) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (question) {
                    return res.ok({ message: 'Tạo câu hỏi thành công', question: question, nameOfOwner: userInfo.name });
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    list: (req, res) => {
        try {
            Questions.find().exec((err, questions) => {
                if (err) {
                    return res.serverError('Database error');
                }
                res.ok(questions);
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    delete: (req, res) => {
        try {
            const questionId = req.params.id;
            Questions.destroy({ id: questionId }).exec((err, questions) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (questions.length === 0) {
                    return res.notFound('Không tìm thấy Id câu hỏi');
                }
                else {
                    Answers.destroy({ questionId: questionId }).exec((err, answers) => {
                        if (err) {
                            return res.serverError('Database error');
                        }
                    });
                    return res.ok('Xóa câu hỏi thành công');
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    edit: (req, res) => {
        try {
            const questionId = req.params.id;
            const contentQuestion = req.body.contentQuestion;
            if (!contentQuestion || contentQuestion === '') {
                return res.badRequest('Vui lòng điển đầy đủ thông tin !!!');
            }
            Questions.update({ id: questionId }, { contentQuestion: req.body.contentQuestion }).exec((err, questions) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (questions.length === 0) {
                    return res.notFound('Không tìm thấy Id câu hỏi');
                }
                else {
                    return res.ok('Sửa thành công');
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    like: async (req, res) => {
        try {
            const questionId = req.params.id;
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token);
            let question = await Questions.findOne({ id: questionId });
            if (!question) {
                return res.badRequest('Không tìm thấy Id câu hỏi');
            }
            if (!question.likeUsers) {
                await Questions.update({ id: questionId }, { likeUsers: [userInfo.id] });
                res.ok('Đã thích !!!');
            }
            else {
                let likeUsers = question.likeUsers;
                if (likeUsers.includes(userInfo.id)) {
                    _.remove(likeUsers, item => {
                        return item === userInfo.id;
                    });
                    await Questions.update({ id: questionId }, { likeUsers: likeUsers });
                    res.ok('Đã bỏ thích !!!');
                }
                else {
                    likeUsers.push(userInfo.id);
                    await Questions.update({ id: questionId }, { likeUsers: likeUsers });
                    res.ok('Đã thích !!!');
                }

            }
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    }
};

