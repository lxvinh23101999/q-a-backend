/**
 * SurveysController
 *
 * @description :: Server-side logic for managing surveys
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
            Surveys.create({ topic: topic, description: description, closedAt: closedAt, password: password, owner: owner, joinUsers: [userInfo.id] }).exec((err, survey) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (survey) {
                    return res.ok({ message: 'Tạo phiên khảo sát thành công', survey: survey, nameOfOwner: userInfo.name });
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    joinsurvey: (req, res) => {
        try {
            const id = req.params.id;
            const password = req.body.password;
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token); // Người dùng đang đăng nhập
            if (!password || password === '') {
                return res.badRequest('Vui lòng nhập mật khẩu !!!');
            }
            Surveys.findOne({ id: id }, async (err, survey) => {
                if (err) {
                    return res.serverError('Database error');
                }
                else if (!survey) {
                    return res.badRequest('Không tìm thấy phiên hỏi đáp');
                }
                else {
                    const comparePassword = await bcryptjs.compare(password, survey.password);
                    if (comparePassword) {
                        let joinUsers = survey.joinUsers;
                        joinUsers.push(userInfo.id);
                        Surveys.update({ id: id }, { joinUsers: joinUsers }).exec((err, surveys) => {
                            if (err) {
                                return res.serverError('Database error');
                            }
                            return res.ok({ message: 'Tham gia phiên hỏi đáp thành công', isJoined: true });
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
    list: async (req, res) => {
        try {
            let surveys = await Surveys.find().populate("surveyQuestions");
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token); // Người dùng đang đăng nhập
            if (!surveys) {
                return res.ok("Không có phiên nào");
            }
            for (let index = 0; index < surveys.length; index++) {
                let user = await Users.findOne({ id: surveys[index].owner });
                if (!surveys[index].password) {
                    surveys[index].hasPassword = false;
                }
                else surveys[index].hasPassword = true;
                if (user) {
                    surveys[index].nameOfOwner = user.name;
                    if (user.id === userInfo.id || userInfo.role === "admin") {
                        surveys[index].permission = true;
                    }
                    else surveys[index].permission = false;
                }
                else {
                    surveys[index].nameOfOwner = "Không xác định";
                    if (userInfo.role === "admin") {
                        surveys[index].permission = true;
                    }
                }
            }
            return res.ok({ surveys: surveys, userInfo: userInfo });
        } catch (error) {
            return res.serverError(error);
        }
    },
    listbyadmin: async (req, res) => {
        try {
            let surveys = await Surveys.find();
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token); // Người dùng đang đăng nhập
            if (userInfo.role !== "admin") {
                return res.badRequest({ message: "Bạn không thể truy cập vào trang này" });
            }
            if (!surveys) {
                return res.ok("Không có phiên nào");
            }
            for (let index = 0; index < surveys.length; index++) {
                let user = await Users.findOne({ id: surveys[index].owner });
                if (user) {
                    surveys[index].nameOfOwner = user.name;
                }
                else {
                    surveys[index].nameOfOwner = "Không xác định";
                }
            }
            return res.ok({ surveys: surveys, userInfo: userInfo });
        } catch (error) {
            return res.serverError(error);
        }
    },
    vote: async (req, res) => {
        try {
            const surveyId = req.params.id;
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token); // Người dùng đang đăng nhập
            const result = req.body;
            let survey = await Surveys.findOne({ id: surveyId });
            if (!survey) {
                return res.badRequest('Không tìm thấy phiên khảo sát');
            }
            if (result.length === 0) {
                return res.badRequest('Chưa chọn đáp án nào cả');
            }
            for (let i = 0; i < result.length; i++) {
                let id = parseInt(result[i].selectionId);
                let surveyQuestionId = parseInt(result[i].surveyQuestionId);
                let selection = await Selections.findOne({ id: id, surveyQuestionId: surveyQuestionId });
                let voteUsers = selection.voteUsers ? selection.voteUsers : [];
                if (!voteUsers.includes(userInfo.id)) {
                    voteUsers.push(userInfo.id);
                }
                Selections.update({ id: id, surveyQuestionId: surveyQuestionId }, { voteUsers: voteUsers }).exec((err, selections) => {
                    if (err) {
                        return res.serverError(err);
                    }
                });
            }
            res.ok({ message: 'Vote thành công', userInfo: userInfo });
        } catch (error) {
            return res.serverError(error);
        }
    },
    delete: async (req, res) => {
        try {
            const surveyId = req.params.id;
            await Surveys.destroy({ id: surveyId }).exec((err, surveys) => {
                if (err) {
                    return res.serverError('Có lỗi xảy ra');
                }
                if (surveys.length === 0) {
                    return res.badRequest('Không tìm thấy id');
                }
                else {
                    SurveyQuestions.destroy({ surveyId: surveyId }).exec((err, surveyQuestions) => {
                        if (err) {
                            return res.serverError('Database error');
                        }
                        if (surveyQuestions.length === 0) {
                            return res.ok('Xóa phiên hỏi đáp thành công');
                        }
                        for (let index = 0; index < surveyQuestions.length; index++) {
                            Selections.destroy({ surveyQuestionId: surveyQuestions[index].id }).exec((err, selections) => {
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
    openSurvey: (req, res) => {
        try {
            const { id, closedAt } = req.body;
            const date = new Date(closedAt);
            if (date instanceof Date && !isNaN(date)) {
                if (new Date(date).getTime() - Date.now() < 5 * 60 * 1000) {
                    return res.badRequest("Phiên hỏi đáp phải được mở tối thiểu 5 phút")
                }
                Surveys.update({ id: id }, { closedAt: date }).exec((err, survey) => {
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
    closeSurvey: (req, res) => {
        try {
            const { id } = req.body;
            Surveys.update({ id: id }, { closedAt: Date(Date.now()) }).exec((err, survey) => {
                if (err) {
                    return res.serverError('Database Error');
                }
                return res.ok({ message: 'Thành công', closedAt: Date(Date.now()) });
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
};

