/**
 * SessionsController
 *
 * @description :: Server-side logic for managing sessions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const bcryptjs = require('bcryptjs');
module.exports = {
    create: (req, res) => {
        try {
            const topic = req.body.topic;
            const description = req.body.description;
            const password = !req.body.password ? null : req.body.password;
            const closedAt = !req.body.closedAt ? null : req.body.closedAt;
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token);
            const owner = userInfo.id;
            if (userInfo.role === "student") {
                return res.badRequest('Bạn không đủ quyền!!!');
            }
            if (!topic || topic === '' || !description || description === '') {
                return res.badRequest('Vui lòng điển đầy đủ thông tin !!!');
            }
            if (closedAt) {
                if (new Date(closedAt).getTime() - Date.now() < 5 * 60 * 1000) { // ngày đóng phải hơn tối thiểu 5 phút so với hiện tại
                    return res.badRequest(`Ngày đóng phải lớn hơn ${(new Date(Date.now() + 5 * 60 * 1000)).toLocaleString()}`);
                }
            }
            Sessions.create({ topic: topic, description: description, password: password, closedAt: closedAt, owner: owner, joinUsers: [userInfo.id] }).exec((err, session) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (session) {
                    return res.ok({ message: 'Tạo phiên hỏi đáp thành công', session: session, nameOfOwner: userInfo.name, owner: userInfo.id });
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
                if (!sessions[index].password) {
                    sessions[index].hasPassword = false;
                }
                else sessions[index].hasPassword = true;
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
            return res.ok({ sessions: sessions, userInfo: userInfo });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    listbyadmin: async (req, res) => {
        try {
            let sessions = await Sessions.find();
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token); // Người dùng đang đăng nhập
            if (userInfo.role !== "admin") {
                return res.badRequest({ message: "Bạn không thể truy cập vào trang này" });
            }
            if (!sessions) {
                return res.ok("Không có phiên nào");
            }
            for (let index = 0; index < sessions.length; index++) {
                let user = await Users.findOne({ id: sessions[index].owner });
                if (user) {
                    sessions[index].nameOfOwner = user.name;
                }
                else {
                    sessions[index].nameOfOwner = "Không xác định";
                }
            }
            return res.ok({ sessions: sessions, userInfo: userInfo });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    getbyid: async (req, res) => {
        try {
            const sessionId = req.params.id;
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token); // Người dùng đang đăng nhập
            let session = await Sessions.findOne({ id: sessionId }).populate('questions');
            if (!session) {
                return res.badRequest('Không tìm thấy id phiên hỏi đáp');
            }
            if (!session.joinUsers.includes(userInfo.id) && session.password) {
                return res.ok({ message: 'Bạn cần nhập mật khẩu để tiếp tục', isJoined: false });
            }
            let sessionCreater = await Users.findOne({ id: session.owner }); // Người tạo phiên hỏi đáp
            if (sessionCreater) {
                session.nameOfOwner = sessionCreater.name;
            }
            else {
                session.nameOfOwner = "Không xác định";
            }
            for (let index = 0; index < session.questions.length; index++) {
                if (session.questions[index].likeUsers && session.questions[index].likeUsers.includes(userInfo.id)) {
                    session.questions[index].isLiked = true;
                }
                else session.questions[index].isLiked = false;
                let user = await Users.findOne({ id: session.questions[index].owner });
                if (user) {
                    session.questions[index].nameOfOwner = user.name;
                    if (user.id === userInfo.id || userInfo.role === "admin" || userInfo.id === sessionCreater.id) {
                        session.questions[index].deletePermission = true;
                    }
                    else session.questions[index].deletePermission = false;
                }
                else {
                    session.questions[index].nameOfOwner = "Không xác định";
                    if (userInfo.role === "admin" || userInfo.id === sessionCreater.id) {
                        session.questions[index].deletePermission = true;
                    }
                }
                let answers = await Answers.find({ questionId: session.questions[index].id });
                session.questions[index].numberOfAnswers = answers.length;
            }
            return res.ok({ message: "Tham gia phiên hỏi đáp thành công", session: session, isJoined: true });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    joinsession: (req, res) => {
        try {
            const id = req.params.id;
            const password = req.body.password;
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token); // Người dùng đang đăng nhập
            if (!password || password === '') {
                return res.badRequest('Vui lòng nhập mật khẩu !!!');
            }
            Sessions.findOne({ id: id }, async (err, session) => {
                if (err) {
                    return res.serverError('Database error');
                }
                else if (!session) {
                    return res.badRequest('Không tìm thấy phiên hỏi đáp');
                }
                else {
                    const comparePassword = await bcryptjs.compare(password, session.password);
                    if (comparePassword) {
                        let joinUsers = session.joinUsers;
                        joinUsers.push(userInfo.id);
                        Sessions.update({id: id}, {joinUsers: joinUsers}).exec((err, sessions) => {
                            if (err) {
                                return res.serverError('Database error');
                            }
                            return res.ok({message: 'Tham gia phiên hỏi đáp thành công', isJoined: true});
                        });
                    }
                    else {
                        return res.badRequest('Mật khẩu không đúng !!!');
                    }
                }
            });
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
    openSession: (req, res) => {
        try {
            const { id, closedAt } = req.body;
            const date = new Date(closedAt);
            // console.log(date instanceof Date && !isNaN(date));
            if (date instanceof Date && !isNaN(date)) {
                if (new Date(date).getTime() - Date.now() < 5 * 60 * 1000) {
                    return res.badRequest("Phiên hỏi đáp phải được mở tối thiểu 5 phút")
                }
                Sessions.update({ id: id }, { closedAt: date }).exec((err, session) => {
                    if (err) {
                        return res.serverError('Database Error');
                    }
                    return res.ok({ message: 'Thành công', closedAt: date });
                });
            }
            else {
                return res.badRequest('Không đúng định dạng');
            }
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    closeSession: (req, res) => {
        try {
            const { id } = req.body;
            Sessions.update({ id: id }, { closedAt: Date(Date.now()) }).exec((err, session) => {
                if (err) {
                    return res.serverError('Database Error');
                }
                return res.ok({ message: 'Thành công', closedAt: Date(Date.now()) });
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

