/**
 * QuestionsController
 *
 * @description :: Server-side logic for managing questions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	create: (req,res) => {
        try {
            const contentQuestion = req.body.contentQuestion;
            const sessionId = req.body.sessionId;
            const owner = req.body.owner;
            if (!contentQuestion || contentQuestion === '') {
                return res.badRequest('Vui lòng điển đầy đủ thông tin !!!');
            }
            Questions.create({contentQuestion: contentQuestion, sessionId: sessionId, owner: owner}).exec((err, question) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (question) {
                    return res.ok('Tạo câu hỏi thành công');
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    list: (req,res) => {
        try {
            Questions.find().exec((err, questions) =>{
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
            Questions.destroy({id: questionId}).exec((err, questions) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (questions.length === 0) {
                    return res.notFound('Không tìm thấy Id câu hỏi');
                }
                else {
                    Answers.destroy({questionId: questionId}).exec((err, answers) => {
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
            Questions.update({id: questionId},{ contentQuestion: req.body.contentQuestion }).exec((err, questions) => {
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
    }
};

