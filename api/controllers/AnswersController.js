/**
 * AnswersController
 *
 * @description :: Server-side logic for managing answers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	create: (req,res) => {
        try {
            const contentAnswer = req.body.contentAnswer;
            const questionId = req.body.questionId;
            const owner = req.body.owner;
            if (!contentAnswer || contentAnswer === '') {
                return res.badRequest('Vui lòng điển đầy đủ thông tin !!!');
            }
            Answers.create({contentAnswer: contentAnswer, questionId: questionId, owner: owner}).exec((err, answer) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (answer) {
                    return res.ok('Tạo câu trả lời thành công');
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    list: (req,res) => {
        try {
            Answers.find().exec((err, answers) =>{
                if (err) {
                    return res.serverError('Database error');
                }
                res.ok(answers);
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    delete: (req, res) => {
        try {
            const answerId = req.params.id;
            Answers.destroy({id: answerId}).exec((err, answers) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (answers.length === 0) {
                    return res.notFound('Không tìm thấy Id câu trả lời');
                }
                else {
                    return res.ok('Xóa câu trả lời thành công');
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    edit: (req, res) => {
        try {
            const answerId = req.params.id;
            const contentAnswer = req.body.contentAnswer;
            if (!contentAnswer || contentAnswer === '') {
                return res.badRequest('Vui lòng điển đầy đủ thông tin !!!');
            }
            Answers.update({id: answerId},{ contentAnswer: req.body.contentAnswer }).exec((err, answers) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (answers.length === 0) {
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

