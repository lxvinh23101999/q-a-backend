/**
 * UsersController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const jwt = require('jsonwebtoken');
const tokenSecret = "secretissecet";
const bcryptjs = require('bcryptjs');
module.exports = {
    create: (req, res) => {
        try {
            const name = req.body.name;
            const username = req.body.username;
            const password = req.body.password;
            const confirmPassword = req.body.confirmPassword;
            const role = req.body.role;
            if (!name || name === '' || !username || username === '' || !password || password === '' || !confirmPassword || confirmPassword === '' || !role || role === '') {
                return res.badRequest('Vui lòng điển đầy đủ thông tin !!!');
            }
            if (password !== confirmPassword) {
                return res.badRequest('Xác nhận mật khẩu không đúng.');
            }
            Users.findOne({ username: username }).exec((err, user) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (user) {
                    return res.badRequest('Username đã tồn tại !!!');
                }
                else {
                    Users.create({ name: name, username: username, password: password, role: role }).exec((err, user) => {
                        if (err) {
                            return res.serverError('Database error');
                        }
                        if (user) {
                            return res.ok({ message: 'Tạo tài khoản thành công', user: user });
                        }
                    });
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    list: (req, res) => {
        try {
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token); // Người dùng đang đăng nhập
            if (userInfo.role !== "admin") {
                return res.badRequest({message: "Bạn không thể truy cập vào trang này"});
            }
            Users.find().exec((err, users) => {
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
    resetPassword: (req, res) => {
        try {
            const userId = req.params.id;
            // Cần phải xác nhận admin ở bước này 
            Users.findOne({ id: userId }).exec((err, user) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (!user) {
                    return res.notFound('Không tìm thấy Id người dùng');
                }
                else {
                    console.log(user.username);
                    Users.update({ id: userId }, { password: user.username }).exec((err, users) => {
                        if (err) {
                            return res.serverError('Database error');
                        }
                        return res.ok('Đặt lại mật khẩu thành công');
                    });
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    changeRole: (req, res) => {
        try {
            const userId = req.params.id;
            // Cần phải xác nhận admin ở bước này 
            Users.findOne({ id: userId }).exec((err, user) => {
                if (err) {
                    return res.serverError('Database error');
                }
                if (!user) {
                    return res.badRequest('Không tìm thấy Id người dùng');
                }
                else if (user.role === "admin") {
                    return res.badRequest('Không thể thay đổi vai trò của người dùng này');
                }
                else {
                    let role = user.role === "master" ? "student" : "master";
                    Users.update({ id: userId }, { role: role }).exec((err, users) => {
                        if (err) {
                            return res.serverError(err);
                        }
                        return res.ok({ message: 'Đổi vai trò thành công', role: role });
                    });
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
                        Users.update({ id: userId }, { password: newPassword }).exec((err, users) => {
                            if (err) {
                                return res.serverError('Database error');
                            }
                            return res.ok('Đổi mật khẩu thành công');
                        });
                    }
                }
            });
        } catch (error) {
            return res.serverError('Internal Server Error');
        }
    },
    getUserById: (req, res) => {
        try {
            const token = req.cookies.access_token.split(' ')[1];
            const userInfo = jwToken.decoded(token); // Người dùng đang đăng nhập
            Users.findOne({id: userInfo.id}).populate('questions').populate('answers').exec((err, user) => {
                if (err) {
                    return res.badRequest('Không tìm thấy Id người dùng');
                }
                return res.ok(user);
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
                        return res.cookie('access_token', 'Bearer ' + jwToken.issue(data), {
                            maxAge: 10*60*1000,
                            httpOnly: true
                        }).ok(data);
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
    logout: (req, res) => {
        try {
            res.clearCookie('access_token').ok('Logout thành công');
        } catch (error) {
            return res.serverError('Có lỗi xảy ra');
        }
    }
};

