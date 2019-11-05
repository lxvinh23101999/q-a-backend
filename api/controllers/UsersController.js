/**
 * UsersController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const bcryptjs = require('bcryptjs');
module.exports = {
    create: (req, res) => {
        try {
            const name = req.body.name;
            const username = req.body.username;
            const password = req.body.password;
            const role = req.body.role;
            if (!username || username === '') {
                return res.badRequest('Username không được để trống !!!');
            }
            if (!password || password === '') {
                return res.badRequest('Password không được để trống !!!');
            }
            if (!name || name === '' || !role || role === '') {
                return res.badRequest('Vui lòng điển đầy đủ thông tin !!!');
            }
            Users.findOne({ username: username }).exec((err, user) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (user) {
                    return res.badRequest('Username đã tồn tại !!!');
                }
                else {
                    bcryptjs.genSalt(10, async (err, salt) => {
                        if (err) {
                            return res.serverError("Có lỗi xảy ra");
                        }
                        bcryptjs.hash(req.body.password, salt, (err, hash) => {
                            if (err) {
                                return res.serverError("Có lỗi xảy ra");
                            }
                            Users.create({ name: req.body.name, username: req.body.username, password: hash, role: req.body.role }).exec((err, user) => {
                                if (err) {
                                    return res.serverError('Database error');
                                }
                                if (user) {
                                    return res.ok('Tạo tài khoản thành công');
                                }
                            });
                        });
                    });
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    list: (req, res) => {
        try {
            Users.find().populate('sessions').exec((err, users) => {
                if (err) {
                    return res.serverError('Database error');
                }
                return res.ok(users);
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    delete: (req, res) => {
        try {
            const userId = req.params.id;
            Users.destroy({ id: userId }).exec((err, users) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (users.length === 0) {
                    return res.notFound('Không tìm thấy Id người dùng');
                }
                else {
                    return res.ok('Xóa người dùng thành công');
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    edit: (req, res) => {
        try {
            const userId = req.params.id;
            const oldPassword = req.body.oldPassword;
            const newPassword = req.body.newPassword;
            Users.findOne({ id: userId }).exec(async (err, user) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (!user) {
                    return res.notFound('Không tìm thấy Id người dùng');
                }
                else if (!oldPassword || oldPassword === '' || !newPassword || newPassword === '') {
                    return res.badRequest('Vui lòng điển đầy đủ thông tin');
                }
                else {
                    const comparePassword = await bcryptjs.compare(oldPassword, user.password);
                    if (!comparePassword) {
                        return res.badRequest('Mật khẩu cũ không đúng');
                    }
                    else {
                        bcryptjs.genSalt(10, (err, salt) => {
                            if (err) {
                                return res.serverError("Có lỗi xảy ra");
                            }
                            bcryptjs.hash(req.body.newPassword, salt, (err, hash) => {
                                if (err) {
                                    return res.serverError("Có lỗi xảy ra");
                                }
                                Users.update({ id: userId }, { password: hash }).exec((err, users) => {
                                    if (err) {
                                        return res.serverError('Database error');
                                    }
                                    return res.ok('Sửa thành công');
                                });
                            });
                        });

                    }
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    login: (req, res) => {
        try {
            const username = req.body.username;
            const password = req.body.password;
            if (!username || username === '') {
                return res.badRequest('Username không được để trống !!!');
            }
            if (!password || password === '') {
                return res.badRequest('Password không được để trống !!!');
            }
            Users.findOne({ username: username }, async (err, user) => {
                if (err) {
                    return res.serverError('Database error');
                }
                else if (!user) {
                    return res.badRequest('Username không đúng !!!');
                }
                else {
                    const comparePassword = await bcryptjs.compare(password, user.password);
                    if (comparePassword) {
                        let data = { id: user.id, name: user.name, role: user.role };
                        return res.cookie('access_token','Bearer ' + jwToken.issue(data), {
                            maxAge: 600 * 1000,
                            httpOnly: true
                          }).ok(jwToken.issue(data));
                    }
                    else {
                        return res.badRequest('Password không đúng !!!');
                    }
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    // logout: (req, res) => {
    //     try {
    //         console.log(req.session);
    //         res.ok('Logout thành công');
    //     } catch (error) {
    //         return res.serverError('Internal Server Error');
    //     }
    // }
};

