/**
 * SessionsController
 *
 * @description :: Server-side logic for managing sessions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    create: (req, res) => {
        try {
            const topic = req.body.topic;
            const description = req.body.description;
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token);
            const owner = userInfo.id;
            if (userInfo.role === "student") {
                return res.badRequest('Bạn không đủ quyền!!!');
            }
            if (!topic || topic === '' || !description || description === '') {
                return res.badRequest('Vui lòng điển đầy đủ thông tin !!!');
            }
            Sessions.create({ topic: topic, description: description, owner: owner }).exec((err, session) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (session) {
                    return res.ok({ message: 'Tạo phiên hỏi đáp thành công', session: session, nameOfOwner: userInfo.name });
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    list: async (req, res) => {
        try {
            let sessions = await Sessions.find().populate("questions");
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token); // Người dùng đang đăng nhập
            if (!sessions) {
                return res.ok("Không có phiên nào");
            }
            for (let index = 0; index < sessions.length; index++) {
                let user = await Users.findOne({ id: sessions[index].owner });
                if (user) {
                    sessions[index].nameOfOwner = user.name;
                    if (user.id === userInfo.id || userInfo.role === "admin") {
                        sessions[index].permission = true;
                    }
                    else sessions[index].permission = false;
                } 
                else {
                    sessions[index].nameOfOwner = "Không xác định";
                    if (userInfo.role === "admin") {
                        sessions[index].permission = true;
                    }
                }
            }
            return res.ok(sessions);
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    getbyid: async (req, res) => {
        try {
            const sessionId = req.params.id;
            let session = await Sessions.findOne({ id: sessionId }).populate('questions');
            if (!session) {
                return res.badRequest('Không tìm thấy id phiên hỏi đáp');
            }
            let user = await Users.findOne({ id: session.owner });
            if (user) {
                session.nameOfOwner = user.name;
            }
            else {
                session.nameOfOwner = "Không xác định";
            }
            for (let index = 0; index < session.questions.length; index++) {
                let user = await Users.findOne({ id: session.questions[index].owner });
                if (user) {
                    session.questions[index].nameOfOwner = user.name;
                } else session.questions[index].nameOfOwner = "Không xác định";
                let answers = await Answers.find({ questionId: session.questions[index].id });
                session.questions[index].numberOfAnswers = answers.length;
            }
            return res.ok(session);
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    delete: async (req, res) => {
        try {
            const sessionId = req.params.id;
            await Sessions.destroy({ id: sessionId }).exec((err, sessions) => {
                if (err) {
                    return 1;
                }
                if (sessions.length === 0) {
                    return res.badRequest('Không tìm thấy id');
                }
                else {
                    Questions.destroy({ sessionId: sessionId }).exec((err, questions) => {
                        if (err) {
                            return res.serverError('Database error');
                        }
                        if (questions.length === 0) {
                            return res.ok('Xóa phiên hỏi đáp thành công');
                        }
                        for (let index = 0; index < questions.length; index++) {
                            Answers.destroy({ questionId: questions[index].id }).exec((err, answers) => {
                                if (err) {
                                    return res.serverError('Database error');
                                }
                            });
                        }
                        return res.ok('Xóa phiên hỏi đáp thành công');
                    });
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    edit: (req, res) => {
        try {
            const sessionId = req.params.id;
            const topic = req.body.topic;
            const description = req.body.description;
            if (!topic || topic === '' || !description || description === '') {
                return res.badRequest('Vui lòng điển đầy đủ thông tin !!!');
            }
            Sessions.update({ id: sessionId }, { topic: req.body.topic, description: req.body.description }).exec((err, sessions) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (sessions.length === 0) {
                    return res.notFound('Không tìm thấy Id phiên hỏi đáp');
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

