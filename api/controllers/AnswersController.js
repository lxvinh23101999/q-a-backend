/**
 * AnswersController
 *
 * @description :: Server-side logic for managing answers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    create: (req, res) => {
        try {
            const contentAnswer = req.body.contentAnswer;
            const questionId = req.body.questionId;
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token);
            const owner = userInfo.id;
            if (!contentAnswer || contentAnswer === '') {
                return res.badRequest('Vui lòng điển đầy đủ thông tin !!!');
            }
            Answers.create({ contentAnswer: contentAnswer, questionId: questionId, owner: owner, likeUsers: [] }).exec((err, answer) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (answer) {
                    return res.ok({ message: 'Tạo câu trả lời thành công', answer: answer, nameOfOwner: userInfo.name });
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    list: (req, res) => {
        try {
            Answers.find().exec((err, answers) => {
                if (err) {
                    return res.serverError('Database error');
                }
                res.ok(answers);
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    getbyquestionid: async (req, res) => {
        try {
            const questionId = req.params.id;
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token); // Người dùng đang đăng nhập
            let question = await Questions.findOne({ id: questionId });
            if (!question) {
                return res.badRequest("Không tìm thấy câu hỏi");
            }
            let answers = await Answers.find({ questionId: questionId })
            if (answers.length === 0) {
                return res.ok("Không có câu trả lời");
            }
            for (let index = 0; index < answers.length; index++) {
                if (answers[index].likeUsers && answers[index].likeUsers.includes(userInfo.id)) {
                    answers[index].isLiked = true;
                }
                else answers[index].isLiked = false;
                let user = await Users.findOne({ id: answers[index].owner });
                if (user) {
                    answers[index].nameOfOwner = user.name;
                    if (user.id === userInfo.id) {
                        answers[index].editPermission = true;
                    }
                    if (user.id === userInfo.id || userInfo.role === "admin" || userInfo.id === question.owner) {
                        answers[index].deletePermission = true;
                    }
                    else answers[index].deletePermission = false;
                }
                else {
                    answers[index].nameOfOwner = "Không xác định";
                    if (userInfo.role === "admin" || userInfo.id === question.owner) {
                        answers[index].deletePermission = true;
                    }
                }
            }
            return res.ok(answers);
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    delete: (req, res) => {
        try {
            const answerId = req.params.id;
            Answers.destroy({ id: answerId }).exec((err, answers) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (answers.length === 0) {
                    return res.notFound('Không tìm thấy Id câu trả lời');
                }
                else {
                    return res.ok({ message: 'Xóa câu trả lời thành công', answers: answers });
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    edit: async (req, res) => {
        try {
            const answerId = req.params.id;
            const contentAnswer = req.body.contentAnswer;
            if (!contentAnswer || contentAnswer === '') {
                return res.badRequest('Vui lòng điển đầy đủ thông tin !!!');
            }
            let answer = await Answers.findOne({ id: answerId });
            if (answer.contentAnswer === contentAnswer) {
                return res.badRequest('Vui lòng sửa lại câu trả lời !!!');
            }
            await Answers.update({ id: answerId }, { contentAnswer: req.body.contentAnswer }).exec((err, answers) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (answers.length === 0) {
                    return res.notFound('Không tìm thấy Id câu hỏi');
                }
                else {
                    return res.ok({ message: 'Sửa thành công', answer: answers[0] });
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    like: async (req, res) => {
        try {
            const answerId = req.params.id;
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token);
            let answer = await Answers.findOne({ id: answerId });
            if (!answer) {
                return res.badRequest('Không tìm thấy Id câu trả lời');
            }
            let updatedAt = answer.updatedAt;
            if (!answer.likeUsers) {
                await Answers.update({ id: answerId }, { likeUsers: [userInfo.id] });
                res.ok('Đã thích !!!');
            }
            else {
                let likeUsers = answer.likeUsers;
                if (likeUsers.includes(userInfo.id)) {
                    _.remove(likeUsers, item => {
                        return item === userInfo.id;
                    });
                    await Answers.update({ id: answerId }, { likeUsers: likeUsers });
                    res.ok('Đã bỏ thích !!!');
                }
                else {
                    likeUsers.push(userInfo.id);
                    await Answers.update({ id: answerId }, { likeUsers: likeUsers });
                    res.ok('Đã thích !!!');
                }
            }
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    }
};

