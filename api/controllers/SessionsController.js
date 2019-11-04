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
            const owner = req.body.owner;
            if (!topic || topic === '' || !description || description === '') {
                return res.badRequest('Vui lòng điển đầy đủ thông tin !!!');
            }
            Sessions.create({ topic: topic, description: description, owner: owner }).exec((err, session) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (session) {
                    return res.ok('Tạo session thành công');
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    list:async (req, res) => {
        try {
            let subSessions = [];
            Sessions.find().populate('questions').exec(async (err, sessions) => {
                if (err) {
                    return res.serverError('Database error');
                }
                await sessions.forEach((session,index) => {
                    Users.findOne({id: session.owner}).exec((err, user) => {
                        if (err) {
                            return res.serverError('Database error');
                        }
                        if (user) {
                            session.nameOfOwner = user.name;
                            subSessions.push(session);
                            console.log(1);
                        }
                        else sessions[index].nameOfOwner = "Không xác định";
                    });
                });
                console.log(2);
                return res.ok(sessions);
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    getbyid: (req, res) => {
        try {
            const sessionId = req.params.id;
            Sessions.findOne({id: sessionId}).populate('questions').exec((err, session) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (!session) {
                    return res.badRequest('Không tìm thấy id phiên hỏi đáp');
                }
                else {
                    
                    return res.ok(session);
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    delete: (req, res) => {
        try {
            const sessionId = req.params.id;
            Sessions.destroy({ id: sessionId }).exec((err, sessions) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (sessions.length === 0) {
                    return res.notFound('Không tìm thấy Id phiên hỏi đáp');
                }
                else {
                    Questions.destroy({ sessionId: sessionId }).exec((err, questions) => {
                        if (err) {
                            return res.serverError('Database error');
                        }
                        questions.forEach((question) => {
                            Answers.destroy({ questionId: question.id }).exec((err, answer) => {
                                if (err) {
                                    return res.serverError('Database error');
                                }
                            });
                        });
                    });
                    return res.ok('Xóa phiên hỏi đáp thành công');
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
            Sessions.update({id: sessionId},{ topic: req.body.topic, description: req.body.description }).exec((err, sessions) => {
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

