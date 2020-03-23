/**
 * SurveyQuestionsController
 *
 * @description :: Server-side logic for managing surveyquestions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    create: async (req, res) => {
        try {
            const contentQuestion = req.body.contentQuestion;
            const typeQuestion = req.body.typeQuestion;
            const surveyId = req.body.surveyId;
            const token = req.cookies.access_token.split(" ")[1];
            const userInfo = jwToken.decoded(token);
            const owner = userInfo.id;
            let selections = req.body.selections ? req.body.selections : [];
            if (!contentQuestion || contentQuestion === '' || !typeQuestion || typeQuestion === '') {
                return res.badRequest('Vui lòng điển đầy đủ thông tin !!!');
            }
            if (selections.length === 0) {
                return res.badRequest('Phải có tối thiểu 1 đáp án');
            }
            let surveyQuestion = await SurveyQuestions.create({
                contentQuestion: contentQuestion,
                typeQuestion: typeQuestion,
                surveyId: surveyId,
                owner: owner
            })
            if (surveyQuestion) {
                if (selections.length !== 0) {
                    let arr = [];
                    for (let index = 0; index < selections.length; index++) {
                        let selection = await Selections.create({
                            contentSelection: selections[index],
                            surveyQuestionId: surveyQuestion.id,
                        });
                        arr.push(selection);
                    }
                    surveyQuestion = { ...surveyQuestion, selections: arr };
                }
                return res.ok({
                    message: "Tạo câu khảo sát thành công",
                    surveyQuestion: surveyQuestion,
                    nameOfOwner: userInfo.name
                });
            }
        } catch (error) {
            return res.serverError(error);
        }
    },
    getbysurveyid: async (req, res) => {
        try {
            const surveyId = req.params.id;
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token); // Người dùng đang đăng nhập
            let survey = await Surveys.findOne({ id: surveyId });
            if (!survey) {
                return res.badRequest('Không tìm thấy Id phiên khảo sát');
            }
            if (!survey.joinUsers.includes(userInfo.id) && survey.password) {
                return res.ok({ message: 'Bạn cần nhập mật khẩu để tiếp tục', isJoined: false });
            }
            let user = await Users.findOne({ id: survey.owner});
            if (!user) {
                survey.nameOfOwner = "Không xác định";
            }
            else {
                survey.nameOfOwner = user.name;
            }
            isOwner = (survey.owner === userInfo.id);
            await SurveyQuestions.find({ surveyId: surveyId }).populate('selections').exec((err, surveyQuestions) => {
                if (err) {
                    return res.serverError('Database Error');
                }
                for (let i = 0; i < surveyQuestions.length; i++) {
                    for (let j = 0; j < surveyQuestions[i].selections.length; j++) {
                        if (surveyQuestions[i].selections[j].voteUsers) {
                            if (surveyQuestions[i].selections[j].voteUsers.includes(userInfo.id)) {
                                surveyQuestions[i].isResponded = true;
                                surveyQuestions[i].selections[j].isChecked = true;
                            }
                            else if (surveyQuestions[i].isResponded) {
                                surveyQuestions[i].selections[j].isChecked = false;
                            }
                            else {
                                surveyQuestions[i].isResponded = false;
                                surveyQuestions[i].selections[j].isChecked = false;
                            }
                        }
                        else if (surveyQuestions[i].isResponded) {
                            surveyQuestions[i].selections[j].isChecked = false;
                        }
                        else {
                            surveyQuestions[i].isResponded = false;
                            surveyQuestions[i].selections[j].isChecked = false;
                        }
                    }
                }
                return res.ok({ message: "Tham gia phiên hỏi đáp thành công", surveyQuestions: surveyQuestions, survey: survey, isOwner: isOwner, isJoined: true });
            });
        } catch (error) {
            return res.serverError(error);
        }
    },
    delete: (req, res) => {
        try {
            const surveyQuestionId = req.params.id;
            SurveyQuestions.destroy({ id: surveyQuestionId }).exec((err, questions) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (questions.length === 0) {
                    return res.notFound('Không tìm thấy Id câu hỏi');
                }
                else {
                    Selections.destroy({ surveyQuestionId: surveyQuestionId }).exec((err, selections) => {
                        if (err) {
                            return res.serverError('Database error');
                        }
                    });
                    return res.ok('Xóa câu hỏi thành công');
                }
            });
        } catch (error) {
            return res.serverError(error);
        }
    }
};

